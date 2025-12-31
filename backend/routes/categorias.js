import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar categorias
router.get('/', async (req, res) => {
  try {
    const { tipo } = req.query;

    let query = supabase
      .from('categorias')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('nome', { ascending: true });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data: categorias, error } = await query;

    if (error) {
      throw error;
    }

    res.json(categorias || []);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Criar categoria
router.post('/', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('tipo').isIn(['receita', 'despesa']).withMessage('Tipo deve ser receita ou despesa'),
  body('cor').optional().isHexColor().withMessage('Cor deve ser um código hexadecimal válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, tipo, cor } = req.body;

    // Verificar se já existe categoria com mesmo nome e tipo
    const { data: existe, error: checkError } = await supabase
      .from('categorias')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('nome', nome)
      .eq('tipo', tipo)
      .single();
    
    if (existe) {
      return res.status(400).json({ error: 'Categoria já existe' });
    }

    const { data: novaCategoria, error: insertError } = await supabase
      .from('categorias')
      .insert([{
        user_id: req.user.userId,
        nome,
        tipo,
        cor: cor || '#6366f1'
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json(novaCategoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
router.put('/:id', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('tipo').isIn(['receita', 'despesa']).withMessage('Tipo deve ser receita ou despesa'),
  body('cor').optional().isHexColor().withMessage('Cor deve ser um código hexadecimal válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se categoria existe e pertence ao usuário
    const { data: categoria, error: checkError } = await supabase
      .from('categorias')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();
    
    if (checkError || !categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const { nome, tipo, cor } = req.body;

    // Verificar se já existe outra categoria com mesmo nome e tipo
    const { data: existe, error: existsError } = await supabase
      .from('categorias')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('nome', nome)
      .eq('tipo', tipo)
      .neq('id', req.params.id)
      .single();
    
    if (existe) {
      return res.status(400).json({ error: 'Categoria já existe' });
    }

    const { data: categoriaAtualizada, error: updateError } = await supabase
      .from('categorias')
      .update({
        nome,
        tipo,
        cor: cor || '#6366f1'
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json(categoriaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se categoria existe e pertence ao usuário
    const { data: categoria, error: checkError } = await supabase
      .from('categorias')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();
    
    if (checkError || !categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se há transações usando esta categoria
    const { count, error: countError } = await supabase
      .from('transacoes')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', req.params.id);
    
    if (countError) {
      throw countError;
    }

    if (count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar categoria que possui transações associadas' 
      });
    }

    const { error: deleteError } = await supabase
      .from('categorias')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

export default router;

