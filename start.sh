#!/bin/bash

echo "🚀 Iniciando Sistema Financeiro..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Iniciar backend
echo "📦 Iniciando backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências do backend..."
    npm install
fi

# Iniciar backend em background
npm start &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 3

# Iniciar frontend
echo "⚛️  Iniciando frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências do frontend..."
    npm install
fi

# Iniciar frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Sistema iniciado!"
echo "📊 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar os servidores"

# Aguardar Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

