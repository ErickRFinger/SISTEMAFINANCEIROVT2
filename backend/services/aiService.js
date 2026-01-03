
import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from '../database/db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateFinancialAdvice(userId, userMessage) {
    try {
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

        // 3. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(context);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('Erro na AI:', error);
        return "Desculpe, meu cérebro está um pouco confuso agora. Tente novamente mais tarde. 🧠💤";
    }
}
