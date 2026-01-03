
import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from '../database/db.js';

export async function generateFinancialAdvice(userId, userMessage) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        // LOG DE DEBUG (Apagar em produção)
        console.log('🔑 Check de Chave AI:');
        if (apiKey) {
            console.log(`   - Status: Presente`);
            console.log(`   - Início: ${apiKey.substring(0, 5)}...`);
            console.log(`   - Fim: ...${apiKey.substring(apiKey.length - 4)}`);
        } else {
            console.error('   - Status: AUSENTE (Isso vai causar erro)');
            return "O Cérebro está desconectado (Falta configurar a Chave de API no Backend).";
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // 1. Fetch User Context (RAG - Retrieval Augmented Generation)
        const [
            { data: perfil },
            { data: transacoes },
            { data: metas },
            { data: contas }
        ] = await Promise.all([
            supabase.from('perfil').select('*').eq('user_id', userId).single(),
            supabase.from('transacoes').select('*').eq('user_id', userId).order('data', { ascending: false }).limit(20),
            supabase.from('metas').select('*').eq('user_id', userId),
            supabase.from('bancos').select('*').eq('user_id', userId)
        ]);

        // 2. Prepare Context for AI
        const context = `
            ATUE COMO UM ASSISTENTE FINANCEIRO PESSOAL CHAMADO 'CÉREBRO'.
            
            DADOS DO USUÁRIO:
            - Nome: ${perfil?.nome || 'Usuário'}
            - Renda Mensal Fixa: R$ ${perfil?.ganho_fixo_mensal || 0}
            
            SALDO EM CONTAS:
            ${contas?.map(c => `- ${c.nome}: R$ ${c.saldo_atual}`).join('\n') || 'Nenhuma conta cadastrada'}
            
            ÚLTIMAS 20 TRANSAÇÕES:
            ${transacoes?.map(t => `- ${t.data} | ${t.descricao} | R$ ${t.valor} (${t.tipo})`).join('\n') || 'Nenhuma transação recente'}
            
            METAS DE ECONOMIA:
            ${metas?.map(m => `- ${m.titulo}: Meta R$ ${m.valor_meta} (Atual: R$ ${m.valor_atual})`).join('\n') || 'Nenhuma meta'}
            
            PERGUNTA DO USUÁRIO: "${userMessage}"
            
            DIRETRIZES:
            1. Seja direto, amigável e use emojis.
            2. Analise o saldo e as transações para dar conselhos reais.
            3. Se ele perguntar se pode gastar, veja se o saldo cobre e se não vai atrapalhar as metas.
            4. Responda em Markdown (use negrito para valores).
            5. Mantenha a resposta curta (máximo 3 parágrafos).
        `;

        // 3. Call Gemini (Updated to Flash model for speed/efficiency)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(context);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('❌ ERRO CRÍTICO NA IA:', error);

        // DEBUG MODE: Retornar o erro real para o usuário (temporário)
        const debugInfo = {
            message: error.message,
            stack: error.stack,
            env: {
                hasGeminiKey: !!process.env.GEMINI_API_KEY,
                keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
                hasSupabase: !!process.env.SUPABASE_URL
            }
        };

        return `
### 🔧 Diagnóstico de Erro
Parece que algo deu errado. Aqui estão os detalhes técnicos para me ajudar a consertar:

**Erro:** \`${debugInfo.message}\`

**Status do Sistema:**
- Tem Chave Gemini? ${debugInfo.env.hasGeminiKey ? '✅ Sim' : '❌ Não'}
- Tem Banco de Dados? ${debugInfo.env.hasSupabase ? '✅ Sim' : '❌ Não'}

_Por favor, copie essa mensagem e mande para o desenvolvedor._
        `;
    }
}
