-- =====================================================================
-- Migracion manual para Neon (PRODUCCION) — Autenticacion social
-- Ejecutar en la consola SQL de Neon. sequelize.sync() NO corre en prod.
-- Aplica al estado del modelo registrado en Api/DataBase/models/Usuarios.js
-- =====================================================================

-- PASO 0 (pre-chequeo OBLIGATORIO): detectar emails duplicados heredados.
-- Si devuelve filas, resolver ANTES de aplicar el UNIQUE (paso 3).
-- SELECT email, COUNT(*) FROM usuarios GROUP BY email HAVING COUNT(*) > 1;

BEGIN;

-- Paso 1: relajar NOT NULL para permitir cuentas sociales
-- (el registro tradicional los sigue exigiendo a nivel de aplicacion)
ALTER TABLE usuarios ALTER COLUMN username DROP NOT NULL;
ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;

-- Paso 2: identidades externas (UNIQUE implica 1 identidad por proveedor)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "facebookId" VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_google_id_unique
  ON usuarios ("googleId") WHERE "googleId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_facebook_id_unique
  ON usuarios ("facebookId") WHERE "facebookId" IS NOT NULL;

-- Paso 3: email unico (ejecutar SOLO si el pre-chequeo no devolvio filas)
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unique
  ON usuarios (LOWER(email));

COMMIT;

-- Verificacion posterior:
-- \d usuarios
-- SELECT COUNT(*) FROM usuarios WHERE "googleId" IS NOT NULL OR "facebookId" IS NOT NULL;

-- =====================================================================
-- ROLLBACK (si algo sale mal):
-- BEGIN;
-- DROP INDEX IF EXISTS usuarios_email_unique;
-- DROP INDEX IF EXISTS usuarios_google_id_unique;
-- DROP INDEX IF EXISTS usuarios_facebook_id_unique;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS "googleId";
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS "facebookId";
-- -- NOTA: restaurar NOT NULL fallara si ya existen usuarios sociales:
-- -- DELETE FROM usuarios WHERE password IS NULL;  (destructivo, evaluar)
-- ALTER TABLE usuarios ALTER COLUMN username SET NOT NULL;
-- ALTER TABLE usuarios ALTER COLUMN password SET NOT NULL;
-- COMMIT;
-- =====================================================================
