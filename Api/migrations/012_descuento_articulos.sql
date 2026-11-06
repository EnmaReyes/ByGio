-- =====================================================================
-- Migracion 012 — Desconto individual por articulo
-- PostgreSQL / Neon. Aditiva y NO destructiva: no borra datos ni tablas.
--
-- Produccion (Neon): ejecutar este archivo completo en la consola SQL.
-- Local:             sequelize.sync() crea la columna desde el modelo.
--                    Produccion tambien la aplica sola al arrancar
--                    (Api/DataBase/ensurePricing.js), asi que este archivo
--                    es el respaldo manual del mismo cambio.
--
-- Que agrega:
--   articulos."descuentoPorcentaje" INTEGER NULL
--     NULL o 0  = sin descuento (registros existentes quedan en NULL).
--     1 - 100   = porcentaje sobre el precio efectivo ya resuelto
--                 (tarifa global o precio propio / excepcion).
--     CHECK: solo NULL o valores enteros entre 0 y 100.
--
-- Notas:
--   - El nombre es "descuentoPorcentaje" y NO "descuento": esa columna
--     era del esquema viejo (precio anterior en pesos) y
--     ensurePricing.js la elimina al arrancar si la detecta.
--   - Los combos (articulos.combo = true) no usan descuento individual:
--     esta columna se ignora para ellos en el backend.
--   - El 100% es valido (precio final 0). Un pedido de total 0 no se
--     cobra en linea (Wompi no acepta 0) y se confirma manualmente.
-- =====================================================================

BEGIN;

ALTER TABLE articulos
  ADD COLUMN IF NOT EXISTS "descuentoPorcentaje" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'articulos'::regclass
       AND conname = 'articulos_descuento_porcentaje_check'
  ) THEN
    ALTER TABLE articulos
      ADD CONSTRAINT articulos_descuento_porcentaje_check
      CHECK ("descuentoPorcentaje" IS NULL OR "descuentoPorcentaje" BETWEEN 0 AND 100);
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- Verificacion posterior:
--   SELECT column_name, data_type, is_nullable
--     FROM information_schema.columns
--    WHERE table_name = 'articulos' AND column_name = 'descuentoPorcentaje';
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'articulos'::regclass
--      AND conname = 'articulos_descuento_porcentaje_check';
--   SELECT count(*) AS articulos_con_descuento
--     FROM articulos
--    WHERE COALESCE("descuentoPorcentaje", 0) > 0;
-- =====================================================================
