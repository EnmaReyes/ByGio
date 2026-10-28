// Migracion idempotente del sistema de precios.
//
// Se ejecuta al arrancar la API (local y produccion) para no depender de
// `sequelize.sync()` ni de un runner manual en Neon. Usa una transaccion y
// un advisory lock para que dos instancias no migren a la vez.
//
// Que hace:
//   1. Crea price_variants y product_prices.
//   2. Agrega order_items.priceSnapshot.
//   3. Siembra la tarifa global desde los precios actuales.
//   4. Conserva como excepcion cualquier articulo/DTF con precio distinto.
//   5. Migra los combos y los descuentos (precio anterior real).
//   6. Elimina el esquema viejo (articulos.cost/descuento y
//      dtf_price_variants) despues de copiar los datos.

const { sequelize } = require("./db.js");

const DEFAULT_PRICES = [
  { productType: "articulo", tipo: "basico", precio: 35000 },
  { productType: "articulo", tipo: "oversize", precio: 60000 },
  { productType: "dtf", tipo: "basico", precio: 22000 },
  { productType: "dtf", tipo: "oversize", precio: 32000 },
];

const tableExists = async (table, transaction) => {
  const [rows] = await sequelize.query(
    "SELECT to_regclass($1) AS name",
    { bind: [`public.${table}`], transaction },
  );
  return Boolean(rows?.[0]?.name);
};

