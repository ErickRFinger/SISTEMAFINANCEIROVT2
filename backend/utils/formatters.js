/**
 * Formata um objeto de transação retornado do Supabase
 * para o formato esperado pelo frontend (flattened)
 * @param {Object} transacao - Objeto transação cru do banco
 * @returns {Object} Transação formatada
 */
export const formatTransaction = (transacao) => {
    if (!transacao) return null;

    return {
        ...transacao,
        categoria_nome: transacao.categorias?.nome || null,
        categoria_cor: transacao.categorias?.cor || null,
        banco_nome: transacao.bancos?.nome || null,
        banco_cor: transacao.bancos?.cor || null,
        cartao_nome: transacao.cartoes?.nome || null,
        cartao_cor: transacao.cartoes?.cor || null,
        // Remove os objetos aninhados para limpar a resposta
        categorias: undefined,
        bancos: undefined,
        cartoes: undefined
    };
};
