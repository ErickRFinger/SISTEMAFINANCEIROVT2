-- ==========================================
-- COMPLETE SYSTEM DATABASE SETUP
-- ==========================================
-- Run this script in the Supabase SQL Editor to fully initialize the system.
-- This script safely checks for existing tables to avoid errors.

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATEGORIAS TABLE
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, nome, tipo)
);

-- 3. BANCOS TABLE
CREATE TABLE IF NOT EXISTS bancos (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'banco',
  saldo_inicial DECIMAL(12, 2) DEFAULT 0,
  saldo_atual DECIMAL(12, 2) DEFAULT 0,
  cor TEXT DEFAULT '#6366f1',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CARTOES TABLE
CREATE TABLE IF NOT EXISTS cartoes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banco_id BIGINT NOT NULL REFERENCES bancos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'credito',
  limite DECIMAL(12, 2),
  dia_fechamento INTEGER,
  dia_vencimento INTEGER,
  cor TEXT DEFAULT '#818cf8',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TRANSACOES TABLE (Updated with Banks and Cards)
CREATE TABLE IF NOT EXISTS transacoes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  banco_id BIGINT REFERENCES bancos(id) ON DELETE SET NULL,
  cartao_id BIGINT REFERENCES cartoes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if columns exist in transacoes if table was already created without them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transacoes' AND column_name='banco_id') THEN
        ALTER TABLE transacoes ADD COLUMN banco_id BIGINT REFERENCES bancos(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transacoes' AND column_name='cartao_id') THEN
        ALTER TABLE transacoes ADD COLUMN cartao_id BIGINT REFERENCES cartoes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. METAS TABLE
CREATE TABLE IF NOT EXISTS metas (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_meta DECIMAL(12, 2) NOT NULL,
  valor_atual DECIMAL(12, 2) DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. GASTOS RECORRENTES TABLE
CREATE TABLE IF NOT EXISTS gastos_recorrentes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  banco_id BIGINT REFERENCES bancos(id) ON DELETE SET NULL,
  cartao_id BIGINT REFERENCES cartoes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  dia_vencimento INTEGER NOT NULL,
  tipo TEXT DEFAULT 'mensal',
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_transacoes_user ON transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
CREATE INDEX IF NOT EXISTS idx_bancos_user ON bancos(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_user ON cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_user ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_recorrentes_user ON gastos_recorrentes(user_id);

-- 9. ENABLE RLS (Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_recorrentes ENABLE ROW LEVEL SECURITY;

-- Note: Policies are optional because the Backend uses the Key Service (Admin) to access data.
-- But it is good practice to keep RLS enabled to avoid undesired public access.
