import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Obter perfil do usuário
router.get('/', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nome, email, ganho_fixo_mensal, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
});

// Atualizar ganho fixo mensal
router.put('/ganho-fixo', [
  body('ganho_fixo_mensal').isFloat({ min: 0 }).withMessage('Ganho fixo deve ser maior ou igual a zero')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const { ganho_fixo_mensal } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ ganho_fixo_mensal: parseFloat(ganho_fixo_mensal) || 0 })
      .eq('id', req.user.userId)
      .select('id, nome, email, ganho_fixo_mensal')
      .single();

    if (error) {
      console.error('Erro ao atualizar ganho fixo:', error);
      return res.status(500).json({ error: 'Erro ao atualizar ganho fixo' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar ganho fixo:', error);
    res.status(500).json({ error: 'Erro ao atualizar ganho fixo' });
  }
});

// Atualizar nome
router.put('/nome', [
  body('nome').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const { nome } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ nome: nome.trim() })
      .eq('id', req.user.userId)
      .select('id, nome, email')
      .single();

    if (error) {
      console.error('Erro ao atualizar nome:', error);
      return res.status(500).json({ error: 'Erro ao atualizar nome' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar nome:', error);
    res.status(500).json({ error: 'Erro ao atualizar nome' });
  }
});

export default router;

