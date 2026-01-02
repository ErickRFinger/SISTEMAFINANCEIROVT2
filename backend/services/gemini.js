import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

dotenv.config();

// Inicializar Gemini (Lazy Load)
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Função para converter arquivo para GenerativePart
// Função para converter arquivo ou buffer para GenerativePart
function fileToGenerativePart(fileData) {
    // Se for buffer (memória)
    if (fileData.buffer) {
        return {
            inlineData: {
                data: fileData.buffer.toString("base64"),
                mimeType: fileData.mimeType
            },
        };
    }
    // Se for caminho de arquivo (disco)
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(fileData.path)).toString("base64"),
            mimeType: fileData.mimeType
        },
    };
}

// ... generateContentWithRetry e getBestAvailableModel continuam iguais ...

export async function processReceiptWithGemini(fileInput) {
    // fileInput pode ser string (caminho) ou objeto (req.file do multer memory)
    // Adaptação para suportar tanto path quanto buffer
    try {
        console.log('🤖 Iniciando processamento com Gemini AI...');

        let imagePart;
        let mimeType = 'image/jpeg'; // Default

        if (typeof fileInput === 'string') {
            // Modo Legado: Caminho de arquivo
            console.log('   Modo: Arquivo em disco:', fileInput);
            if (!fs.existsSync(fileInput)) throw new Error(`Arquivo não encontrado: ${fileInput}`);

            const ext = fileInput.split('.').pop().toLowerCase();
            if (ext === 'png') mimeType = 'image/png';
            if (ext === 'webp') mimeType = 'image/webp';

            imagePart = fileToGenerativePart({ path: fileInput, mimeType });

        } else if (fileInput.buffer) {
            // Modo Vercel: Buffer em memória
            console.log('   Modo: Buffer em memória (Serverless Friendly)');
            mimeType = fileInput.mimetype || 'image/jpeg';
            imagePart = fileToGenerativePart({ buffer: fileInput.buffer, mimeType });
        } else {
            throw new Error('Input inválido para processamento Gemini (nem path nem buffer).');
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ FATAL: GEMINI_API_KEY não encontrada no process.env');
            throw new Error('CONFIGURAÇÃO: Chave GEMINI_API_KEY faltando no servidor.');
        }

        // Inicialização Lazy (Segura)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const promptPayload = `
      Você é um assistente financeiro especializado em ler comprovantes, notas fiscais e recibos bancários.
      Analise esta imagem e extraia as seguintes informações em formato JSON estrito:
      
      1. "valor": O valor total da transação (número, exemplo: 25.50).
      2. "descricao": Uma descrição curta e clara do que foi gasto ou recebido (ex: "Almoço Restaurante X", "Uber", "Salário").
      3. "tipo": "receita" se for dinheiro entrando (depósito, pix recebido, salário) ou "despesa" se for dinheiro saindo (compra, pagamento, transferência enviada).
      4. "data": A data da transação no formato YYYY-MM-DD (se não encontrar, use a data de hoje).
      5. "categoria_sugerida": Uma categoria sugerida para este gasto (ex: Alimentação, Transporte, Saúde, Moradia, Salário, Lazer, Outros).

      Se não conseguir identificar algum campo, tente inferir pelo contexto. Se a imagem não for um comprovante legível, retorne null no JSON.
      
      IMPORTANTE: Retorne APENAS o JSON puro, sem crases \`\`\`json ou texto adicional.
    `;

        // -----------------------------------------------------------
        // SOLUÇÃO DEFINITIVA: Descoberta Dinâmica de Modelo
        // -----------------------------------------------------------
        let targetModel = await getBestAvailableModel(process.env.GEMINI_API_KEY);
        let modelsToTry = [];

        if (targetModel) {
            // Se descobriu um modelo, usa ele com prioridade máxima
            modelsToTry = [targetModel];
            // Fallback para 1.5-pro se o principal falhar (nunca gemini-pro legacy)
            if (!targetModel.includes('pro')) modelsToTry.push('gemini-1.5-pro');
        } else {
            // Lista de fallback manual se a listagem falhar (SEM legacy)
            modelsToTry = [
                "gemini-1.5-flash",
                "gemini-1.5-flash-8b",
                "gemini-2.0-flash",
                "gemini-1.5-pro"
            ];
        }

        let lastError = null;
        let result = null;
        let successfulModel = '';

        // Loop de tentativa de modelos (Fallback Strategy)
        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 Tentando modelo: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                result = await generateContentWithRetry(model, [promptPayload, imagePart]);

                successfulModel = modelName;
                console.log(`✅ Sucesso confirmado com: ${modelName}`);
                break;
            } catch (error) {
                lastError = error;
                const msg = error.message || '';

                // Verificar se é Rate Limit ou erro de modelo
                const isRateLimit = msg.includes('429') || msg.includes('Quota') || msg.includes('sobrecarregado');
                const isModelError = msg.includes('404') || msg.includes('not found') || msg.includes('not supported');

                if (isModelError || isRateLimit) {
                    const reason = isRateLimit ? 'Rate Limit/Sobrecarga' : '404/Não encontrado';
                    console.warn(`⚠️ Modelo ${modelName} falhou (${reason}). Tentando próximo...`);
                    continue;
                }

                // Se for outro erro (ex: erro interno do servidor Google), tenta o próximo também
                console.warn(`⚠️ Modelo ${modelName} erro genérico: ${msg.substring(0, 100)}...`);
                continue;
            }
        }

        if (!result) {
            console.error('❌ Todos os modelos falharam.');
            throw lastError || new Error('Nenhum modelo Gemini disponível no momento.');
        }

        const response = await result.response;
        const text = response.text();

        console.log('🤖 Resposta Bruta Gemini:', text);

        // Limpar formatação markdown se houver
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanText);

        if (!data) throw new Error('Não foi possível extrair dados da imagem');

        // Normalizar retorno
        return {
            texto: 'Processado via Gemini AI (' + successfulModel + ')\n' + JSON.stringify(data, null, 2),
            valor: data.valor,
            descricao: data.descricao,
            tipo: data.tipo,
            data: data.data,
            categoria_sugerida: data.categoria_sugerida,
            confianca: 0.95
        };

    } catch (error) {
        console.error('❌ Erro no Gemini AI:', error);

        if (error.message && error.message.includes('GEMINI_API_KEY')) {
            throw new Error('Chave da API Gemini não configurada.');
        }

        throw new Error('Falha ao processar imagem: ' + error.message);
    }
}

