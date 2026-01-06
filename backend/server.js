import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './database/db.js';

// Rotas
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import transacoesRoutes from './routes/transacoes.js';
import categoriasRoutes from './routes/categorias.js';
import perfilRoutes from './routes/perfil.js';
import metasRoutes from './routes/metas.js';
import bancosRoutes from './routes/bancos.js';
import gastosRecorrentesRoutes from './routes/gastos-recorrentes.js';
import investimentosRoutes from './routes/investimentos.js';
import cartoesRoutes from './routes/cartoes.js';
import setupRoutes from './routes/setup.js';
import funcionariosRoutes from './routes/funcionarios.js';
import produtosRoutes from './routes/produtos.js';
import kanbanRoutes from './routes/kanban.js';
import clientesRoutes from './routes/clientes.js';

dotenv.config();

// Verificar variáveis de ambiente críticas
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missingEnvVars.join(', '));
  console.error('⚠️  Configure essas variáveis no Vercel (Settings → Environment Variables)');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware de debug
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`\n🌐 [SERVER] ${req.method} ${req.path}`);
  }
  next();
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sistema Financeiro API está funcionando (CLEAN V2)',
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
app.use('/api/metas', metasRoutes);
app.use('/api/bancos', bancosRoutes);
app.use('/api/gastos-recorrentes', gastosRecorrentesRoutes);
app.use('/api/investimentos', investimentosRoutes);
app.use('/api/cartoes', cartoesRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/produtos', produtosRoutes);

// import { generateFinancialAdvice } from './services/aiService.js'; // REMOVIDO: Import estático causava erro
import { authenticateToken } from './middleware/auth.js';

// Rota de Chat V5.0 (Com Import Dinâmico para Segurança)
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    // Dynamic Import: Carrega o serviço de IA apenas quando a rota é chamada.
    // Isso impede que o servidor caia na inicialização se a biblioteca do Google falhar.
    const { generateFinancialAdvice } = await import('./services/aiService.js');

    const { message } = req.body;
    const response = await generateFinancialAdvice(req.user.id, message);
    res.json({ reply: response });
  } catch (error) {
    console.error('Chat Error (Dynamic Load):', error);
    res.status(500).json({
      error: 'Serviço de IA indisponível no momento.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

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

app.use('/api/kanban', kanbanRoutes);
app.use('/api/clientes', clientesRoutes);
import vendasRoutes from './routes/vendas.js';
app.use('/api/vendas', vendasRoutes);

export default app;
