import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- COLUMNS ---

// GET /api/kanban/columns - List Columns with Cards
router.get('/columns', authenticateToken, async (req, res) => {
    try {
        console.log(`[KANBAN] Buscando dados para user: ${req.user.userId}`);

        // 1. Fetch Columns
        const { data: columns, error: colError } = await supabase
            .from('kanban_colunas')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('ordem', { ascending: true });

        if (colError) {
            console.error('[KANBAN] Erro colunas:', colError);
            throw colError;
        }

        // 2. Fetch Cards for all columns
        const { data: cards, error: cardError } = await supabase
            .from('kanban_cards')
            .select(`
        *,
        responsavel:funcionarios(nome),
        cliente:clientes(nome)
      `)
            .eq('user_id', req.user.userId)
            .order('posicao', { ascending: true });

        if (cardError) {
            console.error('[KANBAN] Erro cards:', cardError);
            throw cardError;
        }

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

// POST /api/kanban/columns - Custom Create Column
router.post('/columns', authenticateToken, async (req, res) => {
    try {
        const { titulo, cor } = req.body;

        // Find max order to append
        const { data: maxCol, error: maxError } = await supabase
            .from('kanban_colunas')
            .select('ordem')
            .eq('user_id', req.user.userId)
            .order('ordem', { ascending: false })
            .limit(1);

        const nextOrder = (maxCol && maxCol.length > 0) ? maxCol[0].ordem + 1 : 1;

        const { data, error } = await supabase
            .from('kanban_colunas')
            .insert([{
                user_id: req.user.userId,
                titulo: titulo || 'Nova Coluna',
                cor: cor || '#f1f5f9',
                ordem: nextOrder
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro criar coluna:', err.message);
        res.status(500).send('Erro ao criar coluna');
    }
});

// PUT /api/kanban/columns/:id - Update Column
router.put('/columns/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, cor, ordem } = req.body;

        const updates = {};
        if (titulo !== undefined) updates.titulo = titulo;
        if (cor !== undefined) updates.cor = cor;
        if (ordem !== undefined) updates.ordem = ordem;

        const { data, error } = await supabase
            .from('kanban_colunas')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro atualizar coluna:', err.message);
        res.status(500).send('Erro ao atualizar coluna');
    }
});

// DELETE /api/kanban/columns/:id - Delete Column
router.delete('/columns/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('kanban_colunas')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ msg: 'Coluna removida' });
    } catch (err) {
        console.error('Erro remover coluna:', err.message);
        res.status(500).send('Erro ao remover coluna');
    }
});

// POST /api/kanban/setup - Create Default Columns
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const defaultCols = [
            { titulo: 'A Fazer', ordem: 1, cor: '#fbbf24' },
            { titulo: 'Em Execução', ordem: 2, cor: '#3b82f6' },
            { titulo: 'Bloqueado', ordem: 3, cor: '#ef4444' },
            { titulo: 'Concluído', ordem: 4, cor: '#10b981' }
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

// Helper to sanitize IDs and Numbers
const sanitizeId = (val) => (val && val !== 'undefined' && val !== '') ? val : null;
const sanitizeNum = (val) => (val && val !== 'undefined' && val !== '') ? parseFloat(val) : 0;

// POST /api/kanban/cards - Create Card
router.post('/cards', authenticateToken, async (req, res) => {
    try {
        const { coluna_id, titulo, descricao, prioridade, dificuldade, responsavel_id, cliente_id, data_limite, horas_estimadas, valor, tipo_movimento } = req.body;

        const { data, error } = await supabase
            .from('kanban_cards')
            .insert([{
                user_id: req.user.userId,
                coluna_id,
                titulo,
                descricao,
                prioridade: prioridade || 'media',
                dificuldade,
                responsavel_id: sanitizeId(responsavel_id),
                cliente_id: sanitizeId(cliente_id),
                data_limite: sanitizeId(data_limite), // Date string or null
                horas_estimadas: sanitizeNum(horas_estimadas),
                valor: sanitizeNum(valor), // Fix invalid syntax integer/numeric
                tipo_movimento: tipo_movimento || 'saida'
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error('Erro criar card:', err.message);
        res.status(500).send('Erro ao criar tarefa');
    }
});

// PUT /api/kanban/cards/:id/move - Move Card
router.put('/cards/:id/move', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nova_coluna_id, nova_posicao } = req.body;

        const { data: currentCard, error: fetchError } = await supabase
            .from('kanban_cards')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();

        if (fetchError || !currentCard) throw new Error('Card não encontrado ou acesso negado');

        const oldColumnId = currentCard.coluna_id;
        const newColumnId = nova_coluna_id || oldColumnId;
        const newPos = nova_posicao !== undefined ? nova_posicao : 0;

        const { data, error } = await supabase
            .from('kanban_cards')
            .update({
                coluna_id: newColumnId,
                posicao: newPos
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
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
        const { titulo, descricao, prioridade, dificuldade, valor, data_conclusao, tipo_movimento, responsavel_id, cliente_id, horas_estimadas } = req.body;

        // Construct update object to handle potential "undefined" strings
        const updatePayload = {
            titulo,
            descricao,
            prioridade,
            dificuldade,
            valor: sanitizeNum(valor),
            data_conclusao: sanitizeId(data_conclusao),
            tipo_movimento,
            responsavel_id: sanitizeId(responsavel_id),
            cliente_id: sanitizeId(cliente_id),
            horas_estimadas: sanitizeNum(horas_estimadas)
        };

        const { data, error } = await supabase
            .from('kanban_cards')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) {
            console.error('Supabase Update Error:', error);
            throw error;
        }
        res.json(data[0]);
    } catch (err) {
        console.error('Erro update card (catch):', err);
        res.status(500).json({ error: err.message || 'Erro desconhecido' });
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
