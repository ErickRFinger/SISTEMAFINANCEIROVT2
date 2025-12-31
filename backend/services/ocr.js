import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Processar imagem para melhorar OCR
async function processImage(imagePath) {
  try {
    // Dynamic import for sharp
    const { default: sharp } = await import('sharp');

    const processedPath = path.join(path.dirname(imagePath), 'processed-' + path.basename(imagePath));

    await sharp(imagePath)
      .greyscale()
      .normalize()
      .sharpen()
      .toFile(processedPath);

    return processedPath;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    return imagePath; // Retorna original se falhar
  }
}

// Extrair valor monetário do texto
function extractValue(text) {
  // Padrões comuns para valores em português brasileiro
  const patterns = [
    /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*R\$/gi,
    /total[:\s]*R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi,
    /valor[:\s]*R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g
  ];

  let maxValue = 0;

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let valueStr = match[1] || match[0];
      // Remover pontos e substituir vírgula por ponto
      valueStr = valueStr.replace(/\./g, '').replace(',', '.');
      const value = parseFloat(valueStr);

      if (value > maxValue && value < 1000000) { // Limite razoável
        maxValue = value;
      }
    }
  }

  return maxValue > 0 ? maxValue : null;
}

// Extrair descrição/produto do texto
function extractDescription(text) {
  // Remover valores monetários
  let desc = text.replace(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/gi, '');
  desc = desc.replace(/\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, '');

  // Procurar por palavras-chave comuns
  const keywords = [
    'compra', 'pagamento', 'nota fiscal', 'cupom fiscal',
    'produto', 'item', 'servico', 'serviço', 'mercado', 'supermercado',
    'restaurante', 'combustivel', 'combustível', 'farmacia', 'farmácia'
  ];

  // Extrair linhas que contenham palavras-chave
  const lines = desc.split('\n').filter(line => {
    const lowerLine = line.toLowerCase().trim();
    return lowerLine.length > 5 &&
      (keywords.some(kw => lowerLine.includes(kw)) ||
        lowerLine.length > 10);
  });

  // Pegar as primeiras linhas relevantes
  const relevantLines = lines.slice(0, 3).join(' ').trim();

  if (relevantLines.length > 0) {
    return relevantLines.substring(0, 100); // Limitar a 100 caracteres
  }

  // Se não encontrar, retornar primeiras palavras do texto
  const words = text.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
  return words.join(' ') || 'Compra identificada';
}

// Detectar tipo (receita ou despesa)
function detectType(text) {
  const lowerText = text.toLowerCase();

  // Palavras que indicam receita
  const receitaKeywords = ['deposito', 'depósito', 'transferencia', 'transferência', 'recebido', 'pagamento recebido'];

  // Por padrão, notas fiscais são despesas
  if (receitaKeywords.some(kw => lowerText.includes(kw))) {
    return 'receita';
  }

  return 'despesa';
}

// Função principal de OCR
export async function processReceipt(imagePath) {
  try {
    console.log('Processando imagem:', imagePath);

    // Processar imagem para melhorar OCR
    const processedPath = await processImage(imagePath);

    // Executar OCR
    console.log('Executando OCR...');

    // Dynamic import for Tesseract
    const { default: Tesseract } = await import('tesseract.js');

    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      'por', // Português
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Progresso: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('Texto extraído:', text.substring(0, 200));

    // Limpar arquivo processado
    if (processedPath !== imagePath) {
      try {
        fs.unlinkSync(processedPath);
      } catch (e) {
        console.error('Erro ao deletar arquivo processado:', e);
      }
    }

    // Extrair informações
    const valor = extractValue(text);
    const descricao = extractDescription(text);
    const tipo = detectType(text);

    return {
      texto: text,
      valor: valor,
      descricao: descricao || 'Compra identificada',
      tipo: tipo,
      confianca: valor ? 0.8 : 0.5 // Confiança baseada em se encontrou valor
    };
  } catch (error) {
    console.error('Erro no OCR:', error);
    throw new Error('Erro ao processar imagem: ' + error.message);
  }
}

