// Runner local de la migracion 003 (envios y numeracion).
// Uso: node migrations/runShipping.js   (ejecutar desde Api/)
// Idempotente: seguro ejecutarlo varias veces.
// Los precios DTF se migraron al esquema global; ver DataBase/ensurePricing.js.
// Produccion (Neon) se migra a mano con
// migrations/003_shipping_and_dtf_prices.sql.

const { sequelize } = require("../DataBase/db.js");

const statements = [
  `CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;`,

  `CREATE TABLE IF NOT EXISTS shipping_rates (
    id UUID PRIMARY KEY,
    zone VARCHAR(30) NOT NULL,
    label VARCHAR(100) NOT NULL,
    "minKm" NUMERIC(6, 2),
    "maxKm" NUMERIC(6, 2),
    price INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS shipping_rates_zone_label_idx ON shipping_rates (zone, label);`,
  `CREATE INDEX IF NOT EXISTS shipping_rates_zone_active_idx ON shipping_rates (zone, active);`,
  `DO $$ BEGIN
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
   END $$;`,

  `INSERT INTO shipping_rates (id, zone, label, "minKm", "maxKm", price, "isDefault", active, "createdAt", "updatedAt")
   SELECT gen_random_uuid(), v.zone, v.label, v.min_km, v.max_km, v.price, v.is_default, true, now(), now()
   FROM (VALUES
     ('medellin',  'Medellín · 0 a 5 km',          0.0,  5.0,   8000, false),
     ('medellin',  'Medellín · 5 a 10 km',         5.0, 10.0,  12000, true),
     ('medellin',  'Medellín · 10 a 20 km',       10.0, 20.0,  18000, false),
     ('medellin',  'Medellín · más de 20 km',     20.0, NULL,  25000, false),
     ('antioquia', 'Antioquia (fuera de Medellín)', NULL, NULL, 20000, true),
     ('nacional',  'Envío nacional',               NULL,  NULL, 30000, true)
   ) AS v(zone, label, min_km, max_km, price, is_default)
   WHERE NOT EXISTS (
     SELECT 1 FROM shipping_rates s WHERE s.zone = v.zone AND s.label = v.label
   );`,

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
    console.log("✅ Migracion 003 aplicada");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migracion 003 fallida, rollback aplicado:", error.message);
    throw error;
  }

  const [rates] = await sequelize.query(
    `SELECT zone, label, "minKm", "maxKm", price, "isDefault"
       FROM shipping_rates ORDER BY zone, "minKm" NULLS LAST;`,
  );
  console.log("\n🚚 Tarifas de envio:");
  console.table(rates);

  const [seq] = await sequelize.query(
    `SELECT last_value, is_called FROM order_number_seq;`,
  );
  console.log("🔢 Secuencia de pedidos:", seq[0]);
};

run()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(error);
    await sequelize.close();
    process.exit(1);
  });
