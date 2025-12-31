import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Função para converter arquivo para GenerativePart
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

export async function processReceiptWithGemini(imagePath) {
    try {
        console.log('🤖 Iniciando processamento com Gemini AI...');
        console.log('   Imagem:', imagePath);

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ FATAL: GEMINI_API_KEY não encontrada no process.env');
            throw new Error('CONFIGURAÇÃO: Chave GEMINI_API_KEY faltando no servidor.');
        }

        // Verificar se arquivo existe
        if (!fs.existsSync(imagePath)) {
            console.error(`❌ Erro: Arquivo não encontrado no caminho: ${imagePath}`);
            throw new Error('Arquivo de imagem se perdeu no upload (fs.existsSync falhou).');
        }

        // Determinar mimetype com base na extensão
        const ext = imagePath.split('.').pop().toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        if (ext === 'webp') mimeType = 'image/webp';
        if (ext === 'heic') mimeType = 'image/heic';
        if (ext === 'heif') mimeType = 'image/heif';

        const imagePart = fileToGenerativePart(imagePath, mimeType);

        const prompt = `
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

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log('🤖 Resposta Bruta Gemini:', text);

        // Limpar formatação markdown se houver
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanText);

        if (!data) {
            throw new Error('Não foi possível extrair dados da imagem');
        }

        // Normalizar retorno para bater com o esperado pelo frontend
        return {
            texto: 'Processado via Gemini AI\n' + JSON.stringify(data, null, 2),
            valor: data.valor,
            descricao: data.descricao,
            tipo: data.tipo,
            data: data.data,
            categoria_sugerida: data.categoria_sugerida,
            confianca: 0.95 // Gemini costuma ser muito preciso
        };

    } catch (error) {
        console.error('❌ Erro no Gemini AI:', error);
        // Fallback ou erro explícito
        if (error.message.includes('GEMINI_API_KEY')) {
            throw new Error('Chave da API Gemini não configurada. Configure GEMINI_API_KEY no .env do backend.');
        }
        throw new Error('Falha ao processar imagem com IA: ' + error.message);
    }
}
