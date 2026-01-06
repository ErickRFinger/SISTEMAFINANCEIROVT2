@echo off
echo Iniciando servidor LOCALMENTE (Modo Seguro)...

if not exist node_modules call npm install

echo Carregando variaveis do .env...

echo Iniciando Node.js...
node server.js
pause


