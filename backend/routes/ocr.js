import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload, deleteFile } from '../middleware/upload.js';
import { processReceiptWithGemini } from '../services/gemini.js';
import supabase from '../database/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rota principal de processamento
router.post('/processar', upload.single('imagem'), async (req, res) => {
  // Debug Prévio de Configuração enviando 200 para evitar telas de erro do Vercel
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY faltando!');
    return res.status(200).json({
      success: false,
      error: 'CONFIGURAÇÃO INVALIDA',
      detalhes: 'A variável GEMINI_API_KEY não foi configurada no Vercel. Adicione a chave do Google AI Studio nas Settings do Projeto.'
    });
  }

  try {
    if (!req.file) return res.status(200).json({ success: false, error: 'Nenhum arquivo recebido pelo servidor.' });

    // Modificado para suportar MemoryStorage (Serverless)
    // Se req.file.buffer existe, passamos o objeto inteiro. Se path existe, passamos o path.
    const fileInput = req.file.buffer ? req.file : req.file.path;

    try {
      const resultado = await processReceiptWithGemini(fileInput);

      res.json({
        success: true,
        resultado: {
          texto: resultado.texto,
          valor: resultado.valor,
          descricao: resultado.descricao,
          tipo: resultado.tipo,
          confianca: resultado.confianca,
          data: resultado.data
        },
        transacao: resultado.transacaoCriada || null,
        mensagem: resultado.valor ? 'Sucesso!' : 'Processado sem valor.'
      });

    } catch (innerError) {
      throw innerError;
    }
  } catch (error) {
    console.error('ERRO ROTA OCR:', error);
    // Retornar 200 com detalhes do erro para o frontend exibir na caixa vermelha
    res.status(200).json({
      success: false,
      error: 'ERRO TÉCNICO',
      detalhes: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack hidden in prod'
    });
  }
});

// Apenas processar sem criar transação (para revisão)
router.post('/processar-preview', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    // Modificado para suportar MemoryStorage (Serverless)
    const fileInput = req.file.buffer ? req.file : req.file.path;

    try {
      const resultado = await processReceiptWithGemini(fileInput);

      res.json({
        success: true,
        resultado: {
          texto: resultado.texto,
          valor: resultado.valor,
          descricao: resultado.descricao,
          tipo: resultado.tipo,
          confianca: resultado.confianca,
          data: resultado.data,
          categoria_sugerida: resultado.categoria_sugerida || resultado.categoria
        }
      });
    } catch (innerError) {
      throw innerError;
    }
  } catch (error) {
    console.error('Erro ao processar preview:', error);

    res.status(500).json({
      error: 'Erro ao processar imagem',
      detalhes: error.message
    });
  }
});

export default router;
