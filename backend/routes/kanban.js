import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- COLUMNS ---

// GET /api/kanban/columns - List Columns with Cards
router.get('/columns', authenticateToken, async (req, res) => {
    try {
        // 1. Fetch Columns
        const { data: columns, error: colError } = await supabase
            .from('kanban_colunas')
            .select('*')
            .eq('user_id', req.user.userId) // Ensure we use userId
            .order('ordem', { ascending: true });

        if (colError) throw colError;

        // 2. Fetch Cards for all columns
        const { data: cards, error: cardError } = await supabase
            .from('kanban_cards')
            .select(`
        *,
        responsavel:funcionarios(nome),
        cliente:clientes(nome)
      `)
            .eq('user_id', req.user.userId);

        if (cardError) throw cardError;

        // 3. Structure data: Column -> Cards[]
        const boardData = columns.map(col => ({
            ...col,
            cards: cards.filter(c => c.coluna_id === col.id)
        }));

        res.json(boardData);
    } catch (err) {
        console.error('Erro ao buscar kanban:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// POST /api/kanban/columns - Create Default Columns (Setup)
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const defaultCols = [
            { titulo: 'A Fazer', ordem: 1, cor: '#fbbf24' },      // Yellow
            { titulo: 'Em Execução', ordem: 2, cor: '#3b82f6' },  // Blue
            { titulo: 'Bloqueado', ordem: 3, cor: '#ef4444' },    // Red
            { titulo: 'Concluído', ordem: 4, cor: '#10b981' }     // Green
        ];

        const inserts = defaultCols.map(col => ({
            ...col,
            user_id: req.user.userId
        }));

        const { data, error } = await supabase
            .from('kanban_colunas')
            .insert(inserts)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro setup kanban:', err.message);
        res.status(500).send('Erro ao configurar kanban');
    }
});

// --- CARDS ---

// POST /api/kanban/cards - Create Card
router.post('/cards', authenticateToken, async (req, res) => {
    try {
        const { coluna_id, titulo, descricao, prioridade, dificuldade, responsavel_id, cliente_id, data_limite, horas_estimadas } = req.body;

        const { data, error } = await supabase
            .from('kanban_cards')
            .insert([{
                user_id: req.user.userId,
                coluna_id,
                titulo,
                descricao,
                prioridade: prioridade || 'media',
                dificuldade,
                responsavel_id,
                cliente_id,
                data_limite,
                horas_estimadas
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro criar card:', err.message);
        res.status(500).send('Erro ao criar tarefa');
    }
});

// PUT /api/kanban/cards/:id/move - Move Card (Change Column)
router.put('/cards/:id/move', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nova_coluna_id } = req.body;

        const { data, error } = await supabase
            .from('kanban_cards')
            .update({ coluna_id: nova_coluna_id })
            .eq('id', id)
            .eq('user_id', req.user.userId) // Security check
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro mover card:', err.message);
        res.status(500).send('Erro ao mover tarefa');
    }
});

// PUT /api/kanban/cards/:id - Full Update
router.put('/cards/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao, prioridade, dificuldade, valor, data_conclusao, tipo_movimento } = req.body;

        const { data, error } = await supabase
            .from('kanban_cards')
            .update({
                titulo,
                descricao,
                prioridade,
                dificuldade,
                valor,
                data_conclusao,
                tipo_movimento
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro update card:', err.message);
        res.status(500).send('Erro ao atualizar tarefa');
    }
});

// DELETE /api/kanban/cards/:id
router.delete('/cards/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('kanban_cards')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ msg: 'Card removido' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao remover card');
    }
});

export default router;
