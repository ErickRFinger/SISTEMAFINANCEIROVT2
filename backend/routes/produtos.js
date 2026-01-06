import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/produtos (Query params: ?tipo=produto or ?tipo=servico)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { tipo } = req.query; // 'produto' | 'servico' | undefined (all)

        let query = supabase
            .from('produtos')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('nome', { ascending: true });

        if (tipo) {
            query = query.eq('tipo_item', tipo);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro ao listar produtos:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// POST /api/produtos
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            nome,
            descricao,
            preco_venda,
            preco_custo,
            quantidade_estoque,
            tipo_item,
            localizacao,
            margem_lucro
        } = req.body;

        // VALIDAÇÃO BÁSICA
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        }

        const tpItem = tipo_item || 'produto';

        if (tpItem === 'produto' && (quantidade_estoque !== undefined && quantidade_estoque < 0)) {
            return res.status(400).json({ error: 'Estoque não pode ser negativo.' });
        }

        const { data, error } = await supabase
            .from('produtos')
            .insert([{
                user_id: req.user.userId,
                nome,
                descricao,
                preco_venda: preco_venda || 0,
                preco_custo: preco_custo || 0,
                quantidade_estoque: quantidade_estoque || 0,
                tipo_item: tpItem,
                localizacao,
                margem_lucro
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('❌ [PRODUTOS] Erro fatal ao cadastrar:', err);
        // Use JSON response consistently
        res.status(500).json({ error: 'Erro ao cadastrar produto: ' + err.message });
    }
});

// PUT /api/produtos/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            descricao,
            preco_venda,
            preco_custo,
            quantidade_estoque,
            tipo_item,
            localizacao,
            margem_lucro
        } = req.body;

        // VALIDAÇÃO BÁSICA
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        }

        if (tipo_item === 'produto' && quantidade_estoque < 0) {
            return res.status(400).json({ error: 'Estoque não pode ser negativo.' });
        }

        if (preco_venda < 0 || preco_custo < 0) {
            return res.status(400).json({ error: 'Preços não podem ser negativos.' });
        }

        const { data, error } = await supabase
            .from('produtos')
            .update({
                nome,
                descricao,
                preco_venda,
                preco_custo,
                quantidade_estoque,
                tipo_item, // 'produto' or 'servico'
                localizacao,
                margem_lucro
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro ao atualizar produto:', err.message);
        res.status(500).send('Erro ao atualizar produto');
    }
});

// DELETE /api/produtos/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ msg: 'Removido com sucesso' });
    } catch (err) {
        console.error('Erro ao remover produto:', err.message);
        res.status(500).send('Erro ao remover produto');
    }
});

export default router;
