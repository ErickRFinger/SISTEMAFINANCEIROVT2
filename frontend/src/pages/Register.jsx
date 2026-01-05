import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [tipoConta, setTipoConta] = useState('pessoal')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [strength, setStrength] = useState(0)

  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    calculateStrength(senha)
  }, [senha])

  const calculateStrength = (password) => {
    let score = 0
    if (!password) return setStrength(0)

    if (password.length >= 8) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1

    setStrength(score)
  }

  const getStrengthColor = () => {
    if (strength <= 2) return 'var(--danger)' // Fraca
    if (strength <= 4) return 'var(--warning)' // Média
    return 'var(--success)' // Forte
  }

  const getStrengthText = () => {
    if (strength === 0) return ''
    if (strength <= 2) return 'Fraca'
    if (strength <= 4) return 'Média'
    return 'Forte'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validação básica
    if (!nome || !email || !senha) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (strength < 3) {
      setError('Sua senha é muito fraca. Adicione letras maiúsculas, números ou símbolos.')
      return
    }

    setLoading(true)

    try {
      const result = await register(nome.trim(), email.trim(), senha, tipoConta)

      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'Erro ao criar conta. Tente novamente.')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      console.error('Erro no registro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Criar Conta</h1>
        <p className="auth-subtitle">Comece a controlar suas finanças</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Seu nome"
              minLength={2}
            />
          </div>

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
            <label>Tipo de Conta</label>
            <div className="account-type-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`type-btn ${tipoConta === 'pessoal' ? 'active' : ''}`}
                onClick={() => setTipoConta('pessoal')}
                style={{
                  padding: '10px',
                  border: tipoConta === 'pessoal' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  background: tipoConta === 'pessoal' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-secondary)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                👤 Pessoal
              </button>
              <button
                type="button"
                className={`type-btn ${tipoConta === 'empresarial' ? 'active' : ''}`}
                onClick={() => setTipoConta('empresarial')}
                style={{
                  padding: '10px',
                  border: tipoConta === 'empresarial' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  background: tipoConta === 'empresarial' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-secondary)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🏢 Empresarial
              </button>
              <button
                type="button"
                className={`type-btn ${tipoConta === 'hibrido' ? 'active' : ''}`}
                onClick={() => setTipoConta('hibrido')}
                style={{
                  padding: '10px',
                  border: tipoConta === 'hibrido' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  background: tipoConta === 'hibrido' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-secondary)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🚀 Ambos
              </button>
            </div>
            <small style={{ display: 'block', marginTop: '5px', color: 'var(--text-muted)' }}>
              {tipoConta === 'pessoal' && 'Para gerenciar suas finanças pessoais.'}
              {tipoConta === 'empresarial' && 'Para gerenciar sua empresa (estoque, funcionários, clientes).'}
              {tipoConta === 'hibrido' && 'Tudo em um só lugar: Pessoal + Empresarial.'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                disabled={loading}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>

            {/* Medidor de Força */}
            {senha && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  height: '4px',
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(strength / 5) * 100}%`,
                    background: getStrengthColor(),
                    transition: 'all 0.3s'
                  }} />
                </div>
                <small style={{ color: getStrengthColor(), marginTop: '0.2rem', display: 'block' }}>
                  Força: {getStrengthText()}
                </small>
              </div>
            )}
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Use letras maiúsculas, números e símbolos
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-footer">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}

