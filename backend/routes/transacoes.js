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
router.post('/', [
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('tipo').isIn(['receita', 'despesa']).withMessage('Tipo deve ser receita ou despesa'),
  body('data').notEmpty().withMessage('Data é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const novaTransacao = await TransacaoService.create(req.user.userId, req.body);
    res.status(201).json(novaTransacao);

  } catch (error) {
    console.error('Erro ao criar transação:', error);
    if (error.message && (error.message.includes('inválid') || error.message.includes('pertence'))) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// PUT /:id
router.put('/:id', [
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('tipo').isIn(['receita', 'despesa']).withMessage('Tipo deve ser receita ou despesa'),
  body('data').notEmpty().withMessage('Data é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
