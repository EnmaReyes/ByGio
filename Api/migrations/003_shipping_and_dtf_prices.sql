-- =====================================================================
-- Migracion 003 — Tarifas de envio, numeracion de pedidos y precios DTF
-- PostgreSQL / Neon. Aditiva e idempotente.
--
-- Produccion (Neon): ejecutar en la consola SQL.
-- Local:             node migrations/runShipping.js
--
-- Los valores de ejemplo de las tarifas se pueden ajustar despues con
-- UPDATE sobre shipping_rates (o desde el panel admin en una fase futura).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Numeracion legible de pedidos: BYG-2026-000001
--    Se usa una secuencia (atomica) para evitar duplicados por concurrencia.
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- ---------------------------------------------------------------------
-- 2. Tarifas de envio
--    Medellin: por rango de distancia (km) desde el punto de despacho.
--    Antioquia (fuera de Medellin): tarifa plana.
--    Nacional: tarifa plana.
--    isDefault = se usa cuando el checkout no envia coordenadas.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_rates (
  id          UUID PRIMARY KEY,
  zone        VARCHAR(30) NOT NULL,        -- 'medellin' | 'antioquia' | 'nacional'
  label       VARCHAR(100) NOT NULL,       -- texto visible en el checkout
  "minKm"     NUMERIC(6, 2),               -- NULL = sin limite inferior
  "maxKm"     NUMERIC(6, 2),               -- NULL = sin limite superior
  price       INTEGER NOT NULL,            -- pesos COP
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  active      BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shipping_rates_zone_label_idx
  ON shipping_rates (zone, label);

CREATE INDEX IF NOT EXISTS shipping_rates_zone_active_idx
  ON shipping_rates (zone, active);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_rates_zone_check') THEN
    ALTER TABLE shipping_rates
      ADD CONSTRAINT shipping_rates_zone_check CHECK (zone IN ('medellin', 'antioquia', 'nacional'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_rates_price_check') THEN
    ALTER TABLE shipping_rates ADD CONSTRAINT shipping_rates_price_check CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_rates_range_check') THEN
    ALTER TABLE shipping_rates ADD CONSTRAINT shipping_rates_range_check CHECK (
      ("minKm" IS NULL OR "minKm" >= 0)
      AND ("maxKm" IS NULL OR "maxKm" >= 0)
      AND ("minKm" IS NULL OR "maxKm" IS NULL OR "maxKm" > "minKm")
    );
  END IF;
END $$;

-- Tarifas iniciales (valores de ejemplo, ajustables)
INSERT INTO shipping_rates (id, zone, label, "minKm", "maxKm", price, "isDefault", active, "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.zone, v.label, v.min_km, v.max_km, v.price, v.is_default, true, now(), now()
FROM (VALUES
  ('medellin',  'Medellín · 0 a 5 km',        0.0,   5.0,  8000,  false),
  ('medellin',  'Medellín · 5 a 10 km',       5.0,  10.0, 12000,  true),
  ('medellin',  'Medellín · 10 a 20 km',     10.0,  20.0, 18000,  false),
  ('medellin',  'Medellín · más de 20 km',   20.0,  NULL, 25000,  false),
  ('antioquia', 'Antioquia (fuera de Medellín)', NULL, NULL, 20000, true),
  ('nacional',  'Envío nacional',             NULL,  NULL, 30000,  true)
) AS v(zone, label, min_km, max_km, price, is_default)
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_rates s WHERE s.zone = v.zone AND s.label = v.label
);

-- ---------------------------------------------------------------------
-- 3. Precios DTF por defecto
--    Hoy el unico diferenciador es el tipo: basico / oversize.
--    Se crean las dos variantes para cada diseno que no las tenga.
--    (medidas y color quedan NULL = "no aplica")
-- ---------------------------------------------------------------------
INSERT INTO dtf_price_variants (id, "dtfId", tipo, precio, medidas, color, activo, "createdAt", "updatedAt")
SELECT gen_random_uuid(), d.id, v.tipo, v.precio, NULL, NULL, true, now(), now()
FROM dtfs d
CROSS JOIN (VALUES ('basico', 22000), ('oversize', 32000)) AS v(tipo, precio)
WHERE NOT EXISTS (
  SELECT 1 FROM dtf_price_variants p
   WHERE p."dtfId" = d.id
     AND p.tipo = v.tipo
     AND p.medidas IS NULL
     AND p.color IS NULL
);

COMMIT;

-- =====================================================================
-- Verificacion posterior:
--   SELECT zone, label, "minKm", "maxKm", price, "isDefault" FROM shipping_rates ORDER BY zone, "minKm";
--   SELECT d.id, p.tipo, p.precio FROM dtfs d JOIN dtf_price_variants p ON p."dtfId" = d.id;
--   SELECT nextval('order_number_seq');  -- ojo: consume un numero
-- =====================================================================
-- ROLLBACK (destructivo):
-- BEGIN;
--   DROP TABLE IF EXISTS shipping_rates;
--   DROP SEQUENCE IF EXISTS order_number_seq;
-- COMMIT;
-- =====================================================================
