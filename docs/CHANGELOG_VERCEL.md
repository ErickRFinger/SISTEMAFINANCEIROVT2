# 📝 Alterações para Deploy no Vercel

## ✅ Arquivos Criados

1. **`vercel.json`** - Configuração principal do Vercel
   - Define build command para o frontend
   - Configura rewrites para `/api/*` → serverless functions
   - Define output directory como `frontend/dist`

2. **`api/index.js`** - Entry point para Serverless Functions
   - Importa e exporta o servidor Express
   - Permite que o Vercel execute o backend como função serverless

3. **`.vercelignore`** - Arquivos ignorados no deploy
   - Ignora node_modules, logs, arquivos temporários
   - Otimiza o tamanho do deploy

4. **`.gitignore`** - Arquivos ignorados no Git
   - Configurado para não commitar arquivos sensíveis

5. **`package.json`** (raiz) - Scripts úteis
   - Scripts para desenvolvimento e build

6. **Documentação**:
   - `VERCEL_DEPLOY.md` - Guia completo de deploy
   - `README_VERCEL.md` - Guia rápido
   - `scripts/verificar-deploy.sh` - Script de verificação

## 🔧 Arquivos Modificados

1. **`backend/server.js`**
   - Exporta o app Express para uso no Vercel
   - Verifica se está rodando no Vercel antes de iniciar servidor
   - Mantém compatibilidade com ambiente local

2. **`backend/server.js` (CORS)**
   - Configurado para aceitar requisições do Vercel
   - Mantém suporte para localhost em desenvolvimento

3. **`frontend/package.json`**
   - Adicionado script `vercel-build` para o Vercel

## 🎯 Estrutura Final

```
SISTEMA FINANCEIRO/
├── api/
│   └── index.js              # Entry point Vercel
├── backend/
│   ├── routes/               # Rotas da API
│   ├── middleware/           # Auth, upload
│   ├── database/             # Supabase config
│   └── server.js             # Express app (exportado)
├── frontend/
│   ├── src/                  # Código React
│   ├── dist/                 # Build (gerado)
│   └── package.json
├── vercel.json               # Config Vercel
├── .vercelignore            # Ignore files
└── .gitignore               # Git ignore
```

## 🚀 Como Funciona

1. **Frontend**: 
   - Vercel faz build do frontend (`npm run build` em `frontend/`)
   - Serve arquivos estáticos de `frontend/dist/`

2. **Backend**:
   - Rotas `/api/*` são redirecionadas para `api/index.js`
   - `api/index.js` importa e exporta o Express app
   - Vercel executa como Serverless Function

3. **Variáveis de Ambiente**:
   - Configuradas no painel do Vercel
   - Disponíveis tanto para frontend quanto backend

## 📋 Checklist de Deploy

- [x] Estrutura de arquivos criada
- [x] `vercel.json` configurado
- [x] `api/index.js` criado
- [x] `backend/server.js` ajustado para Vercel
- [x] CORS configurado
- [x] Scripts de build configurados
- [x] Documentação criada
- [ ] Variáveis de ambiente configuradas no Vercel (você precisa fazer)
- [ ] Deploy realizado

## 🔐 Variáveis de Ambiente Necessárias

Configure no painel do Vercel:

```
SUPABASE_URL=https://yizdwjphaynqrisftruo.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon
JWT_SECRET=string_aleatoria_segura
NODE_ENV=production
```

## ✨ Próximos Passos

1. Configure as variáveis de ambiente no Vercel
2. Execute `vercel --prod` ou conecte ao GitHub
3. Teste o deploy acessando a URL fornecida
4. Verifique os logs no painel do Vercel se houver problemas

