// Runner local de la migracion 002 (ecommerce) — PostgreSQL local.
// Uso: node migrations/runEcommerce.js   (ejecutar desde Api/)
// Idempotente: seguro ejecutarlo varias veces.
// Produccion (Neon) se migra a mano con migrations/002_ecommerce_orders.sql.
//
// NOTA: el runner NO ejecuta BORRADOS. Solo crea tablas/columnas/indices
// y agrega restricciones CHECK que falten (con guardas).

const { sequelize } = require("../DataBase/db.js");

const statements = [
  // 0. Catalogo: flag combo en articulos
  `ALTER TABLE articulos ADD COLUMN IF NOT EXISTS combo BOOLEAN NOT NULL DEFAULT false;`,

  // 1. Variantes de precio DTF
  `CREATE TABLE IF NOT EXISTS dtf_price_variants (
    id UUID PRIMARY KEY,
    "dtfId" UUID NOT NULL REFERENCES dtfs (id) ON UPDATE CASCADE ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    precio INTEGER NOT NULL,
    medidas VARCHAR(100),
    color VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS dtf_price_variants_dtf_id_idx ON dtf_price_variants ("dtfId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS dtf_price_variants_unique_idx
     ON dtf_price_variants ("dtfId", tipo, COALESCE(medidas, ''), COALESCE(color, ''));`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dtf_price_variants_precio_check') THEN
       ALTER TABLE dtf_price_variants
         ADD CONSTRAINT dtf_price_variants_precio_check CHECK (precio >= 0);
     END IF;
   END $$;`,

  // 2. Pedidos
  `CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    "orderNumber" VARCHAR(30) NOT NULL UNIQUE,
    "userId" UUID NOT NULL REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente_pago',
    "paymentStatus" VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    currency CHAR(3) NOT NULL DEFAULT 'COP',
    subtotal INTEGER NOT NULL DEFAULT 0,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    "recipientName" VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20),
    notes TEXT,
    "shippingZone" VARCHAR(50),
    "trackingCarrier" VARCHAR(100),
    "trackingNumber" VARCHAR(100),
    "shippedAt" TIMESTAMPTZ,
    "deliveredAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "stockReservedUntil" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders ("userId");`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);`,
  `CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders ("paymentStatus");`,
  `CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders ("createdAt" DESC);`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
       ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
         'pendiente_pago', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'
       ));
     END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check') THEN
       ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK ("paymentStatus" IN (
         'pendiente', 'aprobado', 'rechazado', 'anulado', 'reembolsado', 'en_revision'
       ));
     END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_amounts_check') THEN
       ALTER TABLE orders ADD CONSTRAINT orders_amounts_check CHECK (
         subtotal >= 0 AND "shippingCost" >= 0 AND "discountTotal" >= 0 AND total >= 0
       );
     END IF;
   END $$;`,

  // 3. Detalle del pedido
  `CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY,
    "orderId" UUID NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "productType" VARCHAR(20) NOT NULL,
    "productId" UUID,
    "variantId" UUID REFERENCES dtf_price_variants (id) ON UPDATE CASCADE ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    "imageUrl" TEXT,
    size VARCHAR(50),
    oversize BOOLEAN NOT NULL DEFAULT false,
    "shirtColor" VARCHAR(50),
    "shirtName" VARCHAR(100),
    "dtfSize" VARCHAR(30),
    "unitPrice" INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "productSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items ("orderId");`,
  `CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items ("productType", "productId");`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_type_check') THEN
       ALTER TABLE order_items
         ADD CONSTRAINT order_items_product_type_check CHECK ("productType" IN ('articulo', 'dtf'));
     END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_amounts_check') THEN
       ALTER TABLE order_items ADD CONSTRAINT order_items_amounts_check CHECK (
         "unitPrice" >= 0 AND quantity > 0 AND "lineTotal" >= 0
         AND "lineTotal" = "unitPrice" * quantity
       );
     END IF;
   END $$;`,

  // 4. Pagos
  `CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    "orderId" UUID NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    provider VARCHAR(30) NOT NULL DEFAULT 'wompi',
    reference VARCHAR(100) NOT NULL UNIQUE,
    "providerTransactionId" VARCHAR(100) UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    "amountInCents" BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'COP',
    "paymentMethodType" VARCHAR(50),
    "wompiStatus" VARCHAR(50),
    "rawPayload" JSONB,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments ("orderId");`,
  `CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_check') THEN
       ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN (
         'pendiente', 'aprobado', 'rechazado', 'anulado', 'reembolsado', 'error'
       ));
     END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_check') THEN
       ALTER TABLE payments ADD CONSTRAINT payments_amount_check CHECK ("amountInCents" > 0);
     END IF;
   END $$;`,

  // 5. Historial unificado
  `CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY,
    "orderId" UUID NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL DEFAULT 'logistica',
    "fromStatus" VARCHAR(30),
    "toStatus" VARCHAR(30) NOT NULL,
    "changedByUserId" UUID REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE SET NULL,
    note TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx
     ON order_status_history ("orderId", "createdAt" DESC);`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_kind_check') THEN
       ALTER TABLE order_status_history
         ADD CONSTRAINT order_status_history_kind_check CHECK (kind IN ('logistica', 'pago'));
     END IF;
   END $$;`,
];

const run = async () => {
  console.log("🔌 Conectando a la base de datos local...");

  const transaction = await sequelize.transaction();
  try {
    for (const sql of statements) {
      await sequelize.query(sql, { transaction });
      const label = sql.replace(/\s+/g, " ").slice(0, 80);
      console.log(`✔  ${label}...`);
    }
    await transaction.commit();
    console.log("✅ Migracion 002 aplicada");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migracion 002 fallida, rollback aplicado:", error.message);
    throw error;
  }

  const [constraints] = await sequelize.query(
    `SELECT conrelid::regclass::text AS tabla, conname AS restriccion,
            pg_get_constraintdef(oid) AS definicion
       FROM pg_constraint
      WHERE conrelid IN ('orders'::regclass, 'order_items'::regclass,
                         'payments'::regclass, 'dtf_price_variants'::regclass,
                         'order_status_history'::regclass)
        AND contype = 'c'
      ORDER BY tabla, conname;`,
  );
  console.log("\n📋 CHECK aplicados:");
  console.table(constraints);

  const [combo] = await sequelize.query(
    `SELECT column_name, data_type, column_default
       FROM information_schema.columns
      WHERE table_name = 'articulos' AND column_name = 'combo';`,
  );
  console.log("\n📋 articulos.combo:", combo[0]);
};

run()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(error);
    await sequelize.close();
    process.exit(1);
  });
