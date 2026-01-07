import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import TransacaoService from '../services/transacoes.js';

const router = express.Router();

// Middleware de Autenticação Global
router.use(authenticateToken);

// GET / - Listar
router.get('/', async (req, res) => {
  try {
    const transacoes = await TransacaoService.list(req.user.userId, req.query);
    res.json(transacoes);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// GET /:id - Obter única
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

// POST / - Criar (Validado pelo Service)
router.post('/', async (req, res) => {
  try {
    const novaTransacao = await TransacaoService.create(req.user.userId, req.body);
    res.status(201).json(novaTransacao);
  } catch (error) {
    console.error('Erro CRITICO ao criar transação:', error);
    // Retorna detalhes para facilitar debug se ainda houver erro de coluna
    res.status(500).json({
      error: 'Erro ao criar transação.',
      details: error.message
    });
  }
});

// PUT /:id - Atualizar
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
    res.status(500).json({ error: 'Erro ao atualizar transação', details: error.message });
  }
});

// DELETE /:id - Remover
router.delete('/:id', async (req, res) => {
  try {
    await TransacaoService.delete(req.params.id, req.user.userId);
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// GET /resumo/saldo - Saldo Geral
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
    const result = await TransacaoService.getReceivables(req.user.userId, req.query.contexto);
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
    const result = await TransacaoService.getProjection(req.user.userId, dias, req.query.contexto);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar projeção:', error);
    res.status(500).json({ error: 'Erro ao gerar projeção' });
  }
});

export default router;