const columnExists = async (table, column, transaction) => {
  const [rows] = await sequelize.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1`,
    { bind: [table, column], transaction },
  );
  return rows.length > 0;
};

const seedGlobalPrices = async (
  transaction,
  { hasCost, hasOldDtfTable },
) => {
  const articleRows = hasCost
    ? (
        await sequelize.query(
          `SELECT oversize, cost, count(*)::int AS n
             FROM articulos
            WHERE COALESCE(combo, false) = false
              AND cost > 0
            GROUP BY oversize, cost
            ORDER BY oversize, n DESC, cost DESC`,
          { transaction },
        )
      )[0]
    : [];

  const dtfRows = hasOldDtfTable
    ? (
        await sequelize.query(
          `SELECT tipo, precio, count(*)::int AS n
             FROM dtf_price_variants
            WHERE precio > 0
            GROUP BY tipo, precio
            ORDER BY tipo, n DESC, precio DESC`,
          { transaction },
        )
      )[0]
    : [];

  const pick = (rows, predicate, fallback) =>
    Number(rows.find(predicate)?.precio ?? rows.find(predicate)?.cost ?? fallback);

  const values = [
    {
      productType: "articulo",
      tipo: "basico",
      precio: pick(articleRows, (row) => !row.oversize, 35000),
    },
    {
      productType: "articulo",
      tipo: "oversize",
      precio: pick(articleRows, (row) => row.oversize, 60000),
    },
    {
      productType: "dtf",
      tipo: "basico",
      precio: pick(dtfRows, (row) => row.tipo === "basico", 22000),
    },
    {
      productType: "dtf",
      tipo: "oversize",
      precio: pick(dtfRows, (row) => row.tipo === "oversize", 32000),
    },
  ];

  for (const item of values) {
    await sequelize.query(
      `INSERT INTO price_variants
        (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NULL, true, now(), now())
       ON CONFLICT ("productType", tipo) DO NOTHING`,
      {
        bind: [item.productType, item.tipo, item.precio],
        transaction,
      },
    );
  }
};

const migrateLegacyArticles = async (transaction) => {
  // Precio unitario: solo se crea excepcion si el precio actual difiere de
  // la tarifa global o si hay un precio anterior real.
  await sequelize.query(
    `INSERT INTO product_prices
       (id, "productType", "productId", tipo, kind, precio, "precioAnterior", activo, "createdAt", "updatedAt")
     SELECT
       gen_random_uuid(),
       'articulo',
       a.id,
       CASE WHEN a.oversize THEN 'oversize' ELSE 'basico' END,
       'unit',
       a.cost,
       CASE WHEN a.descuento > a.cost THEN a.descuento ELSE NULL END,
       true,
       now(),
       now()
     FROM articulos a
     JOIN price_variants pv
       ON pv."productType" = 'articulo'
      AND pv.tipo = CASE WHEN a.oversize THEN 'oversize' ELSE 'basico' END
     WHERE COALESCE(a.combo, false) = false
       AND a.cost IS NOT NULL
       AND a.cost > 0
       AND (
         a.cost <> pv.precio
         OR COALESCE(a.descuento, 0) > 0
       )
     ON CONFLICT ("productType", "productId", tipo, kind) DO NOTHING`,
    { transaction },
  );

  // Combo: es un articulo con un precio propio, independiente de la talla.
  await sequelize.query(
    `INSERT INTO product_prices
       (id, "productType", "productId", tipo, kind, precio, "precioAnterior", activo, "createdAt", "updatedAt")
     SELECT
       gen_random_uuid(),
       'articulo',
       a.id,
       'unico',
       'combo',
       a.cost,
       CASE WHEN a.descuento > a.cost THEN a.descuento ELSE NULL END,
       true,
       now(),
       now()
     FROM articulos a
     WHERE COALESCE(a.combo, false) = true
       AND a.cost IS NOT NULL
       AND a.cost > 0
     ON CONFLICT ("productType", "productId", tipo, kind) DO NOTHING`,
    { transaction },
  );
};

const migrateLegacyDtf = async (transaction) => {
  await sequelize.query(
    `INSERT INTO product_prices
       (id, "productType", "productId", tipo, kind, precio, "precioAnterior", activo, "createdAt", "updatedAt")
     SELECT DISTINCT ON (v."dtfId", v.tipo)
       gen_random_uuid(),
       'dtf',
       v."dtfId",
       v.tipo,
       'unit',
       v.precio,
       NULL,
       true,
       now(),
       now()
     FROM dtf_price_variants v
     JOIN price_variants pv
       ON pv."productType" = 'dtf'
      AND pv.tipo = v.tipo
     WHERE v.activo = true
       AND v.precio > 0
       AND v.precio <> pv.precio
     ORDER BY v."dtfId", v.tipo, v."updatedAt" DESC
     ON CONFLICT ("productType", "productId", tipo, kind) DO NOTHING`,
    { transaction },
  );
};

const backfillOrderPriceSnapshots = async (transaction) => {
  // DTF: el id de la variante vieja permite reconstruir el precio.
  await sequelize.query(
    `UPDATE order_items oi
        SET "priceSnapshot" = jsonb_build_object(
          'source', 'legacy',
          'priceVariantId', oi."variantId",
          'productType', 'dtf',
          'tipo', v.tipo,
          'precio', v.precio,
          'capturedAt', oi."createdAt"
        )
       FROM dtf_price_variants v
      WHERE oi."variantId" = v.id
        AND (
          oi."priceSnapshot" IS NULL
          OR oi."priceSnapshot" = '{}'::jsonb
        )`,
    { transaction },
  );

  // Articulos: el precio cobrado ya esta en unitPrice.
  await sequelize.query(
    `UPDATE order_items
        SET "priceSnapshot" = jsonb_build_object(
          'source', 'legacy',
          'productType', 'articulo',
          'precio', "unitPrice",
          'capturedAt', "createdAt"
        )
      WHERE "productType" = 'articulo'
        AND (
          "priceSnapshot" IS NULL
          OR "priceSnapshot" = '{}'::jsonb
        )`,
    { transaction },
  );
};

const ensurePricingSchema = async () => {
  const transaction = await sequelize.transaction();

  try {
    // Serializa la migracion entre instancias (Vercel puede arrancar varias).
    await sequelize.query("SELECT pg_advisory_xact_lock(2147483001)", {
      transaction,
    });

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS price_variants (
        id UUID PRIMARY KEY,
        "productType" VARCHAR(20) NOT NULL CHECK ("productType" IN ('articulo', 'dtf')),
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('basico', 'oversize')),
        precio INTEGER NOT NULL CHECK (precio > 0),
        "precioAnterior" INTEGER CHECK ("precioAnterior" IS NULL OR "precioAnterior" > precio),
        activo BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE ("productType", tipo)
      )`,
      { transaction },
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS product_prices (
        id UUID PRIMARY KEY,
        "productType" VARCHAR(20) NOT NULL CHECK ("productType" IN ('articulo', 'dtf')),
        "productId" UUID NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'unico' CHECK (tipo IN ('basico', 'oversize', 'unico')),
        kind VARCHAR(20) NOT NULL DEFAULT 'unit' CHECK (kind IN ('unit', 'combo')),
        precio INTEGER NOT NULL CHECK (precio > 0),
        "precioAnterior" INTEGER CHECK ("precioAnterior" IS NULL OR "precioAnterior" > precio),
        activo BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE ("productType", "productId", tipo, kind)
      )`,
      { transaction },
    );

    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS product_prices_product_idx
         ON product_prices ("productType", "productId")`,
      { transaction },
    );

    const hasPriceSnapshot = await columnExists(
      "order_items",
      "priceSnapshot",
      transaction,
    );
    if (!hasPriceSnapshot) {
      await sequelize.query(
        `ALTER TABLE order_items
           ADD COLUMN "priceSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb`,
        { transaction },
      );
    }

    const hasCombo = await columnExists("articulos", "combo", transaction);
    if (!hasCombo) {
      await sequelize.query(
        `ALTER TABLE articulos
           ADD COLUMN combo BOOLEAN NOT NULL DEFAULT false`,
        { transaction },
      );
    }

    const hasCost = await columnExists("articulos", "cost", transaction);
    const hasDescuento = await columnExists(
      "articulos",
      "descuento",
      transaction,
    );
    const hasOldDtfTable = await tableExists(
      "dtf_price_variants",
      transaction,
    );

    if (hasCost && !hasDescuento) {
      await sequelize.query(
        `ALTER TABLE articulos
           ADD COLUMN descuento INTEGER NOT NULL DEFAULT 0`,
        { transaction },
      );
    }

    await seedGlobalPrices(transaction, { hasCost, hasOldDtfTable });

    if (hasCost) {
      await migrateLegacyArticles(transaction);
    }

    if (hasOldDtfTable) {
      await migrateLegacyDtf(transaction);
      await backfillOrderPriceSnapshots(transaction);
    }

    // Esquema viejo: se elimina despues de copiar los datos. Solo se toca si
    // existe, para que los arranques posteriores no tomen locks innecesarios.
    if (hasOldDtfTable) {
      await sequelize.query(
        `ALTER TABLE order_items
           DROP CONSTRAINT IF EXISTS order_items_variantId_fkey`,
        { transaction },
      );

      await sequelize.query(
        "DROP TABLE IF EXISTS dtf_price_variants CASCADE",
        { transaction },
      );
    }

    if (hasCost) {
      await sequelize.query(
        "ALTER TABLE articulos DROP COLUMN IF EXISTS cost",
        { transaction },
      );
    }
    if (hasCost || hasDescuento) {
      await sequelize.query(
        "ALTER TABLE articulos DROP COLUMN IF EXISTS descuento",
        { transaction },
      );
    }

    // Si por alguna razon la tabla quedo vacia (primer arranque sin datos),
    // deja una tarifa minima para que el catalogo no quede sin precios.
    await sequelize.query(
      `INSERT INTO price_variants
        (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
       SELECT gen_random_uuid(), v."productType", v.tipo, v.precio, NULL, true, now(), now()
       FROM jsonb_to_recordset($1::jsonb) AS v("productType" text, tipo text, precio int)
       ON CONFLICT ("productType", tipo) DO NOTHING`,
      {
        bind: [JSON.stringify(DEFAULT_PRICES)],
        transaction,
      },
    );

    await transaction.commit();
    console.log("✅ Esquema de precios verificado");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error migrando el esquema de precios:", error);
    throw error;
  }
};

module.exports = { ensurePricingSchema };
