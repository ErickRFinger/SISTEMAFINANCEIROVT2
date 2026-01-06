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
        // Frontend envia 'tipo', mas banco usa 'tipo_pessoa'
        const { nome, email, telefone, tipo, tipo_pessoa, documento, endereco } = req.body;

        // Frontend envia 'tipo' (pessoa_fisica/juridica). Banco tem colunas 'tipo' e 'tipo_pessoa'.
        // Vamos preencher ambas para garantir compatibilidade.
        const valorTipo = tipo || tipo_pessoa || 'pessoa_fisica';
        const valorTipoPessoa = valorTipo === 'pessoa_fisica' ? 'PF' : 'PJ';

        const { data, error } = await supabase
            .from('clientes')
            .insert([{
                user_id: req.user.userId,
                nome,
                email,
                telefone,
                tipo: valorTipo,         // IMPORTANTE: Frontend lê essa coluna
                tipo_pessoa: valorTipo,  // Agora cabe (VARCHAR 50)
                documento,
                endereco
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro criar cliente:', err.message);
        res.status(500).json({ error: 'Erro ao cadastrar cliente: ' + err.message });
    }
});

// PUT /api/clientes/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, tipo, tipo_pessoa, documento, endereco } = req.body;

        const valorTipo = tipo || tipo_pessoa;

        const updateData = {
            nome, email, telefone, documento, endereco
        };

        if (valorTipo) {
            updateData.tipo = valorTipo;
            updateData.tipo_pessoa = valorTipo;
        }

        const { data, error } = await supabase
            .from('clientes')
            .update(updateData)
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
