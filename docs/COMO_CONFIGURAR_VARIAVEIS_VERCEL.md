# 🔐 Como Configurar Variáveis de Ambiente no Vercel

## ❌ NÃO é Automático!

O Vercel **NÃO** configura as variáveis de ambiente automaticamente. Você precisa configurá-las manualmente.

## 📋 Passo a Passo

### 1. Acesse seu Projeto no Vercel

1. Vá para [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Clique no seu projeto (Sistema Financeiro)

### 2. Vá para Settings → Environment Variables

1. No menu lateral, clique em **Settings**
2. Clique em **Environment Variables** (no menu lateral esquerdo)

### 3. Adicione as Variáveis

Você precisa adicionar **3 variáveis**:

#### Variável 1: SUPABASE_URL
- **Key**: `SUPABASE_URL`
- **Value**: `https://yizdwjphaynqrisftruo.supabase.co`
- **Environment**: Marque todas as opções (Production, Preview, Development)

#### Variável 2: SUPABASE_ANON_KEY
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: Sua chave anon do Supabase
  - Para encontrar: Supabase Dashboard → Settings → API → anon/public key
- **Environment**: Marque todas as opções (Production, Preview, Development)

#### Variável 3: JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: Uma string aleatória segura
  - **Como gerar**: Execute no terminal:
    ```bash
    openssl rand -base64 32
    ```
  - Ou use um gerador online: https://randomkeygen.com/
- **Environment**: Marque todas as opções (Production, Preview, Development)

### 4. Salve e Faça Redeploy

1. Clique em **Save** para cada variável
2. Após adicionar todas, vá em **Deployments**
3. Clique nos 3 pontos (...) do último deploy
4. Clique em **Redeploy**
5. Ou faça um novo commit e push (deploy automático)

## 🔍 Como Verificar se Está Configurado

### Opção 1: Via Painel do Vercel
1. Settings → Environment Variables
2. Você deve ver as 3 variáveis listadas

### Opção 2: Via Logs
1. Functions → Logs
2. Procure por mensagens de erro sobre variáveis faltando
3. Se não aparecer erro, está configurado!

### Opção 3: Teste a API
1. Acesse: `https://seu-projeto.vercel.app/api/health`
2. Se retornar `{"status":"ok",...}`, está funcionando!

## ⚠️ Importante

- **NÃO** commite arquivos `.env` no Git
- **NÃO** compartilhe suas chaves publicamente
- **SEMPRE** marque para Production, Preview e Development
- **APÓS** adicionar variáveis, faça um redeploy

## 🎯 Valores que Você Precisa

### 1. SUPABASE_URL
```
https://yizdwjphaynqrisftruo.supabase.co
```

### 2. SUPABASE_ANON_KEY
- Acesse: https://supabase.com/dashboard
- Seu projeto → Settings → API
- Copie a chave **anon/public**

### 3. JWT_SECRET
- Gere uma string aleatória de 32+ caracteres
- Exemplo de comando:
  ```bash
  openssl rand -base64 32
  ```
- Ou use: https://randomkeygen.com/ (CodeIgniter Encryption Keys)

## 📸 Exemplo Visual

```
Vercel Dashboard
├── Seu Projeto
    ├── Settings
        ├── Environment Variables
            ├── Add New
                ├── Key: SUPABASE_URL
                ├── Value: https://yizdwjphaynqrisftruo.supabase.co
                ├── ☑ Production
                ├── ☑ Preview
                └── ☑ Development
```

## ✅ Checklist

- [ ] Acessei o Vercel Dashboard
- [ ] Fui em Settings → Environment Variables
- [ ] Adicionei SUPABASE_URL
- [ ] Adicionei SUPABASE_ANON_KEY
- [ ] Adicionei JWT_SECRET
- [ ] Marquei todas para Production, Preview e Development
- [ ] Fiz um redeploy
- [ ] Testei a API (/api/health)
- [ ] Testei o login

## 🆘 Problemas Comuns

### "Variáveis não aparecem após adicionar"
- Faça um **redeploy** manual
- As variáveis só são aplicadas em novos deploys

### "Ainda dá erro de variáveis faltando"
- Verifique se marcou para **Production**
- Verifique se fez **redeploy** após adicionar
- Verifique os logs no Vercel

### "Não sei onde encontrar SUPABASE_ANON_KEY"
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings (ícone de engrenagem)
4. Clique em API
5. Copie a chave **anon public**

## 📚 Links Úteis

- [Documentação Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Dashboard](https://supabase.com/dashboard)

