// Runner de la migracion 001_social_auth para la base de datos LOCAL.
// Uso: node migrations/runLocal.js   (ejecutar desde Api/, con .env local)
// Idempotente: seguro ejecutarlo varias veces.
// Produccion (Neon) se migra a mano con migrations/001_social_auth.sql.

const { sequelize } = require("../DataBase/db.js");

const run = async () => {
  console.log("🔌 Conectando a la base de datos local...");

  // PASO 0: pre-chequeo de emails duplicados (bloquea el UNIQUE del paso 3)
  const [duplicates] = await sequelize.query(
    'SELECT email, COUNT(*) FROM usuarios GROUP BY email HAVING COUNT(*) > 1;',
  );
  if (duplicates.length > 0) {
    console.warn(`⚠️  ${duplicates.length} email(s) duplicados detectados:`);
    console.warn(duplicates);
    console.warn(
      "Resuelvelos antes de volver a ejecutar para crear el indice unico de email.",
    );
  } else {
    console.log("✅ Sin emails duplicados");
  }

  const statements = [
    // Paso 1: relajar NOT NULL para cuentas sociales
    'ALTER TABLE usuarios ALTER COLUMN username DROP NOT NULL;',
    'ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;',
    // Paso 2: identidades externas
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "facebookId" VARCHAR(255);',
    'CREATE UNIQUE INDEX IF NOT EXISTS usuarios_google_id_unique ON usuarios ("googleId") WHERE "googleId" IS NOT NULL;',
    'CREATE UNIQUE INDEX IF NOT EXISTS usuarios_facebook_id_unique ON usuarios ("facebookId") WHERE "facebookId" IS NOT NULL;',
    // Paso 3: email unico (solo sin duplicados)
    ...(duplicates.length === 0
      ? [
          'CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unique ON usuarios (LOWER(email));',
        ]
      : []),
  ];

  for (const sql of statements) {
    await sequelize.query(sql);
    console.log(`✔  ${sql}`);
  }

  const [columns] = await sequelize.query(
    "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY ordinal_position;",
  );
  console.log("\n📋 Estructura final de 'usuarios':");
  console.table(columns);
};

run()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error("❌ Migracion fallida:", error.message);
    await sequelize.close();
    process.exit(1);
  });
