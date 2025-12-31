import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

// Helper para obter userId
function getUserId(req) {
    return req.user.userId;
}

// GET / - Listar todos os investimentos
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { data, error } = await supabase
            .from('investimentos')
            .select('*')
            .eq('user_id', userId)
            .order('valor_atual', { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Erro ao listar investimentos:', error);
        res.status(500).json({ error: 'Erro ao listar investimentos' });
    }
});

// POST / - Criar novo investimento
router.post('/', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
    body('valor_investido').isFloat({ min: 0 }).withMessage('Valor investido inválido'),
    body('valor_atual').isFloat({ min: 0 }).withMessage('Valor atual inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = getUserId(req);
        const { nome, tipo, instituicao, valor_investido, valor_atual, data_aplicacao, data_vencimento, observacoes } = req.body;

        const { data, error } = await supabase
            .from('investimentos')
            .insert([{
                user_id: userId,
                nome,
                tipo,
                instituicao,
                valor_investido,
                valor_atual: valor_atual || valor_investido, // Se não passar atual, assume igual investido
                data_aplicacao: data_aplicacao || new Date(),
                data_vencimento,
                observacoes
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar investimento:', error);
        res.status(500).json({ error: 'Erro ao criar investimento' });
    }
});

// PUT /:id - Atualizar investimento
router.put('/:id', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const updates = req.body;

        // Proteger campos que não devem ser alterados via update simples se necessário
        delete updates.id;
        delete updates.user_id;
        delete updates.created_at;

        updates.updated_at = new Date();

        const { data, error } = await supabase
            .from('investimentos')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Investimento não encontrado' });

        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar investimento:', error);
        res.status(500).json({ error: 'Erro ao atualizar investimento' });
    }
});

// DELETE /:id - Remover investimento
router.delete('/:id', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('investimentos')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Investimento removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover investimento:', error);
        res.status(500).json({ error: 'Erro ao remover investimento' });
    }
});

export default router;
