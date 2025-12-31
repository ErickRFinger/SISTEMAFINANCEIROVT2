# 👤 Criar Usuário de Teste

## Credenciais de Acesso

- **Email:** `teste@teste.com`
- **Senha:** `teste123`

## Como Criar o Usuário

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o script que está em `backend/scripts/criar-usuario-teste.sql`

Ou copie e cole este SQL:

```sql
-- Inserir usuário de teste
INSERT INTO users (nome, email, senha)
VALUES (
  'Usuário Teste',
  'teste@teste.com',
  '$2a$10$F8neEIE6HrwoU8WrR5PFrOINv4XsJ.JSFCJ9p.hO/12.LeGfr02LW'
)
ON CONFLICT (email) DO NOTHING
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
ON CONFLICT DO NOTHING;
```

### Opção 2: Via Interface do Sistema

1. Acesse `http://localhost:3000`
2. Clique em "Cadastre-se"
3. Use as credenciais:
   - Nome: Usuário Teste
   - Email: teste@teste.com
   - Senha: teste123

## Importante

⚠️ **Separação por Usuário**: O sistema já está configurado para separar todos os dados por usuário. Cada usuário só vê suas próprias:
- Transações
- Categorias
- Dados do dashboard

Isso é garantido pelo sistema de autenticação JWT e pelas queries que filtram por `user_id`.

## Criar Mais Usuários

Para criar mais usuários de teste, você pode:
1. Usar a interface de registro do sistema
2. Executar o script SQL novamente com dados diferentes
3. Usar o script Node.js (se o RLS permitir): `npm run criar-teste`

