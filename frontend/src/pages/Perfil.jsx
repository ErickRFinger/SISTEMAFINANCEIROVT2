import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Perfil.css'

export default function Perfil() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState({ ganho_fixo_mensal: 0, nome: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    carregarPerfil()
  }, [])

  const carregarPerfil = async () => {
    try {
      const response = await api.get('/perfil')
      setPerfil(response.data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGanhoFixo = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/perfil/ganho-fixo', {
        ganho_fixo_mensal: perfil.ganho_fixo_mensal
      })
      setPerfil(response.data)
      setMessage({ type: 'success', text: 'Ganho fixo atualizado com sucesso!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao atualizar ganho fixo'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNome = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/perfil/nome', {
        nome: perfil.nome
      })
      setPerfil(response.data)
      setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao atualizar nome'
      })
    } finally {
      setSaving(false)
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="container perfil-container">
      {message.text && (
        <div className={`message-banner ${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.5rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
          {message.text}
        </div>
      )}

      {/* HERO SECTION */}
      <div className="perfil-hero">
        <div className="perfil-cover"></div>
        <div className="perfil-avatar-wrapper">
          <div className="perfil-avatar">
            {perfil.nome ? perfil.nome.charAt(0).toUpperCase() : '👤'}
          </div>
        </div>

        <div className="perfil-header-info">
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>{perfil.nome || 'Usuário'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{perfil.email || user?.email}</p>
          </div>
          <div className="perfil-badges">
            <span className="badge pro">✨ Premium</span>
            <span className="badge member">📅 Membro desde 2024</span>
          </div>
        </div>
      </div>

      {/* SETTINGS GRID */}
      <div className="settings-grid">

        {/* CARD RENDA */}
        <div className="settings-card">
          <div className="card-icon-header">💰</div>
          <h3>Renda Fixa Mensal</h3>
          <p>Defina sua renda base para que o sistema calcule seu saldo disponível automaticamente.</p>

          <form onSubmit={handleGanhoFixo}>
            <div className="form-floating">
              <label htmlFor="ganho_fixo">Valor Mensal (R$)</label>
              <input
                type="number"
                id="ganho_fixo"
                step="0.01"
                min="0"
                value={perfil.ganho_fixo_mensal || ''}
                onChange={(e) => setPerfil({ ...perfil, ganho_fixo_mensal: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            {perfil.ganho_fixo_mensal > 0 && (
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#34d399' }}>
                ✅ Renda ativa: {formatarMoeda(perfil.ganho_fixo_mensal)}
              </div>
            )}
            <button type="submit" className="btn-primary full-width" disabled={saving}>
              {saving ? 'Atualizando...' : 'Confirmar Renda'}
            </button>
          </form>
        </div>

        {/* CARD CONTA */}
        <div className="settings-card">
          <div className="card-icon-header">⚙️</div>
          <h3>Dados da Conta</h3>
          <p>Gerencie como você é identificado dentro da plataforma.</p>

          <form onSubmit={handleNome}>
            <div className="form-floating">
              <label htmlFor="nome">Nome de Exibição</label>
              <input
                type="text"
                id="nome"
                value={perfil.nome || ''}
                onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="form-floating">
              <label>Email (Não editável)</label>
              <input
                type="email"
                value={perfil.email || user?.email || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
            <button type="submit" className="btn-secondary full-width" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

      </div>

      {/* SUPPORT & TIPS */}
      <div className="settings-grid">
        <div className="support-section">
          <h3>Precisa de Ajuda?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Fale diretamente com nosso time de suporte.</p>

          <div className="support-buttons">
            <a href="https://instagram.com/visualtechgba" target="_blank" className="support-btn">
              <div className="brand-icon insta">📸</div>
              <div>
                <strong>Instagram</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>@visualtechgba</div>
              </div>
            </a>
            <a href="https://wa.me/49920014159" target="_blank" className="support-btn">
              <div className="brand-icon whats">💬</div>
              <div>
                <strong>WhatsApp</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Suporte Rápido</div>
              </div>
            </a>
          </div>
        </div>

        <div className="settings-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3>💡 Dicas do Sistema</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.2rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '0.5rem' }}>Mantenha sua <strong>Renda Fixa</strong> atualizada para previsões corretas.</li>
            <li style={{ marginBottom: '0.5rem' }}>Use o modo <strong>Privacidade</strong> (olho no painel) ao usar em público.</li>
            <li>Confira a aba <strong>Metas</strong> para gamificar suas economias.</li>
          </ul>
        </div>
      </div>

    </div>
  )
}

