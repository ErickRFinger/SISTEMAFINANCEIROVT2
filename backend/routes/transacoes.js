import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar transações
router.get('/', async (req, res) => {
  try {
    const { mes, ano, tipo } = req.query;

    let query = supabase
      .from('transacoes')
      .select(`
        *,
        categorias (
          nome,
          cor
        ),
        bancos (
          nome,
          cor
        ),
        cartoes (
          nome,
          cor
        )
      `)
      .eq('user_id', req.user.userId)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (mes && ano) {
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
      const lastDay = new Date(anoNum, mesNum, 0).getDate();
      const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      console.log('Filtrando lista por:', { startDate, endDate, mes, ano });
      query = query.gte('data', startDate).lte('data', endDate);
    }
    
    // Remover limit se existir (não é suportado pelo Supabase desta forma)
    // O limit será feito no frontend

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data: transacoes, error } = await query;

    if (error) {
      throw error;
    }

    // Formatar dados para incluir categoria_nome, categoria_cor, banco_nome, cartao_nome
    const transacoesFormatadas = transacoes.map(t => ({
      ...t,
      categoria_nome: t.categorias?.nome || null,
      categoria_cor: t.categorias?.cor || null,
      banco_nome: t.bancos?.nome || null,
      banco_cor: t.bancos?.cor || null,
      cartao_nome: t.cartoes?.nome || null,
      cartao_cor: t.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    }));

    res.json(transacoesFormatadas);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// Obter transação por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: transacao, error } = await supabase
      .from('transacoes')
      .select(`
        *,
        categorias (
          nome,
          cor
        ),
        bancos (
          nome,
          cor
        ),
        cartoes (
          nome,
          cor
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const transacaoFormatada = {
      ...transacao,
      categoria_nome: transacao.categorias?.nome || null,
      categoria_cor: transacao.categorias?.cor || null,
      banco_nome: transacao.bancos?.nome || null,
      banco_cor: transacao.bancos?.cor || null,
      cartao_nome: transacao.cartoes?.nome || null,
      cartao_cor: transacao.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    };

    res.json(transacaoFormatada);
  } catch (error) {
    console.error('Erro ao obter transação:', error);
    res.status(500).json({ error: 'Erro ao obter transação' });
  }
});

// Criar transação
router.post('/', [
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('tipo').isIn(['receita', 'despesa']).withMessage('Tipo deve ser receita ou despesa'),
  body('data').notEmpty().withMessage('Data é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descricao, valor, tipo, data, categoria_id, banco_id, cartao_id } = req.body;

    // Verificar se categoria pertence ao usuário (se fornecida)
    if (categoria_id) {
      const { data: categoria, error: catError } = await supabase
        .from('categorias')
        .select('id')
        .eq('id', categoria_id)
        .eq('user_id', req.user.userId)
        .single();

      if (catError || !categoria) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
    }

    // Validar banco e cartão se fornecidos
    if (banco_id) {
      const { data: banco, error: bancoError } = await supabase
        .from('bancos')
        .select('id')
        .eq('id', banco_id)
        .eq('user_id', req.user.userId)
        .single();

      if (bancoError || !banco) {
        return res.status(400).json({ error: 'Banco inválido' });
      }
    }

    if (cartao_id) {
      const { data: cartao, error: cartaoError } = await supabase
        .from('cartoes')
        .select('id, banco_id')
        .eq('id', cartao_id)
        .eq('user_id', req.user.userId)
        .single();

      if (cartaoError || !cartao) {
        return res.status(400).json({ error: 'Cartão inválido' });
      }

      // Verificar se cartão pertence ao banco selecionado
      if (banco_id && cartao.banco_id !== parseInt(banco_id)) {
        return res.status(400).json({ error: 'Cartão não pertence ao banco selecionado' });
      }
    }

    const { data: novaTransacao, error: insertError } = await supabase
      .from('transacoes')
      .insert([{
        user_id: req.user.userId,
        categoria_id: categoria_id || null,
        banco_id: banco_id || null,
        cartao_id: cartao_id || null,
        tipo,
        descricao,
        valor: parseFloat(valor),
        data
      }])
      .select(`
        *,
        categorias (
          nome,
          cor
        ),
        bancos (
          nome,
          cor
        ),
        cartoes (
          nome,
          cor
        )
      `)
      .single();

    if (insertError) {
      throw insertError;
    }

    const transacaoFormatada = {
      ...novaTransacao,
      categoria_nome: novaTransacao.categorias?.nome || null,
      categoria_cor: novaTransacao.categorias?.cor || null,
      banco_nome: novaTransacao.bancos?.nome || null,
      banco_cor: novaTransacao.bancos?.cor || null,
      cartao_nome: novaTransacao.cartoes?.nome || null,
      cartao_cor: novaTransacao.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    };

    res.status(201).json(transacaoFormatada);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// Atualizar transação
router.put('/:id', [
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('tipo').isIn(['receita', 'despesa']).withMessage('Tipo deve ser receita ou despesa'),
  body('data').notEmpty().withMessage('Data é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se transação existe e pertence ao usuário
    const { data: transacaoExistente, error: checkError } = await supabase
      .from('transacoes')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !transacaoExistente) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const { descricao, valor, tipo, data, categoria_id, banco_id, cartao_id } = req.body;

    // Verificar categoria se fornecida
    if (categoria_id) {
      const { data: categoria, error: catError } = await supabase
        .from('categorias')
        .select('id')
        .eq('id', categoria_id)
        .eq('user_id', req.user.userId)
        .single();

      if (catError || !categoria) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
    }

    // Validar banco e cartão se fornecidos
    if (banco_id) {
      const { data: banco, error: bancoError } = await supabase
        .from('bancos')
        .select('id')
        .eq('id', banco_id)
        .eq('user_id', req.user.userId)
        .single();

      if (bancoError || !banco) {
        return res.status(400).json({ error: 'Banco inválido' });
      }
    }

    if (cartao_id) {
      const { data: cartao, error: cartaoError } = await supabase
        .from('cartoes')
        .select('id, banco_id')
        .eq('id', cartao_id)
        .eq('user_id', req.user.userId)
        .single();

      if (cartaoError || !cartao) {
        return res.status(400).json({ error: 'Cartão inválido' });
      }

      // Verificar se cartão pertence ao banco selecionado
      if (banco_id && cartao.banco_id !== parseInt(banco_id)) {
        return res.status(400).json({ error: 'Cartão não pertence ao banco selecionado' });
      }
    }

    const { data: transacaoAtualizada, error: updateError } = await supabase
      .from('transacoes')
      .update({
        descricao,
        valor: parseFloat(valor),
        tipo,
        data,
        categoria_id: categoria_id || null,
        banco_id: banco_id || null,
        cartao_id: cartao_id || null
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select(`
        *,
        categorias (
          nome,
          cor
        ),
        bancos (
          nome,
          cor
        ),
        cartoes (
          nome,
          cor
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    const transacaoFormatada = {
      ...transacaoAtualizada,
      categoria_nome: transacaoAtualizada.categorias?.nome || null,
      categoria_cor: transacaoAtualizada.categorias?.cor || null,
      banco_nome: transacaoAtualizada.bancos?.nome || null,
      banco_cor: transacaoAtualizada.bancos?.cor || null,
      cartao_nome: transacaoAtualizada.cartoes?.nome || null,
      cartao_cor: transacaoAtualizada.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    };

    res.json(transacaoFormatada);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// Deletar transação
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se transação existe e pertence ao usuário
    const { data: transacaoExistente, error: checkError } = await supabase
      .from('transacoes')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !transacaoExistente) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// Resumo financeiro
router.get('/resumo/saldo', async (req, res) => {
  try {
    const { mes, ano } = req.query;

    let query = supabase
      .from('transacoes')
      .select('tipo, valor, data')
      .eq('user_id', req.user.userId);

    if (mes && ano) {
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
      // Último dia do mês (mesNum é 1-12, então usamos mesNum para o próximo mês e dia 0 para pegar o último dia do mês atual)
      const lastDay = new Date(anoNum, mesNum, 0).getDate();
      const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      console.log('Filtrando transações por:', { startDate, endDate, mes, ano, mesNum, anoNum });
      query = query.gte('data', startDate).lte('data', endDate);
    } else {
      console.log('Sem filtro de data - buscando todas as transações');
    }

    const { data: transacoes, error } = await query;

    if (error) {
      console.error('Erro na query:', error);
      throw error;
    }

    console.log('Transações encontradas:', transacoes?.length || 0);
    console.log('Transações:', transacoes);

    // Calcular totais - garantir que valores sejam números
    const receitas = (transacoes || [])
      .filter(t => t && t.tipo === 'receita' && t.valor)
      .reduce((sum, t) => {
        const valor = typeof t.valor === 'string' ? parseFloat(t.valor) : t.valor;
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);

    const despesas = (transacoes || [])
      .filter(t => t && t.tipo === 'despesa' && t.valor)
      .reduce((sum, t) => {
        const valor = typeof t.valor === 'string' ? parseFloat(t.valor) : t.valor;
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);

    const saldo = receitas - despesas;

    console.log('Resumo calculado:', { receitas, despesas, saldo });

    res.json({
      receitas: parseFloat(receitas.toFixed(2)),
      despesas: parseFloat(despesas.toFixed(2)),
      saldo: parseFloat(saldo.toFixed(2))
    });
  } catch (error) {
    console.error('Erro ao calcular resumo:', error);
    res.status(500).json({ 
      error: 'Erro ao calcular resumo',
      detalhes: error.message 
    });
  }
});

export default router;

