# 🔧 Configuração do Supabase

## Passo 1: Criar as Tabelas

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o script SQL que está em `backend/database/schema.sql`

Ou copie e cole este SQL:

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, nome, tipo)
);

-- Tabela de transações
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user ON transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_user ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);
```

## Passo 2: Obter as Chaves da API

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie a **URL** do projeto (já temos: `https://yizdwjphaynqrisftruo.supabase.co`)
3. Copie a **anon/public key** (chave pública)
4. Opcionalmente, copie a **service_role key** (chave de serviço - use com cuidado!)

## Passo 3: Configurar o Backend

1. No arquivo `backend/.env`, adicione:

```env
PORT=3001
JWT_SECRET=sistema_financeiro_secret_key_2024
NODE_ENV=development

SUPABASE_URL=https://yizdwjphaynqrisftruo.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

2. Substitua `sua_chave_anon_aqui` pela chave que você copiou

## Passo 4: Instalar Dependências

```bash
cd backend
npm install
```

## Passo 5: Testar

```bash
npm start
```

O servidor deve iniciar sem erros. Se houver problemas, verifique:
- Se as tabelas foram criadas corretamente
- Se as chaves do Supabase estão corretas no `.env`
- Se o projeto do Supabase está ativo

## Notas Importantes

- **Row Level Security (RLS)**: Por padrão, o RLS está desabilitado. Se você quiser habilitá-lo, precisará criar políticas específicas no Supabase.
- **Service Key**: Use apenas em ambientes seguros (backend). Nunca exponha no frontend!
- **Anon Key**: Pode ser usada no frontend, mas com RLS habilitado para segurança.

