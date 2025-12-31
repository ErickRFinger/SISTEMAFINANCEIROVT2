import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar metas
router.get('/', async (req, res) => {
  try {
    console.log('📋 [METAS GET /] Iniciando listagem de metas');
    console.log('   User ID:', req.user?.userId || 'N/A');
    console.log('   Request path:', req.path);
    console.log('   Request originalUrl:', req.originalUrl);
    
    if (!req.user || !req.user.userId) {
      console.error('❌ [METAS] Usuário não autenticado');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { status } = req.query;

    let query = supabase
      .from('metas')
      .select(`
        *,
        categorias (
          nome,
          cor
        )
      `)
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: metas, error } = await query;

    if (error) {
      console.error('❌ [METAS] Erro na query Supabase:', error);
      // Se a tabela não existe, retornar array vazio
      if (error.code === '42P01' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.message?.includes('table')) {
        console.warn('⚠️ [METAS] Tabela metas não existe. Execute o script SQL schema-novas-tabelas.sql');
        return res.json([]);
      }
      throw error;
    }

    // Calcular progresso
    const metasFormatadas = (metas || []).map(meta => ({
      ...meta,
      categoria_nome: meta.categorias?.nome || null,
      categoria_cor: meta.categorias?.cor || null,
      progresso: meta.valor_meta > 0 ? (meta.valor_atual / meta.valor_meta) * 100 : 0,
      categorias: undefined
    }));

    console.log('✅ [METAS] Metas encontradas:', metasFormatadas?.length || 0);
    return res.json(metasFormatadas);
  } catch (error) {
    console.error('❌ [METAS] Erro ao listar metas:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar metas',
      details: error.message,
      code: error.code
    });
  }
});

// Obter meta por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: meta, error } = await supabase
      .from('metas')
      .select(`
        *,
        categorias (
          nome,
          cor
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !meta) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const metaFormatada = {
      ...meta,
      categoria_nome: meta.categorias?.nome || null,
      categoria_cor: meta.categorias?.cor || null,
      progresso: meta.valor_meta > 0 ? (meta.valor_atual / meta.valor_meta) * 100 : 0,
      categorias: undefined
    };

    res.json(metaFormatada);
  } catch (error) {
    console.error('Erro ao obter meta:', error);
    res.status(500).json({ error: 'Erro ao obter meta' });
  }
});

// Criar meta
router.post('/', [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  body('valor_meta').isFloat({ min: 0.01 }).withMessage('Valor da meta deve ser maior que zero'),
  body('data_inicio').notEmpty().withMessage('Data de início é obrigatória'),
  body('data_fim').notEmpty().withMessage('Data de fim é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { titulo, descricao, valor_meta, valor_atual, data_inicio, data_fim, categoria_id, status } = req.body;

    // Validar datas
    if (new Date(data_fim) < new Date(data_inicio)) {
      return res.status(400).json({ error: 'Data de fim deve ser posterior à data de início' });
    }

    // Garantir que valores sejam números válidos
    const valorMetaNum = parseFloat(valor_meta)
    const valorAtualNum = parseFloat(valor_atual || 0)

    if (isNaN(valorMetaNum) || valorMetaNum <= 0) {
      return res.status(400).json({ error: 'Valor da meta deve ser um número maior que zero' })
    }

    if (isNaN(valorAtualNum) || valorAtualNum < 0) {
      return res.status(400).json({ error: 'Valor atual deve ser um número maior ou igual a zero' })
    }

    const { data: novaMeta, error } = await supabase
      .from('metas')
      .insert([{
        user_id: req.user.userId,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        valor_meta: valorMetaNum,
        valor_atual: valorAtualNum,
        data_inicio,
        data_fim,
        categoria_id: categoria_id ? parseInt(categoria_id) : null,
        status: status || 'ativa'
      }])
      .select(`
        *,
        categorias (
          nome,
          cor
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    const metaFormatada = {
      ...novaMeta,
      categoria_nome: novaMeta.categorias?.nome || null,
      categoria_cor: novaMeta.categorias?.cor || null,
      progresso: novaMeta.valor_meta > 0 ? (novaMeta.valor_atual / novaMeta.valor_meta) * 100 : 0,
      categorias: undefined
    };

    res.status(201).json(metaFormatada);
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    const errorMessage = error.message || 'Erro ao criar meta';
    const errorDetails = error.details || error.hint || '';
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      code: error.code
    });
  }
});

