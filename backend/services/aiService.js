
import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from '../database/db.js';

export async function generateFinancialAdvice(userId, userMessage) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        // LOG DE DEBUG (Apagar em produção)
        // console.log('🔑 Check de Chave AI:');
        if (apiKey) {
            // console.log(`   - Status: Presente`);
            // console.log(`   - Início: ${apiKey.substring(0, 5)}...`);
            // console.log(`   - Fim: ...${apiKey.substring(apiKey.length - 4)}`);
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

        // 3. TENTATIVA HÍBRIDA (SDK -> depois HTTP RAW)
        // Isso garante que se a biblioteca falhar (erro 404/versão), o fetch nativo resolve.

        try {
            console.log('🤖 Tentando via SDK (gemini-1.5-flash)...');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(context);
            const response = await result.response;
            return response.text();

        } catch (sdkError) {
            console.warn('⚠️ SDK falhou, inicializando protocolo de contingência HTTP multi-modelo...', sdkError.message);

            // LISTA DE MODELOS PARA TENTAR (Em ordem de preferência)
            const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
            let lastErrorMsg = "";

            for (const model of models) {
                try {
                    console.log(`📡 Tentando conexão direta HTTP com o modelo: ${model}...`);
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
                    });

                    if (!response.ok) {
                        const errText = await response.text(); // Pega o erro bruto
                        throw new Error(`Status ${response.status} - ${errText}`);
                    }

                    const data = await response.json();

                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        // SUCESSO! Retorna imediatamente
                        return data.candidates[0].content.parts[0].text;
                    }
                } catch (httpError) {
                    console.warn(`❌ Falha no modelo ${model}:`, httpError.message);
                    lastErrorMsg = httpError.message;
                    // Loop continua para o próximo modelo...
                }
            }

            // Se chegou aqui, todos falharam
            throw new Error(`Todos os modelos falharam. Último erro: ${lastErrorMsg}`);
        }

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
