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

// Processar nota fiscal/comprovante
router.post('/processar', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imagePath = req.file.path;
    let resultado = null;

    try {
      // Processar OCR com Gemini AI
      resultado = await processReceiptWithGemini(imagePath);

      // Se encontrou valor, criar transação automaticamente
      if (resultado.valor && resultado.valor > 0) {
        // Tentar encontrar categoria sugerida ou usar padrão
        let categoriaId = null;

        if (resultado.categoria_sugerida) {
          const { data: catSugerida } = await supabase
            .from('categorias')
            .select('id')
            .eq('user_id', req.user.userId)
            .ilike('nome', `%${resultado.categoria_sugerida}%`) // Busca aproximada
            .limit(1);

          if (catSugerida && catSugerida.length > 0) {
            categoriaId = catSugerida[0].id;
          }
        }

        // Se não achou pela sugestão, tenta pelo tipo
        if (!categoriaId) {
          const { data: categorias } = await supabase
            .from('categorias')
            .select('id')
            .eq('user_id', req.user.userId)
            .eq('tipo', resultado.tipo)
            .limit(1);

          categoriaId = categorias && categorias.length > 0 ? categorias[0].id : null;
        }

        // Criar transação
        const { data: transacao, error: transacaoError } = await supabase
          .from('transacoes')
          .insert([{
            user_id: req.user.userId,
            categoria_id: categoriaId,
            tipo: resultado.tipo,
            descricao: resultado.descricao,
            valor: resultado.valor,
            data: resultado.data || new Date().toISOString().split('T')[0]
          }])
          .select(`
            *,
            categorias (
              nome,
              cor
            )
          `)
          .single();

        if (transacaoError) {
          console.error('Erro ao criar transação:', transacaoError);
        } else {
          resultado.transacaoCriada = {
            id: transacao.id,
            descricao: transacao.descricao,
            valor: transacao.valor,
            tipo: transacao.tipo
          };
        }
      }

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
        mensagem: resultado.valor
          ? 'Comprovante processado com IA e transação criada!'
          : 'Imagem processada, mas não identifiquei o valor. Tente uma foto mais clara.'
      });
    } finally {
      // Limpar arquivo após processamento
      deleteFile(imagePath);
    }
  } catch (error) {
    console.error('Erro ao processar nota fiscal:', error);

    // Limpar arquivo em caso de erro
    if (req.file) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      error: 'Erro ao processar imagem',
      detalhes: error.message
    });
  }
});

// Apenas processar sem criar transação (para revisão)
router.post('/processar-preview', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imagePath = req.file.path;

    try {
      const resultado = await processReceiptWithGemini(imagePath);

      res.json({
        success: true,
        resultado: {
          texto: resultado.texto,
          valor: resultado.valor,
          descricao: resultado.descricao,
          tipo: resultado.tipo,
          confianca: resultado.confianca,
          data: resultado.data
        }
      });
    } finally {
      deleteFile(imagePath);
    }
  } catch (error) {
    console.error('Erro ao processar preview:', error);

    if (req.file) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      error: 'Erro ao processar imagem',
      detalhes: error.message
    });
  }
});

export default router;

