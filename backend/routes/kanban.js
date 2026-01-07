import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- HELPERS ---

// Ultimate Sanitizer Helper
const safeInt = (val, defaultVal = null) => {
    if (val === undefined || val === null) return defaultVal;
    if (typeof val === 'string') {
        if (val.trim() === '' || val === 'undefined' || val === 'null') return defaultVal;
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultVal : parsed;
};

const safeFloat = (val, defaultVal = 0) => {
    if (val === undefined || val === null) return defaultVal;
    if (typeof val === 'string') {
        if (val.trim() === '' || val === 'undefined' || val === 'null') return defaultVal;
    }
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

// --- COLUMNS ---

// GET /api/kanban/columns - List Columns with Cards
router.get('/columns', authenticateToken, async (req, res) => {
    try {
        // 1. Fetch Columns
        const { data: columns, error: colError } = await supabase
            .from('kanban_colunas')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('ordem', { ascending: true });

        if (colError) throw colError;

        // 2. Fetch Cards
        const { data: cards, error: cardError } = await supabase
            .from('kanban_cards')
            .select(`*, responsavel:funcionarios(nome), cliente:clientes(nome)`)
            .eq('user_id', req.user.userId)
            .order('posicao', { ascending: true });

        if (cardError) throw cardError;

        // 3. Structure data
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

// POST /api/kanban/columns - Create Column
router.post('/columns', authenticateToken, async (req, res) => {
    try {
        const { titulo, cor } = req.body;
        const { data: maxCol } = await supabase
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

// DELETE /api/kanban/columns/:id
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

// POST /api/kanban/setup - Setup
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const defaultCols = [
            { titulo: 'A Fazer', ordem: 1, cor: '#fbbf24' },
            { titulo: 'Em Execução', ordem: 2, cor: '#3b82f6' },
            { titulo: 'Bloqueado', ordem: 3, cor: '#ef4444' },
            { titulo: 'Concluído', ordem: 4, cor: '#10b981' }
        ];
        const inserts = defaultCols.map(col => ({ ...col, user_id: req.user.userId }));
        const { data, error } = await supabase.from('kanban_colunas').insert(inserts).select();
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
        console.log('➡️ [KANBAN CREATE] Iniciando...');
        console.log('📦 [PAYLOAD RAW]:', JSON.stringify(req.body));

        const { coluna_id, titulo, descricao, prioridade, dificuldade, responsavel_id, cliente_id, data_limite, horas_estimadas, valor, tipo_movimento } = req.body;

        let finalColunaId = safeInt(coluna_id);

        // FAILSAFE: Se não tem coluna, busca a primeira do usuário
        if (!finalColunaId) {
            console.log('⚠️ [KANBAN] Coluna ID inválido. Buscando padrão...');
            const { data: cols } = await supabase.from('kanban_colunas').select('id').eq('user_id', req.user.userId).order('ordem').limit(1);
            if (cols && cols.length > 0) {
                finalColunaId = cols[0].id;
            } else {
                throw new Error('Nenhuma coluna disponível para criar o card.');
            }
        }

        const payload = {
            user_id: req.user.userId,
            coluna_id: finalColunaId,
            titulo,
            descricao,
            prioridade: prioridade || 'media',
            dificuldade,
            responsavel_id: safeInt(responsavel_id),
            cliente_id: safeInt(cliente_id),
            data_limite: (data_limite && data_limite !== 'undefined') ? data_limite : null,
            horas_estimadas: safeFloat(horas_estimadas),
            valor: safeFloat(valor),
            tipo_movimento: tipo_movimento || 'saida'
        };

        console.log('🛡️ [PAYLOAD CLEANED]:', JSON.stringify(payload));

        const { data, error } = await supabase.from('kanban_cards').insert([payload]).select();

        if (error) {
            console.error('❌ [KANBAN DB ERROR]:', error);
            throw error;
        }
        res.json(data[0]);
    } catch (err) {
        console.error('❌ [KANBAN SERVER ERROR]:', err.message);
        res.status(500).send('Erro ao criar tarefa. Verifique o console.');
    }
});

// PUT /api/kanban/cards/:id/move - Move Card
router.put('/cards/:id/move', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nova_coluna_id, nova_posicao } = req.body;

        const { data: currentCard } = await supabase.from('kanban_cards').select('coluna_id').eq('id', id).single();
        if (!currentCard) throw new Error('Card não encontrado');

        // SANITIZATION FIX:
        const nColId = safeInt(nova_coluna_id);
        const nPos = safeInt(nova_posicao, 0);

        const newColumnId = nColId !== null ? nColId : currentCard.coluna_id;
        const newPos = nPos;

        const { data, error } = await supabase
            .from('kanban_cards')
            .update({ coluna_id: newColumnId, posicao: newPos })
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

// PUT /api/kanban/cards/:id - update
router.put('/cards/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao, prioridade, dificuldade, valor, data_conclusao, tipo_movimento, responsavel_id, cliente_id, horas_estimadas } = req.body;

        const updatePayload = {
            titulo,
            descricao,
            prioridade,
            dificuldade,
            valor: safeFloat(valor),
            data_conclusao: (data_conclusao && data_conclusao !== 'undefined') ? data_conclusao : null,
            tipo_movimento,
            responsavel_id: safeInt(responsavel_id),
            cliente_id: safeInt(cliente_id),
            horas_estimadas: safeFloat(horas_estimadas)
        };

        const { data, error } = await supabase
            .from('kanban_cards')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select();

        if (error) throw error;
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
