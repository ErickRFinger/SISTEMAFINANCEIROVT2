@echo off
echo Iniciando o Servidor Backend...
npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias.
    pause
    exit /b
)

echo Iniciando servidor...
npm start
pause
