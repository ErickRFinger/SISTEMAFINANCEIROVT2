# 🔧 Solução: Problema com RLS (Row Level Security)

## Problema Identificado

O Supabase está bloqueando as operações devido ao **RLS (Row Level Security)** habilitado nas tabelas.

## ✅ Solução Rápida

### Opção 1: Desabilitar RLS (Recomendado para este sistema)

Execute este SQL no **SQL Editor do Supabase**:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;
```

**Por que isso é seguro?**
- O sistema já tem autenticação JWT
- Todas as queries filtram por `user_id`
- Os dados já estão separados por usuário no código da aplicação

### Opção 2: Usar Service Key (Alternativa)

Se você quiser manter o RLS habilitado:

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie a **service_role key** (NUNCA exponha no frontend!)
3. No arquivo `backend/.env`, adicione:
   ```
   SUPABASE_SERVICE_KEY=sua_service_key_aqui
   ```
4. O sistema vai usar automaticamente a service key se disponível

## 📝 Passo a Passo

1. **Acesse o Supabase:**
   - https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em **SQL Editor**

2. **Execute o SQL:**
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
   ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;
   ```

3. **Teste novamente:**
   - Tente criar uma conta em `http://localhost:3000`
   - Ou fazer login se já tiver uma conta

## 🔍 Verificar se Funcionou

Após desabilitar o RLS, teste:

```bash
# Teste de registro
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@teste.com","senha":"teste123"}'

# Deve retornar token e dados do usuário
```

## ⚠️ Importante

- O RLS é uma camada extra de segurança
- Para este sistema, não é necessário porque:
  - JWT já protege as rotas
  - Queries filtram por user_id
  - Backend valida todas as operações

- Se você quiser manter RLS, precisa criar políticas específicas (veja o arquivo `backend/database/fix-rls.sql`)

## 🚀 Após Corrigir

1. Recarregue a página do sistema
2. Tente criar uma conta
3. Faça login
4. Deve funcionar perfeitamente!

