
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
            console.warn('⚠️ SDK falhou. Iniciando Protocolo de Auto-Descoberta de Modelos...', sdkError.message);

            // PASSO 1: Descobrir quais modelos essa chave PODE acessar
            // Isso pergunta ao Google: "O que eu posso usar?" em vez de adivinhar.
            let availableModels = [];
            try {
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listResp = await fetch(listUrl);

                if (listResp.ok) {
                    const listData = await listResp.json();
                    if (listData.models) {
                        // Filtramos apenas modelos que servem para gerar texto (generateContent)
                        availableModels = listData.models
                            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                            .map(m => m.name); // Ex: "models/gemini-1.5-flash"

                        // Ordenar para tentar os pro/flash primeiro (lógica simples)
                        availableModels.sort((a, b) => {
                            if (a.includes('flash')) return -1;
                            if (b.includes('flash')) return 1;
                            return 0;
                        });

                        console.log("✅ Modelos descobertos para esta chave:", availableModels);
                    }
                }
            } catch (listErr) {
                console.warn("⚠️ Falha ao listar modelos:", listErr.message);
            }

            // Fallback se a lista falhar: Tenta os conhecidos (com o prefixo correto)
            if (availableModels.length === 0) {
                availableModels = ["models/gemini-1.5-flash", "models/gemini-pro", "models/gemini-1.0-pro"];
            }

            // PASSO 2: Tentar cada modelo da lista
            let lastErrorMsg = "";

            for (const model of availableModels) {
                try {
                    // O modelo já vem como "models/nome-do-modelo", então a URL fica limpa:
                    // https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
                    // OU se a url base já tem models/, ajustamos.

                    // Ajuste seguro da URL
                    const modelId = model.startsWith('models/') ? model.split('/')[1] : model;
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        // Se for 404, tenta o próximo. Se for outro erro, loga.
                        throw new Error(`Status ${response.status} - ${errText}`);
                    }

                    const data = await response.json();

                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        // SUCESSO! 
                        return data.candidates[0].content.parts[0].text;
                    }
                } catch (httpError) {
                    lastErrorMsg = httpError.message;
                    // Continua tentando os outros...
                }
            }

            throw new Error(`Falha total. Modelos tentados: ${availableModels.length}. Último erro: ${lastErrorMsg}`);
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
