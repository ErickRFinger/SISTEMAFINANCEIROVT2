import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './database/db.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import transacoesRoutes from './routes/transacoes.js';
import categoriasRoutes from './routes/categorias.js';
import perfilRoutes from './routes/perfil.js';
import ocrRoutes from './routes/ocr.js';
import metasRoutes from './routes/metas.js';
import bancosRoutes from './routes/bancos.js';
import gastosRecorrentesRoutes from './routes/gastos-recorrentes.js';
import investimentosRoutes from './routes/investimentos.js';

dotenv.config();

// Verificar variáveis de ambiente críticas
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missingEnvVars.join(', '));
  console.error('⚠️  Configure essas variáveis no Vercel (Settings → Environment Variables)');
  // Não encerrar o processo no Vercel, apenas logar o erro
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
// Configurar CORS para funcionar tanto localmente quanto no Vercel
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);

    // Permitir localhost em desenvolvimento
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Permitir domínios do Vercel
    if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
      return callback(null, true);
    }

    // Em produção, permitir apenas o domínio do Vercel
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware de debug global para TODAS as requisições
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`\n🌐 [SERVER] Requisição recebida:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.path}`);
    console.log(`   Original URL: ${req.originalUrl}`);
    console.log(`   Base URL: ${req.baseUrl}`);
    console.log(`   Authorization: ${req.headers.authorization ? 'Presente' : 'Ausente'}`);
  }
  next();
});

// Rota de saúde (não precisa de autenticação) - DEVE SER A PRIMEIRA
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema Financeiro API está funcionando' });
});

// Rota de debug para verificar variáveis de ambiente (Remover em produção final)
app.get('/api/debug-env', (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    supabase_url: process.env.SUPABASE_URL ? 'Configurado (Inicia com ' + process.env.SUPABASE_URL.substring(0, 10) + '...)' : 'MISSING',
    supabase_key: process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'MISSING',
    jwt_secret: process.env.JWT_SECRET ? 'Configurado' : 'MISSING'
  });
});

// Rota de teste direto de Banco de Dados (Isolada)
app.get('/api/debug-db', async (req, res) => {
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
    const duration = Date.now() - start;

    if (error) {
      console.error('❌ [DEBUG DB] Erro:', error);
      return res.status(500).json({ status: 'error', error: error.message, details: error });
    }

    res.json({ status: 'success', duration: duration + 'ms', data });
  } catch (err) {
    console.error('❌ [DEBUG DB] Exceção:', err);
    res.status(500).json({ status: 'exception', error: err.message });
  }
});

// Registrar todas as rotas da API
console.log('📝 Registrando rotas da API...');

// Rotas de autenticação (não precisam de token)
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);

// Rotas que precisam de autenticação
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/ocr', ocrRoutes);

// Registrar metas e bancos com logs de confirmação
console.log('   Registrando /api/metas...');
app.use('/api/metas', metasRoutes);

console.log('   Registrando /api/bancos...');
app.use('/api/bancos', (req, res, next) => {
  console.log(`\n🎯 [SERVER] Rota /api/bancos capturada ANTES do router:`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  next();
}, bancosRoutes);

app.use('/api/gastos-recorrentes', gastosRecorrentesRoutes);
app.use('/api/investimentos', investimentosRoutes);

console.log('✅ Todas as rotas registradas');
console.log('   ✓ /api/auth');
console.log('   ✓ /api/transacoes');
console.log('   ✓ /api/categorias');
console.log('   ✓ /api/perfil');
console.log('   ✓ /api/ocr');
console.log('   ✓ /api/metas');
console.log('   ✓ /api/bancos');
console.log('   ✓ /api/gastos-recorrentes');
console.log('   ✓ /api/investimentos');

// Rota não encontrada (404) - DEVE SER A ÚLTIMA ANTES DO TRATAMENTO DE ERROS
app.use((req, res, next) => {
  // Ignorar se não for rota da API
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // Se a resposta já foi enviada, alguma rota processou a requisição
  if (res.headersSent) {
    return next();
  }

  // Log detalhado para debug
  console.error(`\n❌ [404] Rota não encontrada`);
  console.error(`   Method: ${req.method}`);
  console.error(`   Path: ${req.path}`);
  console.error(`   Original URL: ${req.originalUrl}`);
  console.error(`   Base URL: ${req.baseUrl}`);
  console.error(`   Headers sent: ${res.headersSent}`);

  // Verificar todas as rotas registradas
  console.error(`\n   Rotas registradas:`);
  let foundApiRoutes = false;
  app._router.stack.forEach((layer, i) => {
    if (layer.regexp) {
      const regexStr = layer.regexp.toString();
      if (regexStr.includes('api')) {
        foundApiRoutes = true;
        console.error(`     ${i}. ${regexStr.substring(0, 100)}`);
      }
    }
  });

  if (!foundApiRoutes) {
    console.error(`   ⚠️ NENHUMA ROTA DA API ENCONTRADA NO STACK!`);
  }

  return res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    message: `A rota ${req.originalUrl} não foi encontrada no servidor`
  });
});

// Tratamento de erros global - DEVE SER O ÚLTIMO MIDDLEWARE
app.use((err, req, res, next) => {
  // Se a resposta já foi enviada, não fazer nada
  if (res.headersSent) {
    return next(err);
  }

  console.error('\n❌ [ERRO GLOBAL] Erro não tratado:');
  console.error('   Mensagem:', err.message);
  console.error('   Tipo:', err.name);
  console.error('   URL:', req.originalUrl);
  console.error('   Method:', req.method);
  console.error('   Stack:', err.stack);

  // Determinar status code apropriado
  const statusCode = err.statusCode || err.status || 500;

  // Garantir que sempre retornamos uma string de erro
  let errorMessage = 'Erro interno do servidor';

  if (err.message) {
    errorMessage = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
  }

  // Em produção, não expor detalhes do erro
  if (process.env.NODE_ENV === 'production') {
    errorMessage = 'Ocorreu um erro ao processar sua requisição. Tente novamente.';
  }

  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && {
      details: err.message,
      stack: err.stack
    })
  });
});

// Iniciar servidor apenas se não estiver no Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📋 Rotas disponíveis: /api/health, /api/auth/login, etc`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
  });
}

// Exportar app para uso no Vercel (deve ser a última linha)
export default app;
