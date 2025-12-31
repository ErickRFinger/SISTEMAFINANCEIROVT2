# 🚀 Guia de Deploy no Vercel

Este guia explica como fazer deploy do Sistema Financeiro no Vercel.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com) (já configurada)
3. Git instalado (opcional, mas recomendado)

## 🔧 Configuração

### 1. Variáveis de Ambiente

No painel do Vercel, você precisa configurar as seguintes variáveis de ambiente:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
SUPABASE_URL=https://yizdwjphaynqrisftruo.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
JWT_SECRET=sua_chave_secreta_jwt_aqui
NODE_ENV=production
```

**Importante**: 
- Substitua `sua_chave_anon_aqui` pela sua chave anon do Supabase
- Substitua `sua_chave_secreta_jwt_aqui` por uma string aleatória segura (pode usar: `openssl rand -base64 32`)

### 2. Estrutura do Projeto

O projeto está configurado com:
- **Frontend**: Build estático do Vite (React)
- **Backend**: Serverless Functions no Vercel
- **API**: Rotas em `/api/*` são redirecionadas para o backend

## 📤 Deploy

### Opção 1: Via CLI do Vercel (Recomendado)

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. No diretório raiz do projeto, execute:
```bash
vercel
```

4. Siga as instruções:
   - Link to existing project? **N** (primeira vez)
   - Project name: **sistema-financeiro** (ou o nome que preferir)
   - Directory: **./** (raiz)
   - Override settings? **N**

5. Para fazer deploy em produção:
```bash
vercel --prod
```

### Opção 2: Via GitHub (Recomendado para CI/CD)

1. Crie um repositório no GitHub
2. Faça push do código:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/sistema-financeiro.git
git push -u origin main
```

3. No Vercel:
   - Clique em **Add New Project**
   - Importe o repositório do GitHub
   - Configure as variáveis de ambiente
   - Clique em **Deploy**

### Opção 3: Via Interface Web do Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **Add New Project**
3. Faça upload da pasta do projeto ou conecte ao GitHub
4. Configure as variáveis de ambiente
5. Clique em **Deploy**

## 🔍 Verificação

Após o deploy, verifique:

1. **Frontend**: Acesse `https://seu-projeto.vercel.app`
2. **API Health**: Acesse `https://seu-projeto.vercel.app/api/health`
3. **Logs**: Verifique os logs no painel do Vercel

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o build está instalando as dependências corretamente

### Erro: "Environment variable not found"
- Verifique se todas as variáveis de ambiente estão configuradas no Vercel
- Certifique-se de que estão marcadas para o ambiente correto (Production, Preview, Development)

### Erro: "Function timeout"
- O Vercel tem um timeout de 10 segundos para funções gratuitas
- Para funções mais longas, considere o plano Pro

### API não está respondendo
- Verifique se as rotas estão corretas no `vercel.json`
- Verifique os logs no painel do Vercel
- Certifique-se de que o arquivo `api/index.js` está correto

## 📝 Notas Importantes

1. **Uploads**: O sistema de upload de arquivos (OCR) pode não funcionar no plano gratuito do Vercel devido a limitações de armazenamento. Considere usar um serviço externo como AWS S3 ou Cloudinary.

2. **Banco de Dados**: Certifique-se de que o Supabase está configurado corretamente e as tabelas foram criadas.

3. **CORS**: O CORS está configurado para aceitar requisições do domínio do Vercel automaticamente.

4. **Build Time**: O primeiro build pode demorar alguns minutos. Builds subsequentes são mais rápidos.

## 🔄 Atualizações

Para atualizar o sistema:

1. Faça as alterações no código
2. Faça commit e push (se usando GitHub)
3. O Vercel fará deploy automático
4. Ou execute `vercel --prod` manualmente

## 📚 Recursos

- [Documentação do Vercel](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Supabase Documentation](https://supabase.com/docs)

