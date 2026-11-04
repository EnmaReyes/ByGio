-- =====================================================================
-- Migracion 009 — Preparacion de pagos (Wompi) y plazo de entrega
-- PostgreSQL / Neon. ADITIVA e IDEMPOTENTE: se puede ejecutar varias veces.
--
-- Produccion (Neon): ejecutar este archivo completo en el SQL editor.
-- Local:             sequelize.sync() crea las columnas nuevas en desarrollo;
--                    no hace falta correrlo, pero tampoco molesta.
--
-- sequelize.sync() NO corre en produccion, por eso el esquema vive aqui.
-- Modelos equivalentes en Api/DataBase/models/ (fuente de verdad del codigo).
--
-- Que agrega:
--   1. orders.estimatedDeliveryDays  -> snapshot del plazo prometido (dias habiles)
--   2. orders.paymentApprovedAt      -> momento en que el pago quedo aprobado
--   3. payments.statusMessage        -> status_message de Wompi (texto legible)
--   4. payments.failureCode          -> codigo de fallo del medio de pago
--   5. Indice unico parcial: UN SOLO pago aprobado por pedido
--   6. Backfill del plazo en los pedidos existentes
--   7. Limpieza de reservas de stock heredadas (el bloqueo de 30 min se apago)
--
-- NO crea ni borra tablas. NO modifica datos historicos de pedidos.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Plazo de entrega como snapshot del pedido
--    Antioquia (Medellin incluido) = 3 dias habiles
--    Resto del pais               = 10 dias habiles
--    Se calcula al crear el pedido y no se recalcula despues.
-- ---------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "estimatedDeliveryDays" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'orders_estimated_delivery_days_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_estimated_delivery_days_check
      CHECK ("estimatedDeliveryDays" IS NULL OR "estimatedDeliveryDays" >= 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Momento de aprobacion del pago (Wompi o registro manual)
-- ---------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "paymentApprovedAt" TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- 3. Diagnostico del pago segun Wompi
--    statusMessage: transaction.status_message ("Transaccion aprobada"...)
--    failureCode:   codigo del rechazo ("INSUFFICIENT_FUNDS"...)
-- ---------------------------------------------------------------------
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS "statusMessage" VARCHAR(255);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS "failureCode" VARCHAR(100);

-- ---------------------------------------------------------------------
-- 4. Un solo pago aprobado por pedido
--    La referencia (reference) es unica POR INTENTO; este indice garantiza
--    que un pedido no pueda quedar con dos pagos aprobados aunque haya
--    varios intentos (reintentos de Wompi, doble clic, webhook duplicado).
--
--    Pre-check obligatorio: debe devolver 0 filas antes de crearlo.
--      SELECT "orderId", count(*)
--        FROM payments
--       WHERE status = 'aprobado'
--       GROUP BY 1
--      HAVING count(*) > 1;
--
--    Si devuelve filas, NO ejecutes el indice: hay que resolver esos pedidos
--    a mano (reembolsar el intento sobrante) antes de aplicar la restriccion.
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_approved_per_order
  ON payments ("orderId")
  WHERE status = 'aprobado';

-- ---------------------------------------------------------------------
-- 5. Backfill del plazo en pedidos ya existentes.
--    Solo rellena NULL: no pisa nunca un snapshot ya guardado.
-- ---------------------------------------------------------------------
UPDATE orders
   SET "estimatedDeliveryDays" =
         CASE
           WHEN "shippingZone" IN ('medellin', 'antioquia') THEN 3
           ELSE 10
         END
 WHERE "estimatedDeliveryDays" IS NULL;

-- ---------------------------------------------------------------------
-- 6. Reservas de stock heredadas
--    El bloqueo de 30 minutos se apago (STOCK_RESERVATION_ENABLED=false):
--    con stock booleano escondia el producto de un carrito abandonado.
--    Cualquier pedido que todavia tenga stockReservedUntil quedaria con sus
--    productos en stock = false para siempre, porque la liberacion perezosa
--    ya no se ejecuta. Se anula la reserva y se devuelve el producto al
--    catalogo.
--
--    Revision previa (opcional, solo informativa):
--      SELECT id, "orderNumber", status, "stockReservedUntil"
--        FROM orders
--       WHERE "stockReservedUntil" IS NOT NULL;
-- ---------------------------------------------------------------------
UPDATE articulos a
   SET stock = true
 WHERE a.stock = false
   AND a.id IN (
     SELECT oi."productId"
       FROM order_items oi
       JOIN orders o ON o.id = oi."orderId"
      WHERE oi."productType" = 'articulo'
        AND o."stockReservedUntil" IS NOT NULL
        AND o.status = 'pendiente_pago'
   );

UPDATE dtfs d
   SET stock = true
 WHERE d.stock = false
   AND d.id IN (
     SELECT oi."productId"
       FROM order_items oi
       JOIN orders o ON o.id = oi."orderId"
      WHERE oi."productType" = 'dtf'
        AND o."stockReservedUntil" IS NOT NULL
        AND o.status = 'pendiente_pago'
   );

UPDATE orders
   SET "stockReservedUntil" = NULL
 WHERE "stockReservedUntil" IS NOT NULL;

COMMIT;

-- =====================================================================
-- Verificacion posterior:
--   SELECT column_name, data_type, is_nullable
--     FROM information_schema.columns
--    WHERE table_name IN ('orders', 'payments')
--      AND column_name IN ('estimatedDeliveryDays', 'paymentApprovedAt',
--                          'statusMessage', 'failureCode')
--    ORDER BY table_name, column_name;
--
--   SELECT indexname, indexdef
--     FROM pg_indexes
--    WHERE tablename = 'payments'
--      AND indexname = 'payments_one_approved_per_order';
--
--   SELECT status, count(*), min("estimatedDeliveryDays"), max("estimatedDeliveryDays")
--     FROM orders
--    GROUP BY status;
--
--   SELECT count(*) AS reservas_pendientes FROM orders WHERE "stockReservedUntil" IS NOT NULL;
-- =====================================================================
-- ROLLBACK (destructivo, solo si algo sale mal ANTES de tener pedidos):
-- BEGIN;
--   DROP INDEX IF EXISTS payments_one_approved_per_order;
--   ALTER TABLE payments DROP COLUMN IF EXISTS "failureCode";
--   ALTER TABLE payments DROP COLUMN IF EXISTS "statusMessage";
--   ALTER TABLE orders   DROP COLUMN IF EXISTS "paymentApprovedAt";
--   ALTER TABLE orders   DROP COLUMN IF EXISTS "estimatedDeliveryDays";
-- COMMIT;
-- =====================================================================
