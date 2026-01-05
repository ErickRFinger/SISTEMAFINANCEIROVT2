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
     * Atualiza o saldo do banco
     * @private
     */
    async _updateBankBalance(userId, bancoId, valor, tipo, operation = 'add') {
        if (!bancoId) return;

        try {
            // Buscar saldo atual
            const { data: banco, error: getError } = await supabase
                .from('bancos')
                .select('saldo_atual')
                .eq('id', bancoId)
                .eq('user_id', userId)
                .single();

            if (getError) throw getError;
            if (!banco) return; // Banco não encontrado

            let novoSaldo = Number(banco.saldo_atual);
            const valorNum = Number(valor);

            // Se operation for 'remove', invertemos a lógica (para desfazer transação)
            const multiplier = operation === 'add' ? 1 : -1;

            if (tipo === 'receita') {
                novoSaldo += (valorNum * multiplier);
            } else if (tipo === 'despesa') {
                novoSaldo -= (valorNum * multiplier);
            }

            // Atualizar saldo
            await supabase
                .from('bancos')
                .update({ saldo_atual: novoSaldo })
                .eq('id', bancoId)
                .eq('user_id', userId);

        } catch (error) {
            console.error('Erro ao atualizar saldo do banco:', error);
            // Não bloqueamos o fluxo principal, mas logamos o erro
        }
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
                is_recorrente: transactionData.is_recorrente || false
            }])
            .select(`
        *,
        categorias (nome, cor),
        bancos (nome, cor),
        cartoes (nome, cor)
      `)
            .single();

        if (error) throw error;

        // Atualizar saldo do banco
        if (banco_id) {
            await this._updateBankBalance(userId, banco_id, valor, tipo, 'add');
        }

        return formatTransaction(novaTransacao);
    }

    /**
     * Atualiza uma transação
     */
    async update(id, userId, transactionData) {
        // 1. Buscar transação antiga para reverter saldo
        const transacaoAntiga = await this.getById(id, userId);
        if (!transacaoAntiga) throw new Error('Transação não encontrada');

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

        // Lógica de atualização de saldo:
        // 1. Reverter efeito da antiga (se tinha banco)
        if (transacaoAntiga.banco_id) {
            await this._updateBankBalance(userId, transacaoAntiga.banco_id, transacaoAntiga.valor, transacaoAntiga.tipo, 'remove');
        }

        // 2. Aplicar efeito da nova (se tem banco)
        if (transactionData.banco_id) {
            await this._updateBankBalance(userId, transactionData.banco_id, transactionData.valor, transactionData.tipo, 'add');
        }

        return formatTransaction(data);
    }

    /**
     * Remove uma transação
     */
    async delete(id, userId) {
        // 1. Buscar transação para reverter saldo antes de deletar
        const transacao = await this.getById(id, userId);

        const { error } = await supabase
            .from('transacoes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // Reverter saldo se a transação existia e tinha banco
        if (transacao && transacao.banco_id) {
            await this._updateBankBalance(userId, transacao.banco_id, transacao.valor, transacao.tipo, 'remove');
        }

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