/**
 * Tenta gerar conteúdo com retry automático para erros 429 (Too Many Requests).
 * @param {object} model - Instância do modelo Gemini.
 * @param {Array} prompt - Array com prompt e partes da imagem.
 * @param {number} maxRetries - Número máximo de tentativas (padrão 3).
 */
async function generateContentWithRetry(model, prompt, maxRetries = 3) {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error) {
            attempt++;

            // Verifica se é erro 429 (Rate Limit) ou se contém mensagem de quota
            const isRateLimit = error.message?.includes('429') ||
                error.message?.includes('Quota exceeded') ||
                error.status === 429;

            if (isRateLimit && attempt < maxRetries) {
                // Tentar extrair o tempo de espera da mensagem de erro (Google envia ex: "Please retry in 57.29s")
                let waitTime = 2000 * Math.pow(2, attempt); // Backoff exponencial padrão: 4s, 8s, 16s...

                const match = error.message?.match(/Please retry in ([\d\.]+)s/);
                if (match && match[1]) {
                    // Adiciona um pequeno buffer de 1s para garantir
                    waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
                }

                // Se o tempo de espera for muito longo (> 5 segundos), sugerimos abortar este modelo e tentar outro
                // Isso é fundamental para a estratégia de "fail fast" do loop principal
                if (waitTime > 5000) {
                    console.warn(`⚠️ [Gemini] Tempo de espera sugerido (${waitTime}ms) é muito longo. Abortando retry neste modelo.`);
                    throw new Error(`O sistema está sobrecarregado (Rate Limit). Abortando para tentar outro modelo.`);
                }

                console.warn(`⚠️ [Gemini] Rate limit atingido (Tentativa ${attempt}/${maxRetries}). Aguardando ${waitTime}ms para tentar novamente...`);

                await setTimeout(waitTime);
                continue;
            }

            // Se não for erro de rate limit ou acabaram as tentativas, lança o erro original
            throw error;
        }
    }
}

// Função para descobrir qual modelo está disponível na conta do usuário (DEFINITIVA)
async function getBestAvailableModel(apiKey) {
    try {
        console.log('🔍 Consultando API do Google para descobrir modelos disponíveis...');
        // Usar fetch nativo do Node 18+
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`⚠️ Falha ao listar modelos via API: ${response.status} ${response.statusText}`);
            // Se falhar a listagem, retorna null para usar fallback hardcoded
            return null;
        }

        const data = await response.json();
        const models = data.models || [];

        // Filtrar apenas modelos que geram conteúdo
        const availableModels = models.filter(m =>
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        );

        const modelNames = availableModels.map(m => m.name.replace('models/', ''));
        console.log(`📋 Modelos encontrados: ${modelNames.join(', ')}`);

        // Estratégia de Escolha (PRIORIDADE: ESTABILIDADE > NOVIDADE):

        // 1. Prioridade ABSOLUTA: Gemini 1.5 Flash (Estável, Rápido, Comprovado)
        if (modelNames.includes('gemini-1.5-flash')) return 'gemini-1.5-flash';

        // 2. Gemini 1.5 Flash Latest (Se o fixo não estiver, tenta o latest)
        if (modelNames.includes('gemini-1.5-flash-latest')) return 'gemini-1.5-flash-latest';

        // 3. Gemini 2.0 Flash (Se tiver acesso ao novo estável)
        if (modelNames.includes('gemini-2.0-flash')) return 'gemini-2.0-flash';

        // 4. Gemini 1.5 Pro (Mais robusto, um pouco mais lento)
        if (modelNames.includes('gemini-1.5-pro')) return 'gemini-1.5-pro';

        // 5. Fallback para qualquer Flash
        const anyFlash = modelNames.find(m => m.includes('flash') && !m.includes('8b'));
        if (anyFlash) return anyFlash;

        // 6. Último recurso: o primeiro da lista
        if (modelNames.length > 0) return modelNames[0];

        return null;

    } catch (error) {
        console.error('⚠️ Falha na descoberta dinâmica:', error);
        return null;
    }
}


