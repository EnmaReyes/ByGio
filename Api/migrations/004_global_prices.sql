-- =====================================================================
-- Migracion 004 — Precios globales, excepciones y combos
-- PostgreSQL / Neon. Idempotente: se puede ejecutar varias veces.
--
-- Produccion (Neon): ejecutar este archivo completo en el SQL editor.
-- Local:             el backend ya la aplica solo al arrancar
--                    (Api/DataBase/ensurePricing.js).
--
-- IMPORTANTE SOBRE LAS "ASOCIACIONES":
--   product_prices."productId" es polimorfico: puede ser un articulo o un
--   DTF. Por eso NO tiene una FK simple (no se puede apuntar a dos tablas
--   con una sola columna). Ademas, el precio es dato de catalogo y el
--   producto puede borrarse; los pedidos guardan su propio priceSnapshot.
--   price_variants no cuelga de ningun producto: es la tarifa global.
--
--   La unica FK vieja que estorba es la de order_items."variantId" hacia
--   dtf_price_variants: se elimina aqui porque el nuevo backend guarda en
--   "variantId" ids de price_variants/product_prices, que no existen en la
--   tabla vieja y romperian la FK al crear pedidos.
--
-- Esta migracion es ADITIVA: NO borra articulos.cost/descuento ni la tabla
-- dtf_price_variants, para que el backend viejo siga funcionando mientras
-- haces el despliegue. El backend nuevo los elimina automaticamente en su
-- primer arranque. Al final del archivo dejo el bloque de limpieza manual
-- por si prefieres ejecutarlo tu mismo despues del deploy.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Ajustes a las tablas existentes
-- ---------------------------------------------------------------------

-- Flag de combo en articulos (el monto vive en product_prices).
ALTER TABLE articulos
  ADD COLUMN IF NOT EXISTS combo BOOLEAN NOT NULL DEFAULT false;

-- Autor de articulos y DTF. El modelo ya los declara, pero produccion no
-- tenia dtfs.uid y Sequelize fallaba con "column Dtf.uid does not exist".
ALTER TABLE articulos
  ADD COLUMN IF NOT EXISTS uid UUID;

ALTER TABLE dtfs
  ADD COLUMN IF NOT EXISTS uid UUID;

-- FK e indice de autor para articulos y DTF. Se agregan solo si no existe
-- una FK sobre esa columna, para no duplicar restricciones.
DO $migration$
DECLARE
  article_uid_attnum smallint;
  dtf_uid_attnum smallint;
