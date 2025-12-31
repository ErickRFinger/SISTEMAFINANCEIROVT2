# 🆘 Soluções para Erro de Runtime no Vercel

## ❌ Erro
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

## 🔍 Diagnóstico

Este erro geralmente ocorre quando:
1. O Vercel está tentando detectar o runtime automaticamente e falha
2. Há algum arquivo sendo detectado incorretamente como função
3. Cache do Vercel está usando configuração antiga

## ✅ Soluções (Tente nesta ordem)

### Solução 1: Limpar Cache e Redeploy

1. No Vercel Dashboard:
   - Vá em **Deployments**
   - Clique nos **3 pontos (...)** do último deploy
   - Selecione **Redeploy** (marque "Use existing Build Cache" como **NÃO**)

### Solução 2: Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# No diretório do projeto
cd "/Users/erickruanfinger/Desktop/SISTEMA FINANCEIRO"

# Deploy forçado (sem cache)
vercel --prod --force
```

### Solução 3: Remover e Recriar Projeto

1. **No Vercel Dashboard**:
   - Settings → General → Delete Project
   - Confirme a exclusão

2. **Recrie o projeto**:
   - Add New Project
   - Importe do GitHub novamente
   - Configure as variáveis de ambiente
   - Deploy

### Solução 4: Verificar Estrutura

Certifique-se de que:
- ✅ `api/index.js` existe e exporta uma função
- ✅ `api/package.json` tem `engines` configurado
- ✅ Não há outros arquivos `.js` na raiz que possam ser detectados

### Solução 5: Contatar Suporte Vercel

Se nada funcionar:
- Pode ser um bug do Vercel
- Entre em contato: https://vercel.com/support

## 📋 Configuração Atual (Deve Estar Correta)

### api/index.js
```javascript
import app from '../backend/server.js';

export default function handler(req, res) {
  return app(req, res);
}
```

### api/package.json
```json
{
  "name": "api",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### vercel.json
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🎯 Recomendação Imediata

**Tente a Solução 2 (Deploy via CLI)** primeiro, pois:
- Contorna problemas de detecção automática
- Força um build limpo
- Pode revelar o problema real nos logs

## 📝 Logs para Debug

Ao fazer deploy via CLI, você verá logs detalhados que podem ajudar a identificar o problema exato.

