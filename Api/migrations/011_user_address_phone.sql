-- =====================================================================
-- Migracion manual para Neon (PRODUCCION) — Datos de contacto del usuario
-- Ejecutar en la consola SQL de Neon. sequelize.sync() NO corre en prod.
-- Aplica al estado del modelo en Api/DataBase/models/Usuarios.js
--
-- Agrega el telefono y la direccion que el comprador puede guardar en
-- "Mi perfil" y que el checkout usa como valores por defecto.
-- =====================================================================

BEGIN;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone   VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS address VARCHAR(255);

COMMIT;

-- Verificacion posterior (deben salir 2 filas):
-- SELECT column_name, data_type, character_maximum_length
--   FROM information_schema.columns
--  WHERE table_name = 'usuarios' AND column_name IN ('phone', 'address');

-- =====================================================================
-- ROLLBACK (si algo sale mal):
-- BEGIN;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS phone;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS address;
-- COMMIT;
-- =====================================================================