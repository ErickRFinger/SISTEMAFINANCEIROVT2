import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(`🔐 [AUTH] ${req.method} ${req.originalUrl || req.path}`);

  if (!token) {
    console.error('❌ [AUTH] Token não fornecido');
    return res.status(401).json({ error: 'Token de acesso não fornecido' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ [AUTH] JWT_SECRET não configurado no .env');
    return res.status(500).json({ error: 'Erro de configuração do servidor' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ [AUTH] Token inválido:', err.message);
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    console.log(`✅ [AUTH] Token valido para usuario: ${user.userId}`);
    req.user = user;
    next();
  });
};
