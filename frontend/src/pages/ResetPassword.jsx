import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import './Auth.css'

export default function ResetPassword() {
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!token) {
            setError('Token inválido ou ausente')
            return
        }

        if (senha !== confirmarSenha) {
            setError('As senhas não coincidem')
            return
        }

        if (senha.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres')
            return
        }

        setLoading(true)

        try {
            const response = await api.post('/password/reset-password', { token, senha })
            setMessage(response.data.message)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha. Link pode ter expirado.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Redefinir Senha</h1>
                <p className="auth-subtitle">Crie uma nova senha forte</p>

                {message && <div className="success">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="senha">Nova Senha</label>
                        <input
                            type="password"
                            id="senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            id="confirmarSenha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                            placeholder="Repita a senha"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to="/login">Voltar para Login</Link>
                </p>
            </div>
        </div>
    )
}
