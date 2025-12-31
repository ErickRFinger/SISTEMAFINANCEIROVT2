-- Tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- RLS
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Política (permitir insert público, mas select restrito - backend usa service key então ok)
-- Mas para segurança, ninguém deve ler essa tabela via API pública
