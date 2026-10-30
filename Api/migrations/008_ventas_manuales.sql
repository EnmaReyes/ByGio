-- =====================================================================
-- Migracion 008 — Ventas manuales (canales externos)
-- PostgreSQL / Neon. Aditiva y NO destructiva: no borra datos ni tablas.
--
-- Produccion (Neon): ejecutar este archivo completo en la consola SQL.
-- Local:             aplicar con un runner temporal (ver Api/migrations/).
--
-- sequelize.sync() NO corre en produccion, por eso el esquema vive aqui.
-- Modelos equivalentes en Api/DataBase/models/ (fuente de verdad del codigo).
--
-- Que agrega:
--   1. orders.userId pasa a NULL: las ventas externas no necesitan una
--      cuenta de usuario (se identifican por el snapshot del comprador).
--   2. orders.channel: 'web' | 'presencial' | 'whatsapp' | 'otro'.
--   3. orders.paymentMethod: metodo de pago de ventas manuales (nullable).
--   4. El snapshot del comprador relaja NOT NULL en email, address, city y
--      department (una venta presencial puede no tenerlos). recipientName
--      y phone siguen siendo obligatorios.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. El pedido puede no tener usuario (venta externa registrada a mano)
-- ---------------------------------------------------------------------
ALTER TABLE orders ALTER COLUMN "userId" DROP NOT NULL;

-- ---------------------------------------------------------------------
-- 2. Canal de venta
-- ---------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS channel VARCHAR(20) NOT NULL DEFAULT 'web';

CREATE INDEX IF NOT EXISTS orders_channel_idx ON orders (channel);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_channel_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_channel_check
      CHECK (channel IN ('web', 'presencial', 'whatsapp', 'otro'));
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Metodo de pago (solo ventas manuales; Wompi vive en payments)
-- ---------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(30);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
      CHECK ("paymentMethod" IS NULL OR "paymentMethod" IN
        ('efectivo', 'nequi', 'transferencia', 'tarjeta', 'otro'));
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. Snapshot del comprador: nombre y telefono obligatorios; el resto
--    opcional (ventas presenciales sin correo ni direccion).
-- ---------------------------------------------------------------------
ALTER TABLE orders ALTER COLUMN email      DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN address    DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN city       DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN department DROP NOT NULL;

COMMIT;

-- =====================================================================
-- Verificacion posterior:
--   SELECT column_name, is_nullable, data_type
--     FROM information_schema.columns
--    WHERE table_name = 'orders' AND column_name IN
--      ('userId','channel','paymentMethod','email','address','city','department','phone','recipientName');
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'orders'::regclass AND conname LIKE 'orders_%';
-- =====================================================================
