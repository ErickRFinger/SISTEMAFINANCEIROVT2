-- Script SQL para adicionar ganho fixo mensal
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna de ganho fixo mensal na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ganho_fixo_mensal DECIMAL(10, 2) DEFAULT 0;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_ganho_fixo ON users(ganho_fixo_mensal) WHERE ganho_fixo_mensal > 0;

