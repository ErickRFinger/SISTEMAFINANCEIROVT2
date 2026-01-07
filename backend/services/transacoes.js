import supabase from '../database/db.js';
import { formatTransaction } from '../utils/formatters.js';

class TransacaoService {
    /**
     * Lista transações com filtros
     */
    async list(userId, { mes, ano, tipo, status, contexto }) {
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

        if (status) {
            query = query.eq('status', status);
        }

        if (contexto) {
            if (contexto === 'pessoal') {
                // Legacy support: Include rows where context is 'pessoal' OR null
                query = query.or('contexto.eq.pessoal,contexto.is.null');
            } else {
                query = query.eq('contexto', contexto);
            }
        }

        try {
            const { data, error } = await query;
            if (error) throw error;
            return data.map(formatTransaction);
        } catch (error) {
            // Self-healing: Se erro for de coluna inexistente, tenta criar e tentar de novo
            if (error.code === '42703' || error.message.includes('contexto')) {
                console.warn('⚠️ [BACKEND] Coluna contexto faltando. Tentando corrigir automaticamente...');
                await this._ensureContextColumn();
                // Retry attempt
                const { data: retryData, error: retryError } = await query;
                if (retryError) throw retryError;
                return retryData.map(formatTransaction);
            }
            throw error;
        }
    }

    /**
     * Helper para garantir que coluna existe (Self-Healing)
     */
    async _ensureContextColumn() {
        try {
            const schema = `
            DO $$
            BEGIN
                BEGIN
                    ALTER TABLE public.transacoes ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
                EXCEPTION WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE public.categorias ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
                EXCEPTION WHEN duplicate_column THEN NULL;
                END;
            END
            $$;
            `;
            await supabase.rpc('exec_sql', { sql_query: schema });
        } catch (e) {
            console.error('Falha ao tentar auto-correção de coluna:', e);
        }
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
            data: dataTransacao,
            contexto
        } = transactionData;

        // Validations
        if (categoria_id) {
            const { data: cat } = await supabase.from('categorias').select('id').eq('id', categoria_id).single();
            if (!cat) throw new Error('Categoria inválida');
        }
        if (banco_id) {
            const { data: bco } = await supabase.from('bancos').select('id').eq('id', banco_id).single();
            if (!bco) throw new Error('Banco inválido');
        }

        // Tenta inserir com TODOS os campos novos
        const payloadFull = {
            user_id: userId,
            categoria_id: categoria_id || null,
            banco_id: banco_id || null,
            cartao_id: cartao_id || null,
            tipo,
            descricao,
            valor: parseFloat(valor),
            data: dataTransacao,
            status: transactionData.status || 'pago',
            data_vencimento: transactionData.data_vencimento || dataTransacao,
            is_recorrente: transactionData.is_recorrente || false,
            contexto: contexto || 'pessoal'
        };

