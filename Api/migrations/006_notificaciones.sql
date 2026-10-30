-- 006_notificaciones.sql
-- Tabla de notificaciones por usuario (panel).
-- Ejecutar en la consola de Neon (produccion) o dejar que sync() la cree en dev.

CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL DEFAULT 'cuenta',
  titulo VARCHAR(200) NOT NULL,
  texto TEXT,
  "to" VARCHAR(255),
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  clave VARCHAR(100) UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notificaciones_user_created_idx
  ON notificaciones ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS notificaciones_user_leida_idx
  ON notificaciones ("userId", leida);
