-- =====================================================================
-- Migracion 005 — Alinear la base con los modelos actuales
-- PostgreSQL / Neon. Idempotente y no destructiva.
--
-- Produccion (Neon): ejecutar en la consola SQL.
-- Local:             node migrations/runLocal.js (o pegar en psql)
--
-- Que corrige (detectado comparando Api/DataBase/models/ con las tablas):
--
--   1. payments.status: la 002 creo el CHECK con 'error', pero
--      models/enums.js y Services/adminOrders.js usan 'en_revision'.
--      Insertar/actualizar un pago en revision fallaba contra el CHECK.
--      Se aceptan ambos valores para no romper filas historicas.
--
--   2. categories: sequelize.sync() fue acumulando indices UNIQUE
--      duplicados sobre name (categories_name_key1..4). Se dejan solo
--      los de la migracion original.
--
-- Nota: no se tocan datos. No crea ni borra tablas.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. payments.status -> incluir 'en_revision'
-- ---------------------------------------------------------------------
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_status_check CHECK (status IN (
    'pendiente',
    'aprobado',
    'rechazado',
    'anulado',
    'reembolsado',
    'en_revision',
    'error'
  ));

-- ---------------------------------------------------------------------
-- 2. categories -> eliminar restricciones/indices UNIQUE duplicados
--    que fue acumulando sequelize.sync() (son restricciones, no solo
--    indices: hay que soltarlas con DROP CONSTRAINT).
--    Si no existen, no hace nada.
-- ---------------------------------------------------------------------
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key1;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key2;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key3;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key4;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificacion opcional
-- ---------------------------------------------------------------------
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'categories'::regclass;
--
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conname = 'payments_status_check';