@echo off
echo Iniciando o Frontend (Visual)...

if not exist node_modules (
    echo Instalando dependencias do Frontend...
    call npm install
)

echo Iniciando Vite Server...
call npm run dev
timeout /t 10
pause
