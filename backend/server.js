import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './database/db.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import transacoesRoutes from './routes/transacoes.js';
import categoriasRoutes from './routes/categorias.js';
import perfilRoutes from './routes/perfil.js';
// Retomando rotas após correção do Lazy Load no Gemini
import ocrRoutes from './routes/ocr.js';
import metasRoutes from './routes/metas.js';
import bancosRoutes from './routes/bancos.js';
import gastosRecorrentesRoutes from './routes/gastos-recorrentes.js';
import investimentosRoutes from './routes/investimentos.js';
import diagnosticoRoutes from './routes/diagnostico.js';

// ... (other imports)

// Registrar rotas
app.use('/api/auth', authRoutes);
// ...
app.use('/api/setup', setupRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);

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

// Middleware de debug global
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`\n🌐 [SERVER] Requisição recebida:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.path}`);
  }
  next();
});

// Rota de saúde (DEVE SER A PRIMEIRA)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sistema Financeiro API está funcionando (FULL MODE)',
    timestamp: new Date().toISOString()
  });
});

// Rota de debug de ambiente
app.get('/api/debug-env', (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    supabase_configured: !!process.env.SUPABASE_URL,
    gemini_configured: !!process.env.GEMINI_API_KEY
  });
});

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/bancos', bancosRoutes);
app.use('/api/gastos-recorrentes', gastosRecorrentesRoutes);
app.use('/api/investimentos', investimentosRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ [ERRO GLOBAL]:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

// Start server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

export default app;
