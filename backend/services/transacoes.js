import supabase from '../database/db.js';
import { formatTransaction } from '../utils/formatters.js';

class TransacaoService {
    /**
     * Lista transações com filtros
     */
    async list(userId, { mes, ano, tipo }) {
        let query = supabase
            .from('transacoes')
            .select(`
        *,
        categorias (nome, cor),
        bancos (nome, cor),
        cartoes (nome, cor)
      `)
            .eq('user_id', userId)
            .order('data', { ascending: false })
            .order('created_at', { ascending: false });

        if (mes && ano) {
            const mesNum = parseInt(mes);
            const anoNum = parseInt(ano);
            const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
            const lastDay = new Date(anoNum, mesNum, 0).getDate();
            const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            query = query.gte('data', startDate).lte('data', endDate);
        }

        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.map(formatTransaction);
    }

    /**
     * Obtém uma transação por ID
     */
    async getById(id, userId) {
        const { data, error } = await supabase
            .from('transacoes')
            .select(`
        *,
        categorias (nome, cor),
        bancos (nome, cor),
        cartoes (nome, cor)
      `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        if (!data) return null;

        return formatTransaction(data);
    }

    /**
     * Cria uma nova transação
     */
    async create(userId, transactionData) {
        const {
            categoria_id,
            banco_id,
            cartao_id,
            descricao,
            valor,
            tipo,
            data: dataTransacao
        } = transactionData;

        // 1. Validar Categoria
        if (categoria_id) {
            const { data: cat, error } = await supabase
                .from('categorias')
                .select('id')
                .eq('id', categoria_id)
                .eq('user_id', userId)
                .single();

            if (error || !cat) throw new Error('Categoria inválida ou não pertence ao usuário');
        }

        // 2. Validar Banco
        if (banco_id) {
            const { data: bco, error } = await supabase
                .from('bancos')
                .select('id')
                .eq('id', banco_id)
                .eq('user_id', userId)
                .single();

            if (error || !bco) throw new Error('Banco inválido ou não pertence ao usuário');
        }

        // 3. Validar Cartão
        if (cartao_id) {
            const { data: cart, error } = await supabase
                .from('cartoes')
                .select('id, banco_id')
                .eq('id', cartao_id)
                .eq('user_id', userId)
                .single();

            if (error || !cart) throw new Error('Cartão inválido ou não pertence ao usuário');

            // Validar relação Cartão-Banco
            if (banco_id && cart.banco_id !== parseInt(banco_id)) {
                throw new Error('Cartão não pertence ao banco selecionado');
            }
        }

        const { data: novaTransacao, error } = await supabase
            .from('transacoes')
            .insert([{
                user_id: userId,
                categoria_id: categoria_id || null,
                banco_id: banco_id || null,
                cartao_id: cartao_id || null,
                tipo,
                descricao,
                valor: parseFloat(valor),
                data: dataTransacao,
                is_recorrente: transactionData.is_recorrente || false // Fix: Added is_recorrente support
            }])
            .select(`
        *,
        categorias (nome, cor),
        bancos (nome, cor),
        cartoes (nome, cor)
      `)
            .single();

        if (error) throw error;

        return formatTransaction(novaTransacao);
    }

    /**
     * Atualiza uma transação
     */
    async update(id, userId, transactionData) {
        // Nota: Validações similares ao create poderiam ser adicionadas aqui se os IDs mudarem
        // Por enquanto, confiamos que o frontend envia IDs consistentes ou o banco rejeita FKs
        // Mas ideally, we should validade ownership again.

        const { data, error } = await supabase
            .from('transacoes')
            .update({
                descricao: transactionData.descricao,
                valor: parseFloat(transactionData.valor),
                tipo: transactionData.tipo,
                data: transactionData.data,
                categoria_id: transactionData.categoria_id || null,
                banco_id: transactionData.banco_id || null,
                cartao_id: transactionData.cartao_id || null
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select(`
        *,
        categorias (nome, cor),
        bancos (nome, cor),
        cartoes (nome, cor)
      `)
            .single();

        if (error) throw error;

        return formatTransaction(data);
    }

    /**
     * Remove uma transação
     */
    async delete(id, userId) {
        const { error } = await supabase
            .from('transacoes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    }

    /**
     * Calcula o resumo financeiro (Saldo)
     */
    async getBalance(userId, { mes, ano }) {
        let query = supabase
            .from('transacoes')
            .select('tipo, valor')
            .eq('user_id', userId);

        if (mes && ano) {
            const mesNum = parseInt(mes);
            const anoNum = parseInt(ano);
            const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
            const lastDay = new Date(anoNum, mesNum, 0).getDate();
            const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            query = query.gte('data', startDate).lte('data', endDate);
        }

        const { data: transacoes, error } = await query;

        if (error) throw error;

        const receitas = transacoes
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

        const despesas = transacoes
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

        return {
            receitas: parseFloat(receitas.toFixed(2)),
            despesas: parseFloat(despesas.toFixed(2)),
            saldo: parseFloat((receitas - despesas).toFixed(2))
        };
    }
}

export default new TransacaoService();
