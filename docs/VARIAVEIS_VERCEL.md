# 🔐 Variáveis de Ambiente para o Vercel

## 📋 Copie e Cole no Vercel

Acesse: **Vercel Dashboard → Seu Projeto → Settings → Environment Variables**

---

## ✅ VARIÁVEL 1: SUPABASE_URL

```
Key: SUPABASE_URL
Value: https://yizdwjphaynqrisftruo.supabase.co
```

☑ Production  
☑ Preview  
☑ Development

---

## ✅ VARIÁVEL 2: SUPABASE_ANON_KEY

```
Key: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpemR3anBoYXlucXJpc2Z0cnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODk1NjEsImV4cCI6MjA3ODg4NTU2MX0.L7KBdI8hF9CQCj8_BbcC7Mdw4NjItx6ZBf3-3aZ07IY
```

☑ Production  
☑ Preview  
☑ Development

---

## ✅ VARIÁVEL 3: JWT_SECRET

```
Key: JWT_SECRET
Value: gO2Sl2KbYemZNcWjwMOFoITcdh9pACutko0QWmpESDI=
```

**OU gere uma nova** (recomendado):
```bash
openssl rand -base64 32
```

☑ Production  
☑ Preview  
☑ Development

---

## ⚙️ VARIÁVEL 4: NODE_ENV (Opcional)

```
Key: NODE_ENV
Value: production
```

☑ Production apenas

---

## 🚀 Após Adicionar

1. **Salve** cada variável
2. Vá em **Deployments**
3. Clique nos **3 pontos (...)** do último deploy
4. Clique em **Redeploy**
5. Aguarde o deploy terminar
6. Teste: `https://seu-projeto.vercel.app/api/health`

---

## ✅ Checklist

- [ ] SUPABASE_URL adicionada
- [ ] SUPABASE_ANON_KEY adicionada  
- [ ] JWT_SECRET adicionada
- [ ] Todas marcadas para Production, Preview e Development
- [ ] Redeploy feito
- [ ] Teste da API funcionando

---

## 🆘 Se Der Erro

1. Verifique se marcou **Production**
2. Verifique se fez **Redeploy** após adicionar
3. Veja os logs: **Functions → Logs**

