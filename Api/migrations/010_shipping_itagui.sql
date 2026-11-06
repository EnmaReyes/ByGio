-- =====================================================================
-- Migracion 010 — Envios por distancia desde la bodega en Itagui
-- PostgreSQL / Neon. Aditiva e idempotente.
--
-- Produccion (Neon): ejecutar en la consola SQL.
-- Local:             node migrations/runShipping.js
--
-- Antes (003): Medellin por distancia; Antioquia (fuera de Medellin) y
--              el resto del pais con tarifa plana.
-- Ahora:       TODA Antioquia se cobra por distancia (km) desde la bodega
--              en Itagui; el resto del pais mantiene tarifa plana.
--
-- Zonas:
--   'antioquia' -> rangos por distancia (0-5, 5-10, 10-20, +20 km)
--   'nacional'  -> tarifa plana
--   'medellin'  -> esquema anterior; se desactiva (se conserva por historicos)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Desactivar el esquema anterior.
--    'medellin' ya no se genera; la tarifa plana de Antioquia
--    (minKm y maxKm NULL) se reemplaza por los rangos por distancia.
-- ---------------------------------------------------------------------
UPDATE shipping_rates
   SET active = false, "updatedAt" = now()
 WHERE zone = 'medellin';

UPDATE shipping_rates
   SET active = false, "updatedAt" = now()
 WHERE zone = 'antioquia'
   AND "minKm" IS NULL
   AND "maxKm" IS NULL;

-- ---------------------------------------------------------------------
-- 2. Nuevas tarifas. isDefault de Antioquia = banda "mas de 20 km"
--    (se usa cuando el municipio no se puede ubicar). El nacional
--    tambien actualiza su precio a 22.000.
-- ---------------------------------------------------------------------
INSERT INTO shipping_rates (id, zone, label, "minKm", "maxKm", price, "isDefault", active, "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.zone, v.label, v.min_km, v.max_km, v.price, v.is_default, true, now(), now()
FROM (VALUES
  ('antioquia', 'Antioquia · 0 a 5 km',      0.0,   5.0, 12000, false),
  ('antioquia', 'Antioquia · 5 a 10 km',     5.0,  10.0, 17000, false),
  ('antioquia', 'Antioquia · 10 a 20 km',   10.0,  20.0, 25000, false),
  ('antioquia', 'Antioquia · más de 20 km', 20.0,  NULL, 28000, true),
  ('nacional',  'Envío nacional',            NULL,  NULL, 22000, true)
) AS v(zone, label, min_km, max_km, price, is_default)
ON CONFLICT (zone, label) DO UPDATE
   SET "minKm"     = EXCLUDED."minKm",
       "maxKm"     = EXCLUDED."maxKm",
       price       = EXCLUDED.price,
       "isDefault" = EXCLUDED."isDefault",
       active      = true,
       "updatedAt" = now();

-- ---------------------------------------------------------------------
-- 3. Defensa: una sola tarifa por defecto activa por zona.
-- ---------------------------------------------------------------------
UPDATE shipping_rates
   SET "isDefault" = false, "updatedAt" = now()
 WHERE zone = 'antioquia'
   AND "isDefault" = true
   AND label <> 'Antioquia · más de 20 km';

COMMIT;

-- =====================================================================
-- Verificacion posterior:
--   SELECT zone, label, "minKm", "maxKm", price, "isDefault", active
--     FROM shipping_rates ORDER BY zone, "minKm" NULLS LAST;
--   Esperado (activas): 4 de antioquia + 1 nacional.
-- =====================================================================
-- ROLLBACK (vuelve al esquema de 003):
-- BEGIN;
--   UPDATE shipping_rates SET active = false
--    WHERE zone = 'antioquia' AND "minKm" IS NOT NULL;
--   UPDATE shipping_rates SET active = true
--    WHERE zone = 'medellin'
--       OR (zone = 'antioquia' AND "minKm" IS NULL AND "maxKm" IS NULL);
--   UPDATE shipping_rates SET price = 30000 WHERE zone = 'nacional';
-- COMMIT;
-- =====================================================================
