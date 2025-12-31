import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import supabase from '../database/db.js';
import { sendEmail } from '../services/email.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Solicitar recuperação de senha
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se usuário existe
    const { data: user } = await supabase
        .from('users')
        .select('id, nome')
        .eq('email', email.toLowerCase().trim())
        .single();

    if (!user) {
        // Por segurança, não confirmamos se o email existe ou não, apenas dizemos que enviamos
        return res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' });
    }

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    const { error } = await supabase
        .from('password_resets')
        .insert([{
            email: email.toLowerCase().trim(),
            token,
            expires_at: expiresAt
        }]);

    if (error) {
        console.error('Erro ao salvar token:', error);
        return res.status(500).json({ error: 'Erro ao processar solicitação' });
    }

    // Link de recuperação
    const frontendUrl = process.env.FRONTEND_URL || req.headers.host.replace('3001', '3000');
    // Garantir protocolo https em produção
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    // Se FRONTEND_URL não tiver protocolo, adicionar
    const baseUrl = frontendUrl.startsWith('http') ? frontendUrl : `${protocol}://${frontendUrl}`;

    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Enviar email
    const html = `
    <h3>Recuperação de Senha</h3>
    <p>Olá, ${user.nome}!</p>
    <p>Você solicitou a recuperação de senha da sua conta no Financeiro Visual.</p>
    <p>Clique no link abaixo para redefinir sua senha:</p>
    <a href="${resetLink}" style="padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
    <p>Este link expira em 1 hora.</p>
    <p>Se você não solicitou isso, ignore este email.</p>
  `;

    await sendEmail(email, 'Recuperação de Senha - Financeiro Visual', html);

    res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' });
}));

// Redefinir senha
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { token, senha } = req.body;

    if (!token || !senha) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (senha.length < 8) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
    }

    // Verificar token válido e não expirado
    const { data: resetRecord, error: fetchError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (fetchError || !resetRecord) {
        return res.status(400).json({ error: 'Link inválido ou expirado' });
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Atualizar senha do usuário
    const { error: updateError } = await supabase
        .from('users')
        .update({ senha: senhaHash })
        .eq('email', resetRecord.email);

    if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar senha' });
    }

    // Marcar token como usado
    await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', resetRecord.id);

    res.json({ message: 'Senha atualizada com sucesso! Agora você pode fazer login.' });
}));

export default router;
