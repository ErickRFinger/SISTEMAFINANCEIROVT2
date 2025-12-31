-- Script SQL para criar usuário de teste no Supabase
-- Execute este script no SQL Editor do Supabase
-- 
-- Credenciais:
-- Email: teste@teste.com
-- Senha: teste123

-- Inserir usuário de teste
-- Senha: teste123 (hash bcrypt)
INSERT INTO users (nome, email, senha)
VALUES (
  'Usuário Teste',
  'teste@teste.com',
  '$2a$10$F8neEIE6HrwoU8WrR5PFrOINv4XsJ.JSFCJ9p.hO/12.LeGfr02LW'
)
ON CONFLICT (email) DO NOTHING
RETURNING id, nome, email;

-- Criar categorias padrão para o usuário de teste
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
ON CONFLICT DO NOTHING;
