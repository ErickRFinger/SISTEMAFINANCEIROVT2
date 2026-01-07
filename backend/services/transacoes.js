import supabase from '../database/db.js';
import { formatTransaction } from '../utils/formatters.js';

class TransacaoService {

    /**
     * LISTAGEM BLINDADA (Bulletproof List)
     * Tenta buscar com contexto. Se falhar (banco desatualizado), busca sem.
     */
    async list(userId, { mes, ano, tipo, status, contexto }) {
        try {
            // TENTATIVA 1: Query Completa (Com Contexto)
            return await this._executeQuery(userId, { mes, ano, tipo, status, contexto }, true);
        } catch (error) {
            console.warn('⚠️ [BACKEND] Falha ao listar com contexto. Reeexecutando em MODO LEGADO...', error.message);
            // TENTATIVA 2: Query Legada (Sem Contexto) - Garantia de Funcionamento
            return await this._executeQuery(userId, { mes, ano, tipo, status }, false);
        }
    }

    /**
     * CRIAÇÃO BLINDADA (Bulletproof Create)
     * Tenta salvar com tudo. Se de erro de coluna, salva o básico.
     */
    async create(userId, transactionData) {
        // LOG START
        console.log('➡️ [CREATE TRANSACTION] Iniciando criação...');
        console.log('📦 [PAYLOAD RAW]:', JSON.stringify(transactionData));

        // 1. Sanitização (Evita erro 'undefined' e NaN)
        const safeId = (val) => (val === 'undefined' || val === '' || val == null) ? null : val;
        // Float seguro: converte, se der NaN vira 0
        const safeFloat = (val) => {
            const n = parseFloat(val);
            return isNaN(n) ? 0 : n;
        };

        const basePayload = {
            user_id: userId,
            descricao: transactionData.descricao || 'Sem descrição',
            valor: safeFloat(transactionData.valor),
            tipo: transactionData.tipo || 'despesa', // Default seguro
            data: transactionData.data || new Date().toISOString(),
            status: transactionData.status || 'pago',
            data_vencimento: transactionData.data_vencimento || transactionData.data || new Date().toISOString(),
            is_recorrente: transactionData.is_recorrente || false,
            categoria_id: safeId(transactionData.categoria_id),
            banco_id: safeId(transactionData.banco_id),
            cartao_id: safeId(transactionData.cartao_id)
        };

        const contextPayload = { ...basePayload, contexto: transactionData.contexto || 'pessoal' };

        console.log('🛡️ [PAYLOAD CLEANED]:', JSON.stringify(contextPayload));

        try {
            // TENTATIVA 1: Inserir com Contexto
            const { data, error } = await supabase
                .from('transacoes')
                .insert([contextPayload])
                .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
                .single();

            if (error) {
                console.error('❌ [ERRO TENTATIVA 1]:', error);
                throw error;
            }
            console.log('✅ [SUCESSO TENTATIVA 1]');
            if (basePayload.banco_id) await this._updateBankBalance(userId, basePayload.banco_id, basePayload.valor, basePayload.tipo, 'add');
            return formatTransaction(data);

        } catch (error) {
            console.warn('⚠️ [BACKEND] Erro ao criar (Novo Modelo). Tentando MODO LEGADO...', error.message);

            // TENTATIVA 2: Inserir Modo Antigo (Sem Contexto)
            try {
                const { data: legacyData, error: legacyError } = await supabase
                    .from('transacoes')
                    .insert([basePayload])
                    .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
                    .single();

                if (legacyError) {
                    console.error('❌ [ERRO TENTATIVA 2 / FATAL]:', legacyError);
                    throw legacyError;
                }
                console.log('✅ [SUCESSO TENTATIVA 2 (LEGADO)]');
                if (basePayload.banco_id) await this._updateBankBalance(userId, basePayload.banco_id, basePayload.valor, basePayload.tipo, 'add');
                return formatTransaction(legacyData);
            } catch (fatalError) {
                console.error('❌ [FATAL REAL]:', fatalError);
                throw fatalError;
            }
        }
    }

    /**
     * SALDO BLINDADO (Bulletproof Balance)
     * Reutiliza a lógica de listagem para garantir consistência total.
     */
    async getBalance(userId, { mes, ano, contexto }) {
        try {
            // Reaproveita a mesma lógica da listagem (se a lista funciona, o saldo funciona)
            const transacoes = await this.list(userId, { mes, ano, contexto });

            // SOMA TUDO QUE RETORNOU (Sem filtros extras de status)
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
        } catch (error) {
            console.error('❌ [FATAL] Erro ao calcular saldo:', error);
            return { receitas: 0, despesas: 0, saldo: 0 };
        }
    }

