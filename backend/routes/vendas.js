import express from 'express';
import supabase from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/vendas
 * Listar histórico de vendas
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Busca Vendas + Cliente + Itens
        const { data, error } = await supabase
            .from('vendas')
            .select(`
                *,
                cliente:clientes(nome),
                itens:itens_venda(
                    id, nome_produto, quantidade, preco_unitario, subtotal
                )
            `)
            .eq('user_id', req.user.userId)
            .order('data_venda', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro ao listar vendas:', err.message);
        res.status(500).json({ error: 'Erro ao listar vendas: ' + err.message });
    }
});

/**
 * POST /api/vendas
 * Criar NOVA VENDA (A mágica do ERP acontece aqui)
 * 1. Cria a Venda
 * 2. Cria os Itens
 * 3. Baixa o Estoque
 * 4. Lança no Financeiro
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { cliente_id, itens, forma_pagamento, desconto, observacoes } = req.body;

        if (!itens || itens.length === 0) {
            return res.status(400).json({ error: 'Venda sem itens.' });
        }

        // 1. Calcular Totais
        let valorTotalItens = 0;
        itens.forEach(item => {
            valorTotalItens += Number(item.preco) * Number(item.quantidade);
        });
        const valorFinal = valorTotalItens - (Number(desconto) || 0);

        // 2. Criar Venda
        const { data: vendaData, error: vendaError } = await supabase
            .from('vendas')
            .insert([{
                user_id: req.user.userId,
                cliente_id: cliente_id || null,
                status: 'concluiu',
                valor_total: valorFinal,
                desconto: Number(desconto) || 0,
                forma_pagamento,
                observacoes
            }])
            .select()
            .single();

        if (vendaError) throw vendaError;

        const vendaId = vendaData.id;

        // 3. Processar Itens (Salvar + Baixar Estoque)
        for (const item of itens) {
            // A. Salvar Item
            await supabase.from('itens_venda').insert([{
                user_id: req.user.userId,
                venda_id: vendaId,
                produto_id: item.id,
                nome_produto: item.nome,
                quantidade: item.quantidade,
                preco_unitario: item.preco,
                subtotal: item.preco * item.quantidade
            }]);

            // B. Baixar Estoque (Se for produto e não serviço)
            if (item.tipo_item === 'produto') {
                // Ler estoque atual
                const { data: prodData } = await supabase
                    .from('produtos')
                    .select('quantidade_estoque')
                    .eq('id', item.id)
                    .single();

                if (prodData) {
                    const novoEstoque = (prodData.quantidade_estoque || 0) - item.quantidade;
                    await supabase
                        .from('produtos')
                        .update({ quantidade_estoque: novoEstoque })
                        .eq('id', item.id);
                }
            }
        }

        // 4. Lançar no Financeiro (Transações)
        // Cria uma RECEITA automaticamente
        await supabase.from('transacoes').insert([{
            user_id: req.user.userId,
            descricao: `Venda #${vendaId} - ${forma_pagamento}`,
            valor: valorFinal,
            tipo: 'receita',
            data: new Date().toISOString().split('T')[0], // Hoje
            // Tenta achar categoria 'Vendas', senão null
            // (Para ficar perfeito precisaria buscar o ID da categoria, mas vamos deixar null por enquanto ou criar default)
        }]);

        res.status(201).json(vendaData);

    } catch (err) {
        console.error('Erro ao processar venda:', err.message);
        res.status(500).json({ error: 'Erro ao processar venda: ' + err.message });
    }
});

export default router;
