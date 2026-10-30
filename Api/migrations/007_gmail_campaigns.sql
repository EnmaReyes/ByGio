-- 007_gmail_campaigns.sql
-- Ejecutar en la consola de Neon (produccion). En dev, sync() lo crea.

-- Columna para el refresh token de Gmail en usuarios.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "gmailRefreshToken" TEXT;

-- Tabla de campañas enviadas (auditoría).
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId" UUID NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_admin_sent_idx
  ON campaigns ("adminId", "sentAt" DESC);
