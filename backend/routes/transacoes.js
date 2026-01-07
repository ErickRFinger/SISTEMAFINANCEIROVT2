import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import TransacaoService from '../services/transacoes.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * GET /
 * Listar transações
 */
// GET /
router.get('/', async (req, res) => {
  try {
    const transacoes = await TransacaoService.list(req.user.userId, req.query);
    res.json(transacoes);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const transacao = await TransacaoService.getById(req.params.id, req.user.userId);

    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json(transacao);
  } catch (error) {
    console.error('Erro ao obter transação:', error);
    res.status(500).json({ error: 'Erro ao obter transação' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { descricao, valor, tipo, data, status, categoria_id, banco_id, cartao_id, contexto, is_recorrente, data_vencimento } = req.body;

    // 1. Sanitização Local (Simplificada e Direta)
    const safeFloat = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const safeId = (v) => (v === 'undefined' || v === '' || v == null) ? null : v;

    const payload = {
      user_id: req.user.userId,
      descricao: descricao || 'Nova Transação',
      valor: safeFloat(valor),
      tipo: tipo || 'despesa',
      data: data || new Date().toISOString(),
      status: status || 'pago',
      categoria_id: safeId(categoria_id),
      banco_id: safeId(banco_id),
      cartao_id: safeId(cartao_id),
      is_recorrente: is_recorrente || false,
      data_vencimento: data_vencimento || data || new Date().toISOString(),
      contexto: contexto || 'pessoal' // Tenta enviar contexto
    };

    // 2. Insert Direto (Tentativa Principal)
    const { data: newTx, error } = await supabase
      .from('transacoes')
      .insert([payload])
      .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
      .single();

    if (error) {
      console.warn('⚠️ [ROTA] Erro ao inserir com contexto. Tentando fallback...', error.message);

      // 3. Fallback (Sem Contexto)
      delete payload.contexto;

      const { data: legacyTx, error: legacyError } = await supabase
        .from('transacoes')
        .insert([payload])
        .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
        .single();

      if (legacyError) {
        console.error('❌ [ROTA FATAL] Erro no fallback:', legacyError);
        throw legacyError;
      }

      // Atualiza saldo (Se der certo)
      if (payload.banco_id) {
        await TransacaoService._updateBankBalance(req.user.userId, payload.banco_id, payload.valor, payload.tipo, 'add');
      }
      return res.status(201).json(legacyTx);
    }

    // Sucesso Principal
    if (payload.banco_id) {
      await TransacaoService._updateBankBalance(req.user.userId, payload.banco_id, payload.valor, payload.tipo, 'add');
    }
    return res.status(201).json(newTx);

  } catch (error) {
    console.error('Erro CRITICO ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação. Verifique os dados.' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const transacaoAtualizada = await TransacaoService.update(
      req.params.id,
      req.user.userId,
      req.body
    );

    res.json(transacaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    if (error.message && (error.message.includes('inválid') || error.message.includes('pertence'))) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    await TransacaoService.delete(req.params.id, req.user.userId);
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// GET /resumo/saldo
router.get('/resumo/saldo', async (req, res) => {
  try {
    const resumo = await TransacaoService.getBalance(req.user.userId, req.query);
    res.json(resumo);
  } catch (error) {
    console.error('Erro ao calcular resumo:', error);
    res.status(500).json({ error: 'Erro ao calcular resumo' });
  }
});

// GET /resumo/receber
router.get('/resumo/receber', async (req, res) => {
  try {
    const result = await TransacaoService.getReceivables(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar a receber:', error);
    res.status(500).json({ error: 'Erro ao buscar contas a receber' });
  }
});

// GET /projecao
router.get('/projecao', async (req, res) => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias) : 30;
    // Pass context if present
    const contexto = req.query.contexto;
    const result = await TransacaoService.getProjection(req.user.userId, dias, contexto);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar projeção:', error);
    res.status(500).json({ error: 'Erro ao gerar projeção' });
  }
});

export default router;
