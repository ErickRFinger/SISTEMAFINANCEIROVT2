import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validação básica
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)

    try {
      const result = await login(email.trim(), senha)

      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'Erro ao fazer login. Tente novamente.')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      console.error('Erro no login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Entrar</h1>
        <p className="auth-subtitle">Acesse sua conta</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
            />
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-footer">
          Não tem uma conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}

