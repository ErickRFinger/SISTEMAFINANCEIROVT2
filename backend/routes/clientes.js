import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/clientes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('nome', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro clientes:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// POST /api/clientes
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nome, email, telefone, tipo_pessoa, documento, endereco } = req.body;

        const { data, error } = await supabase
            .from('clientes')
            .insert([{
                user_id: req.user.userId,
                nome,
                email,
                telefone,
                tipo_pessoa: tipo_pessoa || 'PF',
                documento,
                endereco
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro criar cliente:', err.message);
        res.status(500).send('Erro ao cadastrar cliente');
    }
});

// PUT /api/clientes/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, tipo_pessoa, documento, endereco } = req.body;

        const { data, error } = await supabase
            .from('clientes')
            .update({
                nome, email, telefone, tipo_pessoa, documento, endereco
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro atualizar cliente:', err.message);
        res.status(500).send('Erro ao atualizar cliente');
    }
});

// DELETE /api/clientes/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ msg: 'Cliente removido' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao remover cliente');
    }
});

export default router;
