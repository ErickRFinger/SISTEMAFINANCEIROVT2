
import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from '../database/db.js';

export async function generateFinancialAdvice(userId, userMessage) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('⚠️ GEMINI_API_KEY não configurada no backend.');
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
        console.error('❌ ERRO DETALHADO NA IA:', error);

        // Log environment status for debugging
        console.log('🔍 Status do Ambiente:', {
            hasKey: !!process.env.GEMINI_API_KEY,
            keyLength: process.env.GEMINI_API_KEY?.length
        });

        if (error.message?.includes('API key')) {
            return "Parece que há um problema com a Chave da API. Verifique a configuração no painel.";
        }

        return "Desculpe, tive um erro técnico ao processar seu pedido. Tente novamente em alguns instantes. 🧠🔧";
    }
}
