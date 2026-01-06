import supabase from '../database/db.js';

class AnalyticsService {
    /**
     * Retorna o Ranking de Produtos (Top X)
     */
    async getTopProducts(userId, limit = 5) {
        // Como o supabase-js não tem GROUP BY fácil, usamos uma RPC ou processamos JS (se volume baixo)
        // Para MVP e compatibilidade, vamos buscar vendas e processar (assumindo volume < 10k itens/mês)

        // Buscar itens de vendas nos últimos 30 dias (ou geral)
        const { data, error } = await supabase
            .from('itens_venda')
            .select('nome_produto, subtotal, quantidade')
            .eq('user_id', userId)
            // .gte('created_at', last30days) // Opcional
            .order('subtotal', { ascending: false })
            .limit(1000); // Limit para segurança

        if (error) throw error;

        // Agrupar via JS
        const grouped = {};
        data.forEach(item => {
            if (!grouped[item.nome_produto]) {
                grouped[item.nome_produto] = { name: item.nome_produto, value: 0, qtd: 0 };
            }
            grouped[item.nome_produto].value += Number(item.subtotal);
            grouped[item.nome_produto].qtd += Number(item.quantidade);
        });

        // Converter para array e ordenar
        return Object.values(grouped)
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    }

    /**
     * Retorna Receita por Categoria (Gráfico de Rosca)
     */
    async getRevenueByCategory(userId, { mes, ano }) {
        let query = supabase
            .from('transacoes')
            .select(`
                valor,
                categorias (nome)
            `)
            .eq('user_id', userId)
            .eq('tipo', 'receita')
            .eq('status', 'pago'); // Apenas receitas efetivadas

        if (mes && ano) {
            const mesNum = parseInt(mes);
            const anoNum = parseInt(ano);
            const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
            const lastDay = new Date(anoNum, mesNum, 0).getDate();
            const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            query = query.gte('data', startDate).lte('data', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Agrupar
        const grouped = {};
        data.forEach(t => {
            const catName = t.categorias?.nome || 'Sem Categoria';
            if (!grouped[catName]) grouped[catName] = 0;
            grouped[catName] += Number(t.valor);
        });

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }
}

export default new AnalyticsService();
