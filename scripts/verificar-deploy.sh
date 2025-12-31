#!/bin/bash

echo "🔍 Verificando estrutura para deploy no Vercel..."
echo ""

# Verificar arquivos necessários
echo "📁 Verificando arquivos..."
files=("vercel.json" "api/index.js" "backend/server.js" "frontend/package.json")
missing=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (FALTANDO)"
        missing=1
    fi
done

echo ""

# Verificar estrutura de diretórios
echo "📂 Verificando diretórios..."
dirs=("api" "backend" "backend/routes" "frontend/src")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ (FALTANDO)"
        missing=1
    fi
done

echo ""

# Verificar package.json
echo "📦 Verificando package.json..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json (raiz)"
else
    echo "  ⚠️  package.json (raiz) não encontrado (opcional)"
fi

if [ -f "frontend/package.json" ]; then
    echo "  ✅ frontend/package.json"
    if grep -q "\"build\"" frontend/package.json; then
        echo "    ✅ Script 'build' encontrado"
    else
        echo "    ❌ Script 'build' não encontrado"
        missing=1
    fi
else
    echo "  ❌ frontend/package.json (FALTANDO)"
    missing=1
fi

if [ -f "backend/package.json" ]; then
    echo "  ✅ backend/package.json"
else
    echo "  ❌ backend/package.json (FALTANDO)"
    missing=1
fi

echo ""

# Verificar variáveis de ambiente
echo "🔐 Verificando variáveis de ambiente..."
if [ -f ".env.example" ]; then
    echo "  ✅ .env.example encontrado"
    echo "  ⚠️  Configure as variáveis no painel do Vercel:"
    echo "     - SUPABASE_URL"
    echo "     - SUPABASE_ANON_KEY"
    echo "     - JWT_SECRET"
    echo "     - NODE_ENV=production"
else
    echo "  ⚠️  .env.example não encontrado"
fi

echo ""

# Verificar vercel.json
if [ -f "vercel.json" ]; then
    echo "⚙️  Verificando vercel.json..."
    if grep -q "outputDirectory" vercel.json; then
        echo "  ✅ outputDirectory configurado"
    else
        echo "  ⚠️  outputDirectory não encontrado"
    fi
    
    if grep -q "/api/" vercel.json; then
        echo "  ✅ Rewrites para /api/ configurados"
    else
        echo "  ⚠️  Rewrites para /api/ não encontrados"
    fi
fi

echo ""

# Resultado final
if [ $missing -eq 0 ]; then
    echo "✅ Estrutura verificada! Pronto para deploy no Vercel."
    echo ""
    echo "📤 Próximos passos:"
    echo "   1. Configure as variáveis de ambiente no Vercel"
    echo "   2. Execute: vercel --prod"
    echo "   Ou conecte ao GitHub para deploy automático"
    exit 0
else
    echo "❌ Alguns arquivos estão faltando. Corrija antes de fazer deploy."
    exit 1
fi

