import nodemailer from 'nodemailer';

// Configuração do transporter (exemplo com Gmail)
// Para usar Gmail, você precisa gerar uma "Senha de App" em https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ [MOCK EMAIL] Credenciais de email não configuradas.');
            console.log(`📨 Para: ${to}`);
            console.log(`📝 Assunto: ${subject}`);
            console.log(`📄 Conteúdo: ${html}`);
            console.log('---------------------------------------------------');
            return true; // Simula sucesso
        }

        const info = await transporter.sendMail({
            from: `"Financeiro Visual" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log('✅ Email enviado:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return false;
    }
};
