-- ==========================================
-- SUPABASE MIGRATION SCRIPT
-- ==========================================
-- Run this script in the Supabase SQL Editor to set up your database.

-- 1. Create Users Table (Custom Auth)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, nome, tipo)
);

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS transacoes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user ON transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_user ON categorias(user_id);

-- 5. Enable RLS (Optional but good practice)
-- Since we use Service Key in backend, this protects data from accidental public access.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Note: No policies are added by default because the backend uses the Service Key
-- to bypass RLS. This ensures your data is secure from public access.
