-- Adicionar coluna de ganho fixo mensal na tabela de usuários
ALTER TABLE users ADD COLUMN IF NOT EXISTS ganho_fixo_mensal DECIMAL(12, 2) DEFAULT 0;