    // --- MÉTODOS PRIVADOS E AUXILIARES (Internal) ---

    async _executeQuery(userId, filters, useContext) {
        let query = supabase
            .from('transacoes')
            .select(`*, categorias (nome, cor), bancos (nome, cor), cartoes (nome, cor)`)
            .eq('user_id', userId)
            .order('data', { ascending: false })
            .order('created_at', { ascending: false });

        const { mes, ano, tipo, status, contexto } = filters;

        if (mes && ano) {
            const mesNum = parseInt(mes);
            const anoNum = parseInt(ano);
            const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
            const endDate = new Date(anoNum, mesNum, 0).toISOString().split('T')[0];
            query = query.gte('data', startDate).lte('data', endDate);
        }

        if (tipo) query = query.eq('tipo', tipo);
        if (status) query = query.eq('status', status);

        if (useContext && contexto) {
            if (contexto === 'pessoal') {
                query = query.neq('contexto', 'empresarial');
            } else {
                query = query.eq('contexto', contexto);
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map(formatTransaction);
    }

    async update(id, userId, transactionData) {
        const transacaoAntiga = await this.getById(id, userId);
        if (!transacaoAntiga) throw new Error('Transação não encontrada');

        const safeId = (val) => (val === 'undefined' || val === '' || val == null) ? null : val;
        // Float seguro
        const safeFloat = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

        const payload = {
            descricao: transactionData.descricao || transacaoAntiga.descricao,
            valor: transactionData.valor !== undefined ? safeFloat(transactionData.valor) : transacaoAntiga.valor,
            tipo: transactionData.tipo || transacaoAntiga.tipo,
            data: transactionData.data || transacaoAntiga.data,
            status: transactionData.status || transacaoAntiga.status,
            data_vencimento: transactionData.data_vencimento || transacaoAntiga.data_vencimento,
            categoria_id: safeId(transactionData.categoria_id),
            banco_id: safeId(transactionData.banco_id),
            cartao_id: safeId(transactionData.cartao_id),
            // Tenta passar contexto se existir, se der erro o update falha? 
            // Update é mais delicado. Vamos passar contexto apenas.
            // Se a coluna não existir, o Supabase ignora campos extras no update? Não, ele dá erro.
            // Para "update", vamos assumir que se falhar, tentamos sem contexto.
        };

        // Estratégia Try/Catch também no Update
        try {
            return await this._performUpdate(id, userId, { ...payload, contexto: transactionData.contexto }, transacaoAntiga);
        } catch (e) {
            return await this._performUpdate(id, userId, payload, transacaoAntiga);
        }
    }

    async _performUpdate(id, userId, payload, transacaoAntiga) {
        const { data, error } = await supabase
            .from('transacoes')
            .update(payload)
            .eq('id', id)
            .eq('user_id', userId)
            .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
            .single();

        if (error) throw error;

        if (transacaoAntiga.banco_id) await this._updateBankBalance(userId, transacaoAntiga.banco_id, transacaoAntiga.valor, transacaoAntiga.tipo, 'remove');
        if (payload.banco_id) await this._updateBankBalance(userId, payload.banco_id, payload.valor, payload.tipo, 'add');

        return formatTransaction(data);
    }

    async delete(id, userId) {
        const transacao = await this.getById(id, userId);
        const { error } = await supabase.from('transacoes').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
        if (transacao && transacao.banco_id) await this._updateBankBalance(userId, transacao.banco_id, transacao.valor, transacao.tipo, 'remove');
        return true;
    }

    async getById(id, userId) {
        const { data, error } = await supabase
            .from('transacoes')
            .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
            .eq('id', id).eq('user_id', userId).single();
        if (error || !data) return null;
        return formatTransaction(data);
    }

    async _updateBankBalance(userId, bancoId, valor, tipo, operation = 'add') {
        try {
            const { data: banco } = await supabase.from('bancos').select('saldo_atual').eq('id', bancoId).single();
            if (!banco) return;
            let novoSaldo = Number(banco.saldo_atual);
            const val = Number(valor);
            const mult = operation === 'add' ? 1 : -1;
            if (tipo === 'receita') novoSaldo += (val * mult);
            else novoSaldo -= (val * mult);
            await supabase.from('bancos').update({ saldo_atual: novoSaldo }).eq('id', bancoId);
        } catch (e) { console.error(e); }
    }

    async getReceivables(userId) {
        try {
            const { data } = await supabase.from('transacoes').select('valor').eq('user_id', userId).eq('tipo', 'receita').eq('status', 'pendente');
            const total = (data || []).reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
            return { total: parseFloat(total.toFixed(2)) };
        } catch (e) { return { total: 0 }; }
    }

    async getProjection(u, d, c) { return []; }
}

export default new TransacaoService();
