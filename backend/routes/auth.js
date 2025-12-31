import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import supabase from '../database/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Rate limiter de segurança para evitar força bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 tentativas por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar limiter nas rotas de auth
router.use(authLimiter);

// Validação de senha forte
const senhaValidation = body('senha')
  .isLength({ min: 8 })
  .withMessage('Senha deve ter pelo menos 8 caracteres')
  .matches(/[A-Z]/)
  .withMessage('Senha deve conter pelo menos uma letra maiúscula')
  .matches(/[a-z]/)
  .withMessage('Senha deve conter pelo menos uma letra minúscula')
  .matches(/[0-9]/)
  .withMessage('Senha deve conter pelo menos um número')
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage('Senha deve conter pelo menos um caractere especial (!@#$%...)');

// Registrar novo usuário
router.post('/register', [
  body('nome').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  senhaValidation
], asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Normalizar email
    const emailNormalizado = email.toLowerCase().trim();

    // Verificar se email já existe
    const { data: userExists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar email:', checkError);
      return res.status(500).json({ error: 'Erro ao verificar email' });
    }

    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12); // Aumentado fator de custo para 12

    // Inserir usuário
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{ nome: nome.trim(), email: emailNormalizado, senha: senhaHash }])
      .select()
      .single();

    if (userError) {
      console.error('Erro ao inserir usuário:', userError);
      console.error('Detalhes do erro:', JSON.stringify(userError, null, 2));

      if (userError.code === '23505' || userError.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      if (userError.code === '42501' || userError.message?.includes('row-level security')) {
        return res.status(500).json({
          error: 'Erro de permissão no banco de dados. Verifique as configurações do RLS no Supabase.'
        });
      }

      return res.status(500).json({
        error: `Erro ao registrar usuário: ${userError.message || 'Erro desconhecido'}`
      });
    }

    // Criar categorias padrão mais completas
    const categoriasPadrao = [
      // Receitas
      { user_id: newUser.id, nome: 'Salário', tipo: 'receita', cor: '#10b981' },
      { user_id: newUser.id, nome: 'Freelance', tipo: 'receita', cor: '#3b82f6' },
      { user_id: newUser.id, nome: 'Investimentos', tipo: 'receita', cor: '#06b6d4' },
      { user_id: newUser.id, nome: 'Vendas', tipo: 'receita', cor: '#8b5cf6' },
      { user_id: newUser.id, nome: 'Outras Receitas', tipo: 'receita', cor: '#14b8a6' },
      // Despesas
      { user_id: newUser.id, nome: 'Alimentação', tipo: 'despesa', cor: '#ef4444' },
      { user_id: newUser.id, nome: 'Transporte', tipo: 'despesa', cor: '#f59e0b' },
      { user_id: newUser.id, nome: 'Moradia', tipo: 'despesa', cor: '#8b5cf6' },
      { user_id: newUser.id, nome: 'Saúde', tipo: 'despesa', cor: '#ec4899' },
      { user_id: newUser.id, nome: 'Educação', tipo: 'despesa', cor: '#6366f1' },
      { user_id: newUser.id, nome: 'Lazer', tipo: 'despesa', cor: '#f97316' },
      { user_id: newUser.id, nome: 'Compras', tipo: 'despesa', cor: '#e11d48' },
      { user_id: newUser.id, nome: 'Contas', tipo: 'despesa', cor: '#dc2626' },
      { user_id: newUser.id, nome: 'Assinaturas', tipo: 'despesa', cor: '#be185d' },
      { user_id: newUser.id, nome: 'Outras Despesas', tipo: 'despesa', cor: '#6b7280' }
    ];

    await supabase.from('categorias').insert(categoriasPadrao);

    // Verificar se JWT_SECRET está configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET não configurado!');
      throw new Error('Erro de configuração do servidor. JWT_SECRET não está definido.');
    }

    // Gerar token
    const token = jwt.sign(
      { userId: newUser.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    console.error('Stack:', error.stack);

    // Garantir que sempre retornamos uma string de erro
    let errorMessage = 'Erro ao registrar usuário';

    if (error.message) {
      errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Passar o erro para o middleware de tratamento de erros
    throw new Error(errorMessage);
  }
}));

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError) {
      console.error('❌ [AUTH] Erro ao buscar usuário no Supabase:', JSON.stringify(userError, null, 2));

      // Se não encontrou o usuário, retorna erro genérico por segurança
      if (userError.code === 'PGRST116') {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      return res.status(500).json({
        error: `Erro ao buscar usuário: ${userError.message || 'Erro desconhecido'}`
      });
    }

    if (!user) {
      console.error('❌ [AUTH] Usuário não encontrado, mas sem erro explícito (PGRST116 não capturado?)');
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar senha
    if (!user.senha) {
      console.error('❌ [AUTH] Usuário encontrado mas sem hash de senha no banco');
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      console.warn('⚠️ [AUTH] Senha inválida para usuário:', email);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar se JWT_SECRET está configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ [AUTH] JWT_SECRET não configurado no servidor!');
      // Retornar 500 explícito para sabermos que é config
      return res.status(500).json({
        error: 'Erro interno de configuração: JWT_SECRET ausente'
      });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ [AUTH] Login realizado com sucesso para:', email);

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ [AUTH] Erro crítico (catch) no login:', error);
    console.error('   Stack:', error.stack);

    let errorMessage = 'Erro interno do servidor';
    if (error.message) errorMessage = error.message;

    res.status(500).json({ error: errorMessage });
  }
}));

// Verificar token
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ valid: false });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nome, email')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ valid: false });
    }

    res.json({ valid: true, user });
  });
});

export default router;

