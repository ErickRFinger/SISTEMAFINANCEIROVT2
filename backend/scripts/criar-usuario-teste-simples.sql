-- Script SQL SIMPLIFICADO para criar usuário de teste
-- Execute este script no SQL Editor do Supabase
-- 
-- IMPORTANTE: Se o RLS estiver habilitado, você precisa desabilitá-lo temporariamente
-- ou criar uma política que permita inserção

-- Desabilitar RLS temporariamente (apenas para criar o usuário)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Inserir usuário de teste
-- Email: teste@teste.com
-- Senha: teste123
INSERT INTO users (nome, email, senha)
VALUES (
  'Usuário Teste',
  'teste@teste.com',
  '$2a$10$F8neEIE6HrwoU8WrR5PFrOINv4XsJ.JSFCJ9p.hO/12.LeGfr02LW'
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha = EXCLUDED.senha
RETURNING id, nome, email;

-- Criar categorias padrão
INSERT INTO categorias (user_id, nome, tipo, cor)
SELECT 
  u.id,
  cat.nome,
  cat.tipo,
  cat.cor
FROM users u
CROSS JOIN (VALUES
  ('Salário', 'receita', '#10b981'),
  ('Freelance', 'receita', '#3b82f6'),
  ('Alimentação', 'despesa', '#ef4444'),
  ('Transporte', 'despesa', '#f59e0b'),
  ('Moradia', 'despesa', '#8b5cf6'),
  ('Saúde', 'despesa', '#ec4899')
) AS cat(nome, tipo, cor)
WHERE u.email = 'teste@teste.com'
ON CONFLICT (user_id, nome, tipo) DO NOTHING;

-- Reabilitar RLS (se necessário)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

