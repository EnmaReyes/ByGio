-- =====================================================================
-- Migracion 002 — Base del ecommerce (pedidos, pagos, variantes DTF)
-- PostgreSQL / Neon. Aditiva: NO borra ni modifica datos existentes.
--
-- Produccion (Neon): ejecutar este archivo completo en la consola SQL.
-- Local:             node migrations/runEcommerce.js
--
-- sequelize.sync() NO corre en produccion, por eso el esquema vive aqui.
-- Modelos equivalentes en Api/DataBase/models/ (fuente de verdad del codigo).
--
-- NOTA: las restricciones CHECK se agregan en un bloque aparte con guardas
-- (DO $$ ... IF NOT EXISTS). Asi el esquema converge igual si las tablas ya
-- existian (por ejemplo, creadas por sequelize.sync() en desarrollo) y el
-- script sigue siendo idempotente.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Ajustes al catalogo existente
-- ---------------------------------------------------------------------

-- 0.1 Articulos: nuevo flag "combo" (default false)
ALTER TABLE articulos
  ADD COLUMN IF NOT EXISTS combo BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- 1. Variantes de precio de DTF
--    Un diseno DTF puede tener varias combinaciones (tipo / medidas / color)
--    con precios distintos. El backend SIEMPRE valida el precio contra esta
--    tabla, nunca contra lo que envie el cliente.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dtf_price_variants (
  id          UUID PRIMARY KEY,
  "dtfId"     UUID NOT NULL REFERENCES dtfs (id) ON UPDATE CASCADE ON DELETE CASCADE,
  tipo        VARCHAR(50) NOT NULL,                    -- 'basico' | 'oversize' | ...
  precio      INTEGER NOT NULL,                        -- pesos COP
  medidas     VARCHAR(100),                            -- ej: '20x30' (NULL = no aplica)
  color       VARCHAR(50),                             -- ej: 'negra'  (NULL = no aplica)
  activo      BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dtf_price_variants_dtf_id_idx
  ON dtf_price_variants ("dtfId");

-- Evita duplicados aunque medidas/color sean NULL
CREATE UNIQUE INDEX IF NOT EXISTS dtf_price_variants_unique_idx
  ON dtf_price_variants ("dtfId", tipo, COALESCE(medidas, ''), COALESCE(color, ''));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dtf_price_variants_precio_check') THEN
    ALTER TABLE dtf_price_variants
      ADD CONSTRAINT dtf_price_variants_precio_check CHECK (precio >= 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Pedidos
--    status        = estado logistico (separado del pago)
--    paymentStatus = estado del pago
--    Los datos de envio son una copia (snapshot) del comprador al comprar.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY,
  "orderNumber"   VARCHAR(30) NOT NULL UNIQUE,        -- BYG-2026-000001
  "userId"        UUID NOT NULL REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  status          VARCHAR(30) NOT NULL DEFAULT 'pendiente_pago',
  "paymentStatus" VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  currency        CHAR(3) NOT NULL DEFAULT 'COP',

  subtotal        INTEGER NOT NULL DEFAULT 0,
  "shippingCost"  INTEGER NOT NULL DEFAULT 0,
  "discountTotal" INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,

  -- Snapshot del comprador / envio (no depende de usuarios despues)
  "recipientName" VARCHAR(150) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(30) NOT NULL,
  address         VARCHAR(255) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  department      VARCHAR(100) NOT NULL,
  "postalCode"    VARCHAR(20),
  notes           TEXT,
  "shippingZone"  VARCHAR(50),                        -- 'medellin' | 'antioquia' | 'nacional'

  -- Logistica / seguimiento
  "trackingCarrier" VARCHAR(100),
  "trackingNumber"  VARCHAR(100),
  "shippedAt"     TIMESTAMPTZ,
  "deliveredAt"   TIMESTAMPTZ,
  "cancelledAt"   TIMESTAMPTZ,

  -- Reserva de stock (stock booleano + expiracion perezosa)
  "stockReservedUntil" TIMESTAMPTZ,

  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx        ON orders ("userId");
CREATE INDEX IF NOT EXISTS orders_status_idx         ON orders (status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders ("paymentStatus");
CREATE INDEX IF NOT EXISTS orders_created_at_idx     ON orders ("createdAt" DESC);

DO $$ BEGIN
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
END $$;

-- ---------------------------------------------------------------------
-- 3. Detalle del pedido (snapshot inmutable del producto)
--    productId NO es FK: un pedido debe sobrevivir al borrado del producto.
--    productSnapshot guarda el producto completo en el momento de la compra.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY,
  "orderId"     UUID NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE CASCADE,

  "productType" VARCHAR(20) NOT NULL,                 -- 'articulo' | 'dtf'
  "productId"   UUID,                                 -- sin FK a proposito
  "variantId"   UUID REFERENCES dtf_price_variants (id) ON UPDATE CASCADE ON DELETE SET NULL,

  title         VARCHAR(255) NOT NULL,
  "imageUrl"    TEXT,
  size          VARCHAR(50),
  oversize      BOOLEAN NOT NULL DEFAULT false,
  "shirtColor"  VARCHAR(50),
  "shirtName"   VARCHAR(100),
  "dtfSize"     VARCHAR(30),

  "unitPrice"   INTEGER NOT NULL,
  quantity      INTEGER NOT NULL,
  "lineTotal"   INTEGER NOT NULL,

  "productSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items ("orderId");
CREATE INDEX IF NOT EXISTS order_items_product_idx  ON order_items ("productType", "productId");

DO $$ BEGIN
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
END $$;

-- ---------------------------------------------------------------------
-- 4. Pagos (Wompi)
--    reference y providerTransactionId son UNIQUE: base de la idempotencia.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY,
  "orderId"   UUID NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  provider    VARCHAR(30) NOT NULL DEFAULT 'wompi',
  reference   VARCHAR(100) NOT NULL UNIQUE,
  "providerTransactionId" VARCHAR(100) UNIQUE,
  status      VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  "amountInCents" BIGINT NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'COP',
  "paymentMethodType" VARCHAR(50),
  "wompiStatus" VARCHAR(50),
  "rawPayload" JSONB,
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments ("orderId");
CREATE INDEX IF NOT EXISTS payments_status_idx   ON payments (status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_check') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN (
      'pendiente', 'aprobado', 'rechazado', 'anulado', 'reembolsado', 'error'
    ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_check') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_amount_check CHECK ("amountInCents" > 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. Historial unificado de estados
--    kind = 'logistica' (status) | 'pago' (paymentStatus)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID PRIMARY KEY,
  "orderId"   UUID NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE CASCADE,
  kind        VARCHAR(20) NOT NULL DEFAULT 'logistica',
  "fromStatus" VARCHAR(30),
  "toStatus"  VARCHAR(30) NOT NULL,
  "changedByUserId" UUID REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE SET NULL,
  note        TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx
  ON order_status_history ("orderId", "createdAt" DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_kind_check') THEN
    ALTER TABLE order_status_history
      ADD CONSTRAINT order_status_history_kind_check CHECK (kind IN ('logistica', 'pago'));
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- Verificacion posterior:
--   \dt
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid IN ('orders'::regclass, 'order_items'::regclass,
--                       'payments'::regclass, 'dtf_price_variants'::regclass,
--                       'order_status_history'::regclass);
-- =====================================================================
-- ROLLBACK (destructivo, solo si algo sale mal ANTES de tener pedidos):
-- BEGIN;
--   DROP TABLE IF EXISTS order_status_history;
--   DROP TABLE IF EXISTS payments;
--   DROP TABLE IF EXISTS order_items;
--   DROP TABLE IF EXISTS orders;
--   DROP TABLE IF EXISTS dtf_price_variants;
--   ALTER TABLE articulos DROP COLUMN IF EXISTS combo;
-- COMMIT;
-- =====================================================================
