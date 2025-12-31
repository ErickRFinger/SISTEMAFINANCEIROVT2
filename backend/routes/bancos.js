import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../database/db.js';

const router = express.Router();

// Função auxiliar para obter userId validado
function getUserId(req) {
  if (!req.user || !req.user.userId) {
    throw new Error('Usuário não autenticado');
  }
  const userId = parseInt(req.user.userId);
  if (isNaN(userId)) {
    throw new Error(`ID de usuário inválido: ${req.user.userId}`);
  }
  return userId;
}

// Middleware de debug para TODAS as requisições
router.use((req, res, next) => {
  console.log(`\n🔍 [BANCOS ROUTER] Requisição recebida:`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  console.log(`   Base URL: ${req.baseUrl}`);
  console.log(`   Full URL: ${req.originalUrl || req.baseUrl + req.path}`);
  console.log(`   Headers:`, {
    authorization: req.headers.authorization ? 'Presente' : 'Ausente',
    'content-type': req.headers['content-type']
  });
  next();
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Middleware de tratamento de erros para o router
router.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  
  console.error('❌ [BANCOS ROUTER] Erro capturado pelo middleware:');
  console.error('   Mensagem:', err.message);
  console.error('   Código:', err.code);
  console.error('   Detalhes:', err.details);
  console.error('   Stack:', err.stack);
  
  // Erros de autenticação
  if (err.message === 'Usuário não autenticado' || err.message?.includes('ID de usuário inválido')) {
    return res.status(401).json({ error: err.message });
  }
  
  // Erro de tabela não existe
  if (err.code === '42P01' || err.message?.includes('does not exist') || err.message?.includes('relation')) {
    return res.status(500).json({ 
      error: 'Tabela bancos não existe no banco de dados',
      details: 'Execute o script SQL: backend/database/schema-novas-tabelas.sql no Supabase',
      code: err.code
    });
  }
  
  // Erro de RLS (Row Level Security)
  if (err.code === '42501' || err.message?.includes('row-level security') || err.message?.includes('RLS')) {
    return res.status(500).json({ 
      error: 'Erro de permissão no banco de dados',
      details: 'Verifique as configurações de RLS (Row Level Security) no Supabase. A tabela bancos precisa permitir acesso para usuários autenticados.',
      code: err.code
    });
  }
  
  // Erro de validação
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(400).json({ 
      error: 'Erro de validação',
      errors: err.errors
    });
  }
  
  // Outros erros
  return res.status(500).json({ 
    error: err.message || 'Erro interno do servidor',
    details: err.details || err.hint || (process.env.NODE_ENV !== 'production' ? err.stack : ''),
    code: err.code || 'UNKNOWN'
  });
});

// Listar bancos
router.get('/', async (req, res, next) => {
  try {
    console.log('📋 [BANCOS GET /] Iniciando listagem de bancos');
    console.log('   User ID:', req.user?.userId || 'N/A');
    console.log('   Request path:', req.path);
    console.log('   Request originalUrl:', req.originalUrl);
    
    const userId = getUserId(req);
    console.log('   Query Supabase - userId:', userId, 'tipo:', typeof userId);

    const { data: bancos, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('user_id', userId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ [BANCOS] Erro na query Supabase:', error);
      // Se a tabela não existe, retornar array vazio
      if (error.code === '42P01' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.message?.includes('table')) {
        console.warn('⚠️ [BANCOS] Tabela bancos não existe. Execute o script SQL schema-novas-tabelas.sql');
        return res.json([]);
      }
      throw error;
    }

    console.log('✅ [BANCOS] Bancos encontrados:', bancos?.length || 0);
    return res.json(bancos || []);
  } catch (error) {
    console.error('❌ [BANCOS] Erro ao listar bancos:', error);
    console.error('   Stack:', error.stack);
    console.error('   Error object:', JSON.stringify(error, null, 2));
    
    // Passar o erro para o middleware de tratamento de erros
    next(error);
  }
});

// Obter banco por ID
router.get('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { data: banco, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !banco) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }

    res.json(banco);
  } catch (error) {
    console.error('Erro ao obter banco:', error);
    next(error);
  }
});

