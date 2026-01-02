-- Execute todo este bloco para criar a tabela de cartões corretamente
CREATE TABLE IF NOT EXISTS cartoes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banco_id BIGINT NOT NULL REFERENCES bancos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'credito' CHECK (tipo IN ('credito', 'debito', 'pre_pago')),
  limite DECIMAL(10, 2),
  dia_fechamento INTEGER CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  cor TEXT DEFAULT '#818cf8',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cartoes_user_id ON cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_banco_id ON cartoes(banco_id);
