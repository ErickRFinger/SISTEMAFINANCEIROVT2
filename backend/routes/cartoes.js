import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

function getUserId(req) {
    if (!req.user || !req.user.userId) {
        throw new Error('Usuário não autenticado');
    }
    const userId = parseInt(req.user.userId);
    if (isNaN(userId)) {
        throw new Error(`ID de usuário inválido: ${req.user.userId}`);
    }
    return userId;
}

router.use(authenticateToken);

// Listar todos os cartões (de todos os bancos)
router.get('/', async (req, res, next) => {
    try {
        const userId = getUserId(req);

        // Buscar cartões com JOIN no banco para ter o nome do banco
        const { data: cartoes, error } = await supabase
            .from('cartoes')
            .select(`
        *,
        banco:bancos(id, nome, cor)
      `)
            .eq('user_id', userId)
            .order('nome', { ascending: true });

        if (error) {
            // Se tiver erro de relação (banco não existe etc), tenta buscar simples
            if (error.code === 'PGRST200') { // Exemplo de erro de embedding
                const { data: cartoesSimples, error: errorSimples } = await supabase
                    .from('cartoes')
                    .select('*')
                    .eq('user_id', userId)
                    .order('nome', { ascending: true });

                if (errorSimples) throw errorSimples;

                return res.json(cartoesSimples || []);
            }
            throw error;
        }

        // Formatar resposta para incluir nome do banco no objeto principal se facilitar
        const cartoesFormatados = cartoes.map(cartao => ({
            ...cartao,
            banco_nome: cartao.banco?.nome,
            banco_cor: cartao.banco?.cor
        }));

        res.json(cartoesFormatados || []);
    } catch (error) {
        console.error('Erro ao listar todos os cartões:', error);
        next(error);
    }
});

export default router;