BEGIN
  SELECT attnum INTO article_uid_attnum
    FROM pg_attribute
   WHERE attrelid = 'articulos'::regclass
     AND attname = 'uid'
     AND NOT attisdropped;

  IF article_uid_attnum IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'articulos'::regclass
       AND contype = 'f'
       AND conkey = ARRAY[article_uid_attnum]
  ) THEN
    ALTER TABLE articulos
      ADD CONSTRAINT articulos_uid_fkey
      FOREIGN KEY (uid) REFERENCES usuarios (id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  SELECT attnum INTO dtf_uid_attnum
    FROM pg_attribute
   WHERE attrelid = 'dtfs'::regclass
     AND attname = 'uid'
     AND NOT attisdropped;

  IF dtf_uid_attnum IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'dtfs'::regclass
       AND contype = 'f'
       AND conkey = ARRAY[dtf_uid_attnum]
  ) THEN
    ALTER TABLE dtfs
      ADD CONSTRAINT dtfs_uid_fkey
      FOREIGN KEY (uid) REFERENCES usuarios (id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS articulos_uid_idx ON articulos (uid);
CREATE INDEX IF NOT EXISTS dtfs_uid_idx ON dtfs (uid);

-- Snapshot de precio aplicado en cada linea de pedido.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS "priceSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Quitar la FK vieja de order_items."variantId" -> dtf_price_variants.
-- Se buscan todas las FK de esa columna por si el nombre generado por
-- Sequelize/Neon no es exactamente order_items_variantId_fkey.
DO $migration$
DECLARE
  fk record;
  variant_attnum smallint;
BEGIN
  SELECT attnum INTO variant_attnum
    FROM pg_attribute
   WHERE attrelid = 'order_items'::regclass
     AND attname = 'variantId'
     AND NOT attisdropped;

  IF variant_attnum IS NOT NULL THEN
    FOR fk IN
      SELECT conname
        FROM pg_constraint
       WHERE conrelid = 'order_items'::regclass
         AND contype = 'f'
         AND conkey = ARRAY[variant_attnum]
    LOOP
      EXECUTE format('ALTER TABLE order_items DROP CONSTRAINT %I', fk.conname);
    END LOOP;
  END IF;
END
$migration$;

-- Compatibilidad mientras convive el backend viejo:
-- el backend nuevo inserta articulos sin cost/descuento, asi que las
-- columnas viejas deben aceptar NULL y tener default. Si no existen, no
-- se hace nada. El backend nuevo las elimina despues.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'articulos'
       AND column_name = 'cost'
  ) THEN
    ALTER TABLE articulos ALTER COLUMN cost DROP NOT NULL;
    ALTER TABLE articulos ALTER COLUMN cost SET DEFAULT 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'articulos'
       AND column_name = 'descuento'
  ) THEN
    ALTER TABLE articulos ALTER COLUMN descuento DROP NOT NULL;
    ALTER TABLE articulos ALTER COLUMN descuento SET DEFAULT 0;
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------
-- 2. Tarifa global
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS price_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productType"   VARCHAR(20) NOT NULL,
  tipo            VARCHAR(50) NOT NULL,
  precio          INTEGER NOT NULL,
  "precioAnterior" INTEGER,
  activo          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_variants
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Unique real para permitir ON CONFLICT ("productType", tipo).
-- Si la tabla ya la creo ensurePricing con una constraint equivalente,
-- no se duplica.
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
     WHERE t.relname = 'price_variants'
       AND i.indisunique
       AND i.indpred IS NULL
       AND (
         SELECT array_agg(a.attname::text ORDER BY a.attnum)
           FROM pg_attribute a
          WHERE a.attrelid = i.indrelid
            AND a.attnum = ANY(i.indkey)
       ) = ARRAY['productType', 'tipo']
  ) THEN
    CREATE UNIQUE INDEX price_variants_product_type_tipo_unique
      ON price_variants ("productType", tipo);
  END IF;
