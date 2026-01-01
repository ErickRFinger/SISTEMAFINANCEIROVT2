@echo off
echo Iniciando servidor LOCALMENTE (Modo Seguro)...

if not exist node_modules call npm install

echo Configurando API Key em memoria...
set GEMINI_API_KEY=AIzaSyBqhzeN6800eoLNxyr2NZMu_XB_DMnpUvY
set SUPABASE_URL=https://psrzhonlxeoastsbcwhv.supabase.co
set SUPABASE_ANON_KEY=sb_publishable_UsDPIXyysyDgaNXorqNEWQ_rAl5ao_A
set SUPABASE_SERVICE_KEY=sb_secret_sfGA1AEc3Zpeua_qWkc0MQ_V-qOUW7J
set JWT_SECRET=supersecret_finance_jwt_key_2025_secure
set PORT=3001

echo Iniciando Node.js...
node server.js
pause


