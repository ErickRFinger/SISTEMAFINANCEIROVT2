# 🚀 Sistema Financeiro - Deploy no Vercel

## 📦 Estrutura do Projeto

```
SISTEMA FINANCEIRO/
├── api/
│   └── index.js          # Entry point para Vercel Serverless Functions
├── backend/
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares (auth, upload)
│   ├── database/          # Configuração do Supabase
│   └── server.js          # Servidor Express
├── frontend/
│   ├── src/               # Código React
│   ├── dist/              # Build de produção (gerado)
│   └── package.json
├── vercel.json            # Configuração do Vercel
└── .vercelignore          # Arquivos ignorados no deploy
```

## 🔧 Configuração Rápida

### 1. Variáveis de Ambiente no Vercel

Configure estas variáveis no painel do Vercel (Settings → Environment Variables):

```
SUPABASE_URL=https://yizdwjphaynqrisftruo.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
JWT_SECRET=uma_string_secreta_aleatoria_aqui
NODE_ENV=production
```

**Como gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Deploy

#### Opção A: Via CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Opção B: Via GitHub
1. Faça push do código para o GitHub
2. No Vercel, importe o repositório
3. Configure as variáveis de ambiente
4. Deploy automático!

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Tabelas criadas no Supabase (execute os scripts SQL)
- [ ] RLS (Row Level Security) configurado no Supabase
- [ ] Build do frontend funcionando (`npm run build` no diretório frontend)
- [ ] Teste local funcionando

## 🔍 Testando o Deploy

1. **Health Check**: `https://seu-projeto.vercel.app/api/health`
2. **Frontend**: `https://seu-projeto.vercel.app`
3. **API**: `https://seu-projeto.vercel.app/api/auth/login`

## 📝 Notas Importantes

- O Vercel automaticamente detecta e faz build do frontend
- As rotas `/api/*` são redirecionadas para serverless functions
- Uploads de arquivos podem ter limitações no plano gratuito
- Logs estão disponíveis no painel do Vercel

## 🐛 Troubleshooting

**Erro: Module not found**
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para testar

**Erro: Environment variable not found**
- Verifique se todas as variáveis estão configuradas
- Certifique-se de que estão marcadas para "Production"

**API não responde**
- Verifique os logs no painel do Vercel
- Teste a rota `/api/health` primeiro

Para mais detalhes, consulte `VERCEL_DEPLOY.md`

