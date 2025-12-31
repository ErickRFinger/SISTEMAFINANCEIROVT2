# 🔧 Solução: Criar Usuário de Teste

## Problema
O RLS (Row Level Security) do Supabase está bloqueando a criação de usuários.

## Solução 1: Via SQL Editor (Recomendado)

### Passo a Passo:

1. **Acesse o Supabase:**
   - Vá em: https://supabase.com/dashboard
   - Selecione seu projeto
   - Clique em **SQL Editor**

2. **Execute este SQL:**

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Criar usuário de teste
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
```

3. **Credenciais de Acesso:**
   - Email: `teste@teste.com`
   - Senha: `teste123`

## Solução 2: Via Interface do Sistema (Mais Fácil)

1. Acesse: `http://localhost:3000`
2. Clique em **"Cadastre-se"**
3. Preencha:
   - Nome: `Usuário Teste`
   - Email: `teste@teste.com`
   - Senha: `teste123`
4. Clique em **"Criar Conta"**

Isso vai criar o usuário automaticamente e já vai funcionar!

## Solução 3: Desabilitar RLS Permanentemente (Opcional)

Se você não quiser usar RLS, pode desabilitá-lo:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;
```

**⚠️ Atenção:** Isso remove a segurança a nível de banco. O sistema já tem segurança via JWT, então pode ser seguro desabilitar o RLS se você confiar na aplicação.

## Verificar se Funcionou

Após criar o usuário, teste fazendo login:
1. Acesse: `http://localhost:3000`
2. Faça login com `teste@teste.com` / `teste123`
3. Se funcionar, você verá o dashboard!

## Separação por Usuário

✅ O sistema **já garante** que cada usuário só vê seus próprios dados através do JWT e filtros por `user_id` em todas as queries. Mesmo sem RLS, os dados estão separados!

