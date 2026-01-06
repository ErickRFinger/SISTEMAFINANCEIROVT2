import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/funcionarios
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('funcionarios')
            .select('*')
            .eq('user_id', req.user.userId) // req.user.userId based on auth.js
            .order('nome', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro ao listar funcionarios:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// POST
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nome, cargo, salario, data_admissao, telefone, email, status } = req.body;

        // Check if user_id type in DB is compatible.
        // auth.js says user.userId.
        // If user.userId is UUID in JWT but DB expects BigInt?
        // Wait, the DB "users.id" IS BigInt (or Serial).
        // The "auth.login" MUST have put the ID in the token.
        // If the token contains the numeric ID, we are fine.

        const { data, error } = await supabase
            .from('funcionarios')
            .insert([{
                user_id: req.user.userId,
                nome,
                cargo,
                salario: salario || 0,
                data_admissao: data_admissao || new Date(),
                telefone,
                email,
                status: status || 'ativo'
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro ao cadastrar func:', err.message);
        res.status(500).json({ error: 'Erro ao cadastrar funcionário: ' + err.message });
    }
});

// PUT
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cargo, salario, data_admissao, telefone, email, status } = req.body;

        const { data, error } = await supabase
            .from('funcionarios')
            .update({ nome, cargo, salario, data_admissao, telefone, email, status })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar');
    }
});

// DELETE
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('funcionarios')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ msg: 'Removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao remover');
    }
});

export default router;