END
$migration$;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'price_variants'::regclass
       AND conname = 'price_variants_product_type_check'
  ) THEN
    ALTER TABLE price_variants
      ADD CONSTRAINT price_variants_product_type_check
      CHECK ("productType" IN ('articulo', 'dtf'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'price_variants'::regclass
       AND conname = 'price_variants_tipo_check'
  ) THEN
    ALTER TABLE price_variants
      ADD CONSTRAINT price_variants_tipo_check
      CHECK (tipo IN ('basico', 'oversize'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'price_variants'::regclass
       AND conname = 'price_variants_precio_check'
  ) THEN
    ALTER TABLE price_variants
      ADD CONSTRAINT price_variants_precio_check
      CHECK (precio > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'price_variants'::regclass
       AND conname = 'price_variants_precio_anterior_check'
  ) THEN
    ALTER TABLE price_variants
      ADD CONSTRAINT price_variants_precio_anterior_check
      CHECK ("precioAnterior" IS NULL OR "precioAnterior" > precio);
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------
-- 3. Excepciones por producto y precios de combo
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productType"   VARCHAR(20) NOT NULL,
  "productId"     UUID NOT NULL,
  tipo            VARCHAR(50) NOT NULL DEFAULT 'unico',
  kind            VARCHAR(20) NOT NULL DEFAULT 'unit',
  precio          INTEGER NOT NULL,
  "precioAnterior" INTEGER,
  activo          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_prices
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
     WHERE t.relname = 'product_prices'
       AND i.indisunique
       AND i.indpred IS NULL
       AND (
         SELECT array_agg(a.attname::text ORDER BY a.attnum)
           FROM pg_attribute a
          WHERE a.attrelid = i.indrelid
            AND a.attnum = ANY(i.indkey)
       ) = ARRAY['productType', 'productId', 'tipo', 'kind']
  ) THEN
    CREATE UNIQUE INDEX product_prices_product_tipo_kind_unique
      ON product_prices ("productType", "productId", tipo, kind);
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS product_prices_product_idx
  ON product_prices ("productType", "productId");

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'product_prices'::regclass
       AND conname = 'product_prices_product_type_check'
  ) THEN
    ALTER TABLE product_prices
      ADD CONSTRAINT product_prices_product_type_check
      CHECK ("productType" IN ('articulo', 'dtf'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'product_prices'::regclass
       AND conname = 'product_prices_tipo_check'
  ) THEN
    ALTER TABLE product_prices
      ADD CONSTRAINT product_prices_tipo_check
      CHECK (tipo IN ('basico', 'oversize', 'unico'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'product_prices'::regclass
       AND conname = 'product_prices_kind_check'
  ) THEN
    ALTER TABLE product_prices
      ADD CONSTRAINT product_prices_kind_check
      CHECK (kind IN ('unit', 'combo'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'product_prices'::regclass
       AND conname = 'product_prices_precio_check'
  ) THEN
    ALTER TABLE product_prices
      ADD CONSTRAINT product_prices_precio_check
      CHECK (precio > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'product_prices'::regclass
       AND conname = 'product_prices_precio_anterior_check'
  ) THEN
    ALTER TABLE product_prices
      ADD CONSTRAINT product_prices_precio_anterior_check
      CHECK ("precioAnterior" IS NULL OR "precioAnterior" > precio);
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------
-- 4. Sembrar la tarifa global desde los precios actuales
--    Si las columnas viejas ya no existen, se usan los defaults.
-- ---------------------------------------------------------------------

DO $migration$
DECLARE
  has_cost boolean;
  has_old_dtf boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'articulos'
       AND column_name = 'cost'
  ) INTO has_cost;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'dtf_price_variants'
  ) INTO has_old_dtf;

  IF has_cost THEN
    EXECUTE $sql$
      INSERT INTO price_variants
        (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'articulo', 'basico',
             COALESCE((
               SELECT cost
                 FROM articulos
                WHERE oversize = false
                  AND COALESCE(combo, false) = false
                  AND cost > 0
                GROUP BY cost
                ORDER BY count(*) DESC, cost DESC
                LIMIT 1
             ), 35000),
             NULL, true, now(), now()
      ON CONFLICT ("productType", tipo) DO NOTHING
    $sql$;

    EXECUTE $sql$
      INSERT INTO price_variants
        (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'articulo', 'oversize',
             COALESCE((
               SELECT cost
                 FROM articulos
                WHERE oversize = true
                  AND COALESCE(combo, false) = false
                  AND cost > 0
                GROUP BY cost
                ORDER BY count(*) DESC, cost DESC
                LIMIT 1
             ), 60000),
             NULL, true, now(), now()
      ON CONFLICT ("productType", tipo) DO NOTHING
    $sql$;
  END IF;

  IF has_old_dtf THEN
    EXECUTE $sql$
      INSERT INTO price_variants
        (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'dtf', 'basico',
             COALESCE((
               SELECT precio
                 FROM dtf_price_variants
                WHERE tipo = 'basico'
                  AND precio > 0
                GROUP BY precio
                ORDER BY count(*) DESC, precio DESC
                LIMIT 1
             ), 22000),
             NULL, true, now(), now()
      ON CONFLICT ("productType", tipo) DO NOTHING
    $sql$;

    EXECUTE $sql$
      INSERT INTO price_variants
        (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'dtf', 'oversize',
             COALESCE((
               SELECT precio
                 FROM dtf_price_variants
                WHERE tipo = 'oversize'
                  AND precio > 0
                GROUP BY precio
                ORDER BY count(*) DESC, precio DESC
                LIMIT 1
             ), 32000),
             NULL, true, now(), now()
      ON CONFLICT ("productType", tipo) DO NOTHING
    $sql$;
  END IF;
END
$migration$;

-- Fallback: deja las 4 tarifas minimas si no se pudo leer nada del esquema
-- viejo (primer arranque, tabla vacia o migracion ya aplicada).
INSERT INTO price_variants
  (id, "productType", tipo, precio, "precioAnterior", activo, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'articulo', 'basico',   35000, NULL, true, now(), now()),
  (gen_random_uuid(), 'articulo', 'oversize', 60000, NULL, true, now(), now()),
  (gen_random_uuid(), 'dtf',      'basico',   22000, NULL, true, now(), now()),
  (gen_random_uuid(), 'dtf',      'oversize', 32000, NULL, true, now(), now())
ON CONFLICT ("productType", tipo) DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. Conservar precios propios y combos como excepciones
-- ---------------------------------------------------------------------

DO $migration$
DECLARE
  has_cost boolean;
  has_descuento boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'articulos'
       AND column_name = 'cost'
  ) INTO has_cost;

  IF NOT has_cost THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'articulos'
       AND column_name = 'descuento'
  ) INTO has_descuento;

  IF NOT has_descuento THEN
    EXECUTE 'ALTER TABLE articulos ADD COLUMN descuento INTEGER NOT NULL DEFAULT 0';
  END IF;

  -- Precio unitario propio: solo si difiere de la tarifa global o si hay
  -- un precio anterior real (descuento).
  EXECUTE $sql$
    INSERT INTO product_prices
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
    ON CONFLICT ("productType", "productId", tipo, kind) DO NOTHING
  $sql$;

  -- Combos: precio unico, independiente de la talla.
  EXECUTE $sql$
    INSERT INTO product_prices
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
    ON CONFLICT ("productType", "productId", tipo, kind) DO NOTHING
  $sql$;
END
$migration$;

-- Excepciones de DTF: solo si el precio viejo difiere de la tarifa global.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'dtf_price_variants'
  ) THEN
    EXECUTE $sql$
      INSERT INTO product_prices
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
      ON CONFLICT ("productType", "productId", tipo, kind) DO NOTHING
    $sql$;
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------
-- 6. Snapshot historico de pedidos
-- ---------------------------------------------------------------------

-- Articulos: el precio cobrado ya esta en unitPrice.
UPDATE order_items
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
   );

-- DTF: se reconstruye desde la variante vieja usando variantId.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'dtf_price_variants'
  ) THEN
    EXECUTE $sql$
      UPDATE order_items oi
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
         )
    $sql$;
  END IF;
END
$migration$;

COMMIT;

-- =====================================================================
-- Verificacion
-- =====================================================================
-- SELECT "productType", tipo, precio, "precioAnterior"
--   FROM price_variants
--  ORDER BY "productType", tipo;
--
-- SELECT "productType", kind, count(*) AS total
--   FROM product_prices
--  GROUP BY "productType", kind
--  ORDER BY "productType", kind;
--
-- SELECT count(*) FILTER (WHERE "priceSnapshot" = '{}'::jsonb) AS pedidos_sin_snapshot,
--        count(*) AS total_lineas
--   FROM order_items;
-- =====================================================================

-- =====================================================================
-- LIMPIEZA MANUAL (OPCIONAL)
-- Ejecutar SOLO despues de desplegar el backend nuevo. El propio backend
-- la hace en su primer arranque; este bloque queda por si prefieres
-- hacerla desde el SQL editor.
--
-- BEGIN;
--   DROP TABLE IF EXISTS dtf_price_variants CASCADE;
--   ALTER TABLE articulos DROP COLUMN IF EXISTS cost;
--   ALTER TABLE articulos DROP COLUMN IF EXISTS descuento;
-- COMMIT;
-- =====================================================================
