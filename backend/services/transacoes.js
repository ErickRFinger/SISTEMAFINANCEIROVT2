import supabase from '../database/db.js';
import { formatTransaction } from '../utils/formatters.js';

class TransacaoService {

    /**
     * Listar transações com filtros
     */
    /**
     * Listar transações com filtros
     */
    async list(userId, { mes, ano, tipo, status, contexto }) {
        let query = supabase
            .from('transacoes')
            .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor), cartoes(nome, cor)`)
            .eq('user_id', userId)
            .order('data', { ascending: false })
            .order('created_at', { ascending: false });

        // Filtro de Data (Mes/Ano)
        if (mes && ano) {
            const mesNum = parseInt(mes);
            const anoNum = parseInt(ano);
            const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
            const endDate = new Date(anoNum, mesNum, 0).toISOString().split('T')[0];
            query = query.gte('data', startDate).lte('data', endDate);
        }

        if (tipo) query = query.eq('tipo', tipo);
        if (status) query = query.eq('status', status);
        if (contexto) query = query.eq('contexto', contexto);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(formatTransaction);
    }

    /**
     * Criar transação (Sanitized)
     */
    async create(userId, transactionData) {
        // Helpers de Sanitização
        const safeId = (val) => (val === 'undefined' || val === '' || val == null) ? null : val;
        const safeFloat = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

        const payload = {
            user_id: userId,
            descricao: transactionData.descricao || 'Nova Transação',
            valor: safeFloat(transactionData.valor),
            tipo: transactionData.tipo || 'despesa',
            data: transactionData.data || new Date().toISOString(),
            data_vencimento: transactionData.data_vencimento || transactionData.data,
            is_recorrente: transactionData.is_recorrente || false,
            categoria_id: safeId(transactionData.categoria_id),
            banco_id: safeId(transactionData.banco_id),
            cartao_id: safeId(transactionData.cartao_id),
            // Adicionando suporte para contexto se enviado
            contexto: transactionData.contexto || 'pessoal'
        };

        const { data, error } = await supabase
            .from('transacoes')
            .insert([payload])
            .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
            .single();

        if (error) throw error;

        // Atualizar saldo do banco
        if (payload.banco_id) {
            await this._updateBankBalance(userId, payload.banco_id, payload.valor, payload.tipo, 'add');
        }

        return formatTransaction(data);
    }

    /**
     * Atualizar transação
     */
    async update(id, userId, transactionData) {
        const transacaoAntiga = await this.getById(id, userId);
        if (!transacaoAntiga) throw new Error('Transação não encontrada');

        const safeId = (val) => (val === 'undefined' || val === '' || val == null) ? null : val;
        const safeFloat = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

        const payload = {
            descricao: transactionData.descricao || transacaoAntiga.descricao,
            valor: transactionData.valor !== undefined ? safeFloat(transactionData.valor) : transacaoAntiga.valor,
            tipo: transactionData.tipo || transacaoAntiga.tipo,
            data: transactionData.data || transacaoAntiga.data,
            data_vencimento: transactionData.data_vencimento || transacaoAntiga.data_vencimento,
            categoria_id: safeId(transactionData.categoria_id),
            banco_id: safeId(transactionData.banco_id),
            cartao_id: safeId(transactionData.cartao_id),
            // Manter contexto antigo se não informado
            contexto: transactionData.contexto || transacaoAntiga.contexto
        };

        const { data, error } = await supabase
            .from('transacoes')
            .update(payload)
            .eq('id', id)
            .eq('user_id', userId)
            .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
            .single();

        if (error) throw error;

        // Reverter saldo antigo e aplicar novo
        if (transacaoAntiga.banco_id) await this._updateBankBalance(userId, transacaoAntiga.banco_id, transacaoAntiga.valor, transacaoAntiga.tipo, 'remove');
        if (payload.banco_id) await this._updateBankBalance(userId, payload.banco_id, payload.valor, payload.tipo, 'add');

        return formatTransaction(data);
    }

    async delete(id, userId) {
        const transacao = await this.getById(id, userId);
        if (!transacao) return;

        const { error } = await supabase.from('transacoes').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;

        if (transacao.banco_id) {
            await this._updateBankBalance(userId, transacao.banco_id, transacao.valor, transacao.tipo, 'remove');
        }
    }

    async getById(id, userId) {
        const { data, error } = await supabase
            .from('transacoes')
            .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
            .eq('id', id).eq('user_id', userId).single();
        if (error || !data) return null;
        return formatTransaction(data);
    }

    async getBalance(userId, { mes, ano, contexto }) {
        // Agora passa o contexto
        const transacoes = await this.list(userId, { mes, ano, contexto });

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

    async getReceivables(userId, contexto) {
        let query = supabase.from('transacoes')
            .select('valor')
            .eq('user_id', userId)
            .eq('tipo', 'receita')
            .eq('status', 'pendente');

        if (contexto) query = query.eq('contexto', contexto);

        const { data } = await query;

        const total = (data || []).reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
        return { total: parseFloat(total.toFixed(2)) };
    }

    // Implementing Projection (Fixing the dashboard bug)
    async getProjection(userId, days = 30, contexto) {
        try {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + days);

            let query = supabase.from('transacoes')
                .select('*')
                .eq('user_id', userId)
                .gte('data_vencimento', today.toISOString().split('T')[0])
                .lte('data_vencimento', futureDate.toISOString().split('T')[0]);

            if (contexto) query = query.eq('contexto', contexto);

            const { data } = await query;
            if (!data) return [];

            // Group by day for chart
            const projection = data.reduce((acc, t) => {
                const day = new Date(t.data_vencimento).getDate();
                const currentVal = acc[day] || 0;
                acc[day] = currentVal + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor));
                return acc;
            }, {});

            return Object.keys(projection).map(d => ({
                name: `Dia ${d}`,
                saldo_projetado: projection[d]
            })).sort((a, b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));

        } catch (e) {
            console.error('Projection error', e);
            return [];
        }
    }

    async _updateBankBalance(userId, bancoId, valor, tipo, operation) {
        try {
            const { data: banco } = await supabase.from('bancos').select('saldo_atual').eq('id', bancoId).single();
            if (!banco) return;

            let novoSaldo = Number(banco.saldo_atual);
            const val = Number(valor);
            const mult = operation === 'add' ? 1 : -1;

            if (tipo === 'receita') novoSaldo += (val * mult);
            else novoSaldo -= (val * mult); // Despesa subtrai

            await supabase.from('bancos').update({ saldo_atual: novoSaldo }).eq('id', bancoId);
        } catch (e) {
            console.error('Erro ao atualizar saldo bancario:', e);
        }
    }
}

export default new TransacaoService();
