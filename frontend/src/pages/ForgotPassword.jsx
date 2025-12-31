import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './Auth.css'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        try {
            const response = await api.post('/password/forgot-password', { email })
            setMessage(response.data.message)
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao processar solicitação. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Recuperar Senha</h1>
                <p className="auth-subtitle">Digite seu email para receber o link</p>

                {message && <div className="success">{message}</div>}
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

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Link'}
                    </button>
                </form>

                <p className="auth-footer">
                    Lembrou a senha? <Link to="/login">Voltar para Login</Link>
                </p>
            </div>
        </div>
    )
}