// Atualizar meta
router.put('/:id', [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  body('valor_meta').isFloat({ min: 0.01 }).withMessage('Valor da meta deve ser maior que zero')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se meta existe e pertence ao usuário
    const { data: metaExistente, error: checkError } = await supabase
      .from('metas')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !metaExistente) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const { titulo, descricao, valor_meta, valor_atual, data_inicio, data_fim, categoria_id, status } = req.body;

    // Garantir que valores sejam números válidos
    const valorMetaNum = parseFloat(valor_meta)
    const valorAtualNum = parseFloat(valor_atual || 0)

    if (isNaN(valorMetaNum) || valorMetaNum <= 0) {
      return res.status(400).json({ error: 'Valor da meta deve ser um número maior que zero' })
    }

    if (isNaN(valorAtualNum) || valorAtualNum < 0) {
      return res.status(400).json({ error: 'Valor atual deve ser um número maior ou igual a zero' })
    }

    const updateData = {
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      valor_meta: valorMetaNum,
      valor_atual: valorAtualNum,
      categoria_id: categoria_id ? parseInt(categoria_id) : null,
      updated_at: new Date().toISOString()
    };

    if (data_inicio) updateData.data_inicio = data_inicio;
    if (data_fim) updateData.data_fim = data_fim;
    if (status) updateData.status = status;

    const { data: metaAtualizada, error } = await supabase
      .from('metas')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select(`
        *,
        categorias (
          nome,
          cor
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    const metaFormatada = {
      ...metaAtualizada,
      categoria_nome: metaAtualizada.categorias?.nome || null,
      categoria_cor: metaAtualizada.categorias?.cor || null,
      progresso: metaAtualizada.valor_meta > 0 ? (metaAtualizada.valor_atual / metaAtualizada.valor_meta) * 100 : 0,
      categorias: undefined
    };

    res.json(metaFormatada);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    const errorMessage = error.message || 'Erro ao atualizar meta';
    const errorDetails = error.details || error.hint || '';
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      code: error.code
    });
  }
});

// Deletar meta
router.delete('/:id', async (req, res) => {
  try {
    const { data: metaExistente, error: checkError } = await supabase
      .from('metas')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !metaExistente) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Meta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

// Adicionar valor à meta
router.post('/:id/adicionar', [
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { valor } = req.body;

    // Buscar meta atual
    const { data: meta, error: fetchError } = await supabase
      .from('metas')
      .select('valor_atual, valor_meta')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (fetchError || !meta) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const novoValor = parseFloat(meta.valor_atual) + parseFloat(valor);
    const statusAtualizado = novoValor >= parseFloat(meta.valor_meta) ? 'concluida' : meta.status;

    const { data: metaAtualizada, error } = await supabase
      .from('metas')
      .update({
        valor_atual: novoValor,
        status: statusAtualizado,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select(`
        *,
        categorias (
          nome,
          cor
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    const metaFormatada = {
      ...metaAtualizada,
      categoria_nome: metaAtualizada.categorias?.nome || null,
      categoria_cor: metaAtualizada.categorias?.cor || null,
      progresso: metaAtualizada.valor_meta > 0 ? (metaAtualizada.valor_atual / metaAtualizada.valor_meta) * 100 : 0,
      categorias: undefined
    };

    res.json(metaFormatada);
  } catch (error) {
    console.error('Erro ao adicionar valor à meta:', error);
    res.status(500).json({ error: 'Erro ao adicionar valor à meta' });
  }
});

export default router;

