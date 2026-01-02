import express from 'express';
import supabase from '../database/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const report = {
        timestamp: new Date().toISOString(),
        environment: {
            node_env: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL,
            has_supabase_url: !!process.env.SUPABASE_URL,
            has_supabase_key: !!process.env.SUPABASE_ANON_KEY || !!process.env.SUPABASE_SERVICE_KEY,
            has_jwt_secret: !!process.env.JWT_SECRET,
            has_gemini_key: !!process.env.GEMINI_API_KEY,
        },
        database: {
            status: 'Pending',
            message: '',
            latency: 0
        }
    };

    const start = Date.now();
    try {
        // Teste leve: Apenas conta 1 linha ou verifica conexão
        const { data, error, count } = await supabase
            .from('investimentos')
            .select('*', { count: 'exact', head: true });

        report.database.latency = Date.now() - start;

        if (error) {
            report.database.status = 'Error';
            report.database.message = error.message || JSON.stringify(error);
            // Verifica mensagens comuns
            if (error.message.includes('configured')) report.database.message = 'CONFIG_MISSING: O cliente Supabase não foi iniciado (ver variáveis).';
            if (error.message.includes('apikey')) report.database.message = 'AUTH_FAIL: Chave do Supabase inválida ou expirada.';
        } else {
            report.database.status = 'Connected';
            report.database.message = `Conexão OK! (Tabela acessível, linhas: ${count !== null ? count : 'N/A'})`;
        }

    } catch (e) {
        report.database.status = 'Crash';
        report.database.message = e.message;
    }

    // Gerar e-mail HTML bonito
    const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #1a1a2e; color: #fff; padding: 2rem; }
          .card { background: #16213e; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #0f3460; }
          .ok { color: #00ff88; font-weight: bold; }
          .err { color: #ff0055; font-weight: bold; }
          h1 { color: #e94560; }
          pre { background: #000; padding: 10px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>🕵️ Relatório de Diagnóstico do Servidor</h1>
        
        <div class="card">
          <h2>1. Variáveis de Ambiente (Vercel)</h2>
          <ul>
            <li>SUPABASE_URL: ${report.environment.has_supabase_url ? '<span class="ok">✅ CONFIGURADO</span>' : '<span class="err">❌ AUSENTE</span>'}</li>
            <li>SUPABASE_KEY: ${report.environment.has_supabase_key ? '<span class="ok">✅ CONFIGURADO</span>' : '<span class="err">❌ AUSENTE</span>'}</li>
            <li>JWT_SECRET: ${report.environment.has_jwt_secret ? '<span class="ok">✅ CONFIGURADO</span>' : '<span class="err">❌ AUSENTE</span>'}</li>
            <li>GEMINI_API_KEY: ${report.environment.has_gemini_key ? '<span class="ok">✅ CONFIGURADO</span>' : '<span class="err">❌ AUSENTE</span>'}</li>
          </ul>
          <p><small>Se estiverem ausentes, adicione em Project Settings > Environment Variables no Vercel.</small></p>
        </div>

        <div class="card">
          <h2>2. Teste de Conexão com Banco de Dados</h2>
          <p>Status: ${report.database.status === 'Connected' ? '<span class="ok">CONECTADO 🟢</span>' : '<span class="err">FALHA 🔴</span>'}</p>
          <p>Mensagem: <br><code>${report.database.message}</code></p>
          <p>Latência: ${report.database.latency}ms</p>
        </div>

        <div class="card">
          <h2>JSON Completo</h2>
          <pre>${JSON.stringify(report, null, 2)}</pre>
        </div>
      </body>
    </html>
    `;

    res.send(html);
});

export default router;
