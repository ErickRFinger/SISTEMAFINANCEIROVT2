-- Tabela de Metas
CREATE TABLE IF NOT EXISTS metas (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_meta DECIMAL(10, 2) NOT NULL,
  valor_atual DECIMAL(10, 2) DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Bancos
CREATE TABLE IF NOT EXISTS bancos (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'banco' CHECK (tipo IN ('banco', 'carteira', 'investimento', 'outro')),
  saldo_inicial DECIMAL(10, 2) DEFAULT 0,
  saldo_atual DECIMAL(10, 2) DEFAULT 0,
  cor TEXT DEFAULT '#6366f1',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cartões
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

-- Tabela de Gastos Recorrentes
CREATE TABLE IF NOT EXISTS gastos_recorrentes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  cartao_id BIGINT REFERENCES cartoes(id) ON DELETE SET NULL,
  banco_id BIGINT REFERENCES bancos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  tipo TEXT DEFAULT 'mensal' CHECK (tipo IN ('mensal', 'semanal', 'quinzenal', 'anual')),
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campos opcionais na tabela transacoes para suportar cartões e bancos
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS banco_id BIGINT REFERENCES bancos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cartao_id BIGINT REFERENCES cartoes(id) ON DELETE SET NULL;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_status ON metas(status);
CREATE INDEX IF NOT EXISTS idx_bancos_user_id ON bancos(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_user_id ON cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_banco_id ON cartoes(banco_id);
CREATE INDEX IF NOT EXISTS idx_gastos_recorrentes_user_id ON gastos_recorrentes(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_recorrentes_ativo ON gastos_recorrentes(ativo);
CREATE INDEX IF NOT EXISTS idx_transacoes_banco_id ON transacoes(banco_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_id ON transacoes(cartao_id);

