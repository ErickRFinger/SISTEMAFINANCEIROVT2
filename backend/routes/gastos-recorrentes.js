import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar gastos recorrentes
router.get('/', async (req, res) => {
  try {
    const { ativo } = req.query;

    let query = supabase
      .from('gastos_recorrentes')
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
      .order('dia_vencimento', { ascending: true });

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true');
    }

    const { data: gastos, error } = await query;

    if (error) {
      throw error;
    }

    // Formatar dados
    const gastosFormatados = gastos.map(gasto => ({
      ...gasto,
      categoria_nome: gasto.categorias?.nome || null,
      categoria_cor: gasto.categorias?.cor || null,
      banco_nome: gasto.bancos?.nome || null,
      banco_cor: gasto.bancos?.cor || null,
      cartao_nome: gasto.cartoes?.nome || null,
      cartao_cor: gasto.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    }));

    res.json(gastosFormatados);
  } catch (error) {
    console.error('Erro ao listar gastos recorrentes:', error);
    res.status(500).json({ error: 'Erro ao listar gastos recorrentes' });
  }
});

// Obter gasto recorrente por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: gasto, error } = await supabase
      .from('gastos_recorrentes')
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

    if (error || !gasto) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado' });
    }

    const gastoFormatado = {
      ...gasto,
      categoria_nome: gasto.categorias?.nome || null,
      categoria_cor: gasto.categorias?.cor || null,
      banco_nome: gasto.bancos?.nome || null,
      banco_cor: gasto.bancos?.cor || null,
      cartao_nome: gasto.cartoes?.nome || null,
      cartao_cor: gasto.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    };

    res.json(gastoFormatado);
  } catch (error) {
    console.error('Erro ao obter gasto recorrente:', error);
    res.status(500).json({ error: 'Erro ao obter gasto recorrente' });
  }
});

// Criar gasto recorrente
router.post('/', [
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('dia_vencimento').isInt({ min: 1, max: 31 }).withMessage('Dia de vencimento deve ser entre 1 e 31')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descricao, valor, dia_vencimento, tipo, categoria_id, banco_id, cartao_id, ativo, observacoes } = req.body;

    const { data: novoGasto, error } = await supabase
      .from('gastos_recorrentes')
      .insert([{
        user_id: req.user.userId,
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        dia_vencimento: parseInt(dia_vencimento),
        tipo: tipo || 'mensal',
        categoria_id: categoria_id || null,
        banco_id: banco_id || null,
        cartao_id: cartao_id || null,
        ativo: ativo !== undefined ? ativo : true,
        observacoes: observacoes?.trim() || null
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

    if (error) {
      throw error;
    }

    const gastoFormatado = {
      ...novoGasto,
      categoria_nome: novoGasto.categorias?.nome || null,
      categoria_cor: novoGasto.categorias?.cor || null,
      banco_nome: novoGasto.bancos?.nome || null,
      banco_cor: novoGasto.bancos?.cor || null,
      cartao_nome: novoGasto.cartoes?.nome || null,
      cartao_cor: novoGasto.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    };

    res.status(201).json(gastoFormatado);
  } catch (error) {
    console.error('Erro ao criar gasto recorrente:', error);
    res.status(500).json({ error: 'Erro ao criar gasto recorrente' });
  }
});

// Atualizar gasto recorrente
router.put('/:id', [
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data: gastoExistente, error: checkError } = await supabase
      .from('gastos_recorrentes')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !gastoExistente) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado' });
    }

    const { descricao, valor, dia_vencimento, tipo, categoria_id, banco_id, cartao_id, ativo, observacoes } = req.body;

    const { data: gastoAtualizado, error } = await supabase
      .from('gastos_recorrentes')
      .update({
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        dia_vencimento: dia_vencimento ? parseInt(dia_vencimento) : undefined,
        tipo: tipo || 'mensal',
        categoria_id: categoria_id || null,
        banco_id: banco_id || null,
        cartao_id: cartao_id || null,
        ativo: ativo !== undefined ? ativo : true,
        observacoes: observacoes?.trim() || null,
        updated_at: new Date().toISOString()
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

    if (error) {
      throw error;
    }

    const gastoFormatado = {
      ...gastoAtualizado,
      categoria_nome: gastoAtualizado.categorias?.nome || null,
      categoria_cor: gastoAtualizado.categorias?.cor || null,
      banco_nome: gastoAtualizado.bancos?.nome || null,
      banco_cor: gastoAtualizado.bancos?.cor || null,
      cartao_nome: gastoAtualizado.cartoes?.nome || null,
      cartao_cor: gastoAtualizado.cartoes?.cor || null,
      categorias: undefined,
      bancos: undefined,
      cartoes: undefined
    };

    res.json(gastoFormatado);
  } catch (error) {
    console.error('Erro ao atualizar gasto recorrente:', error);
    res.status(500).json({ error: 'Erro ao atualizar gasto recorrente' });
  }
});

// Deletar gasto recorrente
router.delete('/:id', async (req, res) => {
  try {
    const { data: gastoExistente, error: checkError } = await supabase
      .from('gastos_recorrentes')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !gastoExistente) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado' });
    }

    const { error } = await supabase
      .from('gastos_recorrentes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Gasto recorrente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar gasto recorrente:', error);
    res.status(500).json({ error: 'Erro ao deletar gasto recorrente' });
  }
});

// Gerar transação a partir de gasto recorrente
router.post('/:id/gerar-transacao', async (req, res) => {
  try {
    const { data: gasto, error: fetchError } = await supabase
      .from('gastos_recorrentes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .eq('ativo', true)
      .single();

    if (fetchError || !gasto) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado ou inativo' });
    }

    // Calcular data do vencimento no mês atual
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const diaVencimento = gasto.dia_vencimento;
    
    // Ajustar para o último dia do mês se o dia de vencimento for maior que os dias do mês
    const ultimoDiaMes = new Date(ano, mes, 0).getDate();
    const diaFinal = diaVencimento > ultimoDiaMes ? ultimoDiaMes : diaVencimento;
    const dataVencimento = `${ano}-${String(mes).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;

    // Criar transação
    const { data: transacao, error: transacaoError } = await supabase
      .from('transacoes')
      .insert([{
        user_id: req.user.userId,
        categoria_id: gasto.categoria_id,
        banco_id: gasto.banco_id,
        cartao_id: gasto.cartao_id,
        tipo: 'despesa',
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: dataVencimento
      }])
      .select(`
        *,
        categorias (
          nome,
          cor
        )
      `)
      .single();

    if (transacaoError) {
      throw transacaoError;
    }

    const transacaoFormatada = {
      ...transacao,
      categoria_nome: transacao.categorias?.nome || null,
      categoria_cor: transacao.categorias?.cor || null,
      categorias: undefined
    };

    res.status(201).json({
      message: 'Transação gerada com sucesso',
      transacao: transacaoFormatada
    });
  } catch (error) {
    console.error('Erro ao gerar transação:', error);
    res.status(500).json({ error: 'Erro ao gerar transação' });
  }
});

export default router;