// Criar banco
router.post('/', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
], async (req, res, next) => {
  try {
    console.log('📝 Criando banco:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = getUserId(req);
    const { nome, tipo, saldo_inicial, cor, observacoes } = req.body;

    // Garantir que saldo seja um número válido
    const saldoInicialNum = parseFloat(saldo_inicial) || 0
    if (isNaN(saldoInicialNum)) {
      return res.status(400).json({ error: 'Saldo inicial deve ser um número válido' })
    }

    console.log('   Inserindo banco - userId:', userId, 'tipo:', typeof userId);

    const { data: novoBanco, error } = await supabase
      .from('bancos')
      .insert([{
        user_id: userId,
        nome: nome.trim(),
        tipo: tipo || 'banco',
        saldo_inicial: saldoInicialNum,
        saldo_atual: saldoInicialNum,
        cor: cor || '#6366f1',
        observacoes: observacoes?.trim() || null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao inserir banco:', error);
      // Se a tabela não existe, retornar erro específico
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.status(500).json({ 
          error: 'Tabela bancos não existe no banco de dados',
          details: 'Execute o script SQL: backend/database/schema-novas-tabelas.sql no Supabase',
          code: error.code
        });
      }
      throw error;
    }

    console.log('✅ Banco criado com sucesso:', novoBanco.id);
    res.status(201).json(novoBanco);
  } catch (error) {
    console.error('❌ Erro ao criar banco:', error);
    console.error('   Stack:', error.stack);
    console.error('   Error object:', JSON.stringify(error, null, 2));
    next(error);
  }
});

// Atualizar banco
router.put('/:id', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = getUserId(req);
    const { data: bancoExistente, error: checkError } = await supabase
      .from('bancos')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (checkError || !bancoExistente) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }

    const { nome, tipo, saldo_atual, cor, observacoes } = req.body;

    // Garantir que saldo_atual seja um número válido se fornecido
    let saldoAtualNum = undefined
    if (saldo_atual !== undefined && saldo_atual !== null && saldo_atual !== '') {
      saldoAtualNum = parseFloat(saldo_atual)
      if (isNaN(saldoAtualNum)) {
        return res.status(400).json({ error: 'Saldo atual deve ser um número válido' })
      }
    }

    const updateData = {
      nome: nome.trim(),
      tipo: tipo || 'banco',
      cor: cor || '#6366f1',
      observacoes: observacoes?.trim() || null,
      updated_at: new Date().toISOString()
    }

    if (saldoAtualNum !== undefined) {
      updateData.saldo_atual = saldoAtualNum
    }

    const { data: bancoAtualizado, error } = await supabase
      .from('bancos')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(bancoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar banco:', error);
    next(error);
  }
});

// Deletar banco
router.delete('/:id', async (req, res, next) => {
  try {
    // Verificar se há cartões associados
    const { data: cartoes, error: cartoesError } = await supabase
      .from('cartoes')
      .select('id')
      .eq('banco_id', req.params.id)
      .limit(1);

    if (cartoes && cartoes.length > 0) {
      return res.status(400).json({ error: 'Não é possível deletar banco com cartões associados' });
    }

    const userId = getUserId(req);
    const { data: bancoExistente, error: checkError } = await supabase
      .from('bancos')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (checkError || !bancoExistente) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }

    const { error } = await supabase
      .from('bancos')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Banco deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar banco:', error);
    next(error);
  }
});

// ========== ROTAS DE CARTÕES ==========

// Listar cartões
router.get('/:bancoId/cartoes', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    // Verificar se banco pertence ao usuário
    const { data: banco, error: bancoError } = await supabase
      .from('bancos')
      .select('id')
      .eq('id', req.params.bancoId)
      .eq('user_id', userId)
      .single();

    if (bancoError || !banco) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }

    const { data: cartoes, error } = await supabase
      .from('cartoes')
      .select('*')
      .eq('banco_id', req.params.bancoId)
      .eq('user_id', userId)
      .order('nome', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(cartoes || []);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    next(error);
  }
});

// Criar cartão
router.post('/:bancoId/cartoes', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = getUserId(req);
    // Verificar se banco pertence ao usuário
    const { data: banco, error: bancoError } = await supabase
      .from('bancos')
      .select('id')
      .eq('id', req.params.bancoId)
      .eq('user_id', userId)
      .single();

    if (bancoError || !banco) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }

    const { nome, tipo, limite, dia_fechamento, dia_vencimento, cor, ativo } = req.body;

    const { data: novoCartao, error } = await supabase
      .from('cartoes')
      .insert([{
        user_id: userId,
        banco_id: parseInt(req.params.bancoId),
        nome: nome.trim(),
        tipo: tipo || 'credito',
        limite: limite ? parseFloat(limite) : null,
        dia_fechamento: dia_fechamento || null,
        dia_vencimento: dia_vencimento || null,
        cor: cor || '#818cf8',
        ativo: ativo !== undefined ? ativo : true
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(novoCartao);
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    next(error);
  }
});

// Atualizar cartão
router.put('/:bancoId/cartoes/:cartaoId', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = getUserId(req);
    const { nome, tipo, limite, dia_fechamento, dia_vencimento, cor, ativo } = req.body;

    const { data: cartaoAtualizado, error } = await supabase
      .from('cartoes')
      .update({
        nome: nome.trim(),
        tipo: tipo || 'credito',
        limite: limite ? parseFloat(limite) : null,
        dia_fechamento: dia_fechamento || null,
        dia_vencimento: dia_vencimento || null,
        cor: cor || '#818cf8',
        ativo: ativo !== undefined ? ativo : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.cartaoId)
      .eq('banco_id', req.params.bancoId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !cartaoAtualizado) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    res.json(cartaoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    next(error);
  }
});

// Deletar cartão
router.delete('/:bancoId/cartoes/:cartaoId', async (req, res, next) => {
  try {
    // Verificar se há transações associadas
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes')
      .select('id')
      .eq('cartao_id', req.params.cartaoId)
      .limit(1);

    if (transacoes && transacoes.length > 0) {
      return res.status(400).json({ error: 'Não é possível deletar cartão com transações associadas' });
    }

    const userId = getUserId(req);
    const { error } = await supabase
      .from('cartoes')
      .delete()
      .eq('id', req.params.cartaoId)
      .eq('banco_id', req.params.bancoId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Cartão deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    next(error);
  }
});

export default router;