        try {
            const { data: novaTransacao, error } = await supabase
                .from('transacoes')
                .insert([payloadFull])
                .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
                .single();

            if (error) throw error;
            if (banco_id) await this._updateBankBalance(userId, banco_id, valor, tipo, 'add');
            return formatTransaction(novaTransacao);

        } catch (error) {
            console.warn('⚠️ [BACKEND] Erro ao criar transação completa. Tentando fallback...', error.message);
            throw error;
        }
    }

    /**
     * Atualiza uma transação
     */
    async update(id, userId, transactionData) {
        // 1. Buscar transação antiga para reverter saldo
        const transacaoAntiga = await this.getById(id, userId);
        if (!transacaoAntiga) throw new Error('Transação não encontrada');

        const payloadFull = {
            descricao: transactionData.descricao,
            valor: parseFloat(transactionData.valor),
            tipo: transactionData.tipo,
            data: transactionData.data,
            status: transactionData.status,
            data_vencimento: transactionData.data_vencimento,
            categoria_id: transactionData.categoria_id || null,
            banco_id: transactionData.banco_id || null,
            cartao_id: transactionData.cartao_id || null,
            contexto: transactionData.contexto // Update context if provided
        };

        try {
            const { data, error } = await supabase
                .from('transacoes')
                .update(payloadFull)
                .eq('id', id)
                .eq('user_id', userId)
                .select(`*, categories:categorias(nome, cor), banks:bancos(nome, cor)`)
                .single();

            if (error) throw error;

            // Lógica de atualização de saldo...
            if (transacaoAntiga.banco_id) {
                await this._updateBankBalance(userId, transacaoAntiga.banco_id, transacaoAntiga.valor, transacaoAntiga.tipo, 'remove');
            }
            if (transactionData.banco_id) {
                await this._updateBankBalance(userId, transactionData.banco_id, transactionData.valor, transactionData.tipo, 'add');
            }
            return formatTransaction(data);

        } catch (error) {
            throw error;
        }
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
     * Calcula o total a receber (receitas pendentes)
     */
    async getReceivables(userId) {
        const { data, error } = await supabase
            .from('transacoes')
            .select('valor')
            .eq('user_id', userId)
            .eq('tipo', 'receita')
            .eq('status', 'pendente');

        if (error) throw error;

        const total = data.reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
        return { total: parseFloat(total.toFixed(2)) };
    }

    /**
     * Gera projeção de fluxo de caixa para os próximos X dias
     */
    async getProjection(userId, days = 30, contexto) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = futureDate.toISOString().split('T')[0];

        // Buscar transações futuras (vencimento >= hoje)
        let query = supabase
            .from('transacoes')
            .select('data_vencimento, valor, tipo, status')
            .eq('user_id', userId)
            .gte('data_vencimento', startDateStr)
            .lte('data_vencimento', endDateStr)
            .order('data_vencimento', { ascending: true });

        if (contexto) {
            if (contexto === 'pessoal') {
                query = query.or('contexto.eq.pessoal,contexto.is.null');
            } else {
                query = query.eq('contexto', contexto);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Agrupar por dia
        const dailyData = {};

        // Inicializar dias com 0
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const diaMes = `${d.getDate()}/${d.getMonth() + 1}`;
            dailyData[dateStr] = { date: dateStr, name: diaMes, receitas: 0, despesas: 0, saldo_projetado: 0 };
        }

        // Preencher com dados reais
        data.forEach(t => {
            const dateStr = t.data_vencimento;
            if (dailyData[dateStr]) {
                const valor = Number(t.valor);
                if (t.tipo === 'receita') dailyData[dateStr].receitas += valor;
                else dailyData[dateStr].despesas += valor;
            }
        });

        // Calcular saldo acumulado (simulado)
        let accumulated = 0;
        // Nota: Idealmente pegaria o saldo atual do banco, mas aqui é apenas variação do fluxo

        return Object.values(dailyData).map(day => {
            day.saldo_projetado = day.receitas - day.despesas;
            return day;
        });
    }

    /**
     * Calcula o resumo financeiro (Saldo)
     */
    async getBalance(userId, { mes, ano, contexto }) {
        let query = supabase
            .from('transacoes')
            .select('tipo, valor, contexto')
            .eq('user_id', userId);

        if (mes && ano) {
            const mesNum = parseInt(mes);
            const anoNum = parseInt(ano);
            const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
            const lastDay = new Date(anoNum, mesNum, 0).getDate();
            const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            query = query.gte('data', startDate).lte('data', endDate);
        }

        if (contexto) {
            if (contexto === 'pessoal') {
                query = query.or('contexto.eq.pessoal,contexto.is.null');
            } else {
                query = query.eq('contexto', contexto);
            }
        }

        try {
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
        } catch (error) {
            // Self-healing: Se erro for de coluna inexistente
            if (error.code === '42703' || error.message.includes('contexto')) {
                await this._ensureContextColumn();
                // Retry attempt
                const { data: retryData, error: retryError } = await query;
                if (retryError) throw retryError;

                // Recalculate logic specific to getBalance
                const transacoes = retryData || [];
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
            throw error;
        }
    }
}

export default new TransacaoService();
