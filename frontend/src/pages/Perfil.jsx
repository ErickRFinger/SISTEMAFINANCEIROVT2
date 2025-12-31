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

      {/* Header com Avatar */}
      <div className="perfil-header-section">
        <div className="perfil-header-bg"></div>
        <div className="perfil-avatar-wrapper">
          <div className="perfil-avatar">
            {perfil.nome ? perfil.nome.charAt(0).toUpperCase() : '👤'}
          </div>
        </div>
        <div className="perfil-info">
          <h2 className="perfil-name">{perfil.nome || 'Usuário'}</h2>
          <p className="perfil-email">{perfil.email || user?.email}</p>
        </div>
      </div>

      <div className="config-grid">
        {/* Ganho Fixo */}
        <div className="config-card">
          <div className="config-header">
            <div className="config-icon">💰</div>
            <div>
              <h3>Renda Mensal Fixa</h3>
              <p className="form-hint" style={{ margin: 0 }}>Base para cálculos de orçamento</p>
            </div>
          </div>

          <form onSubmit={handleGanhoFixo}>
            <div className="form-group">
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
              {perfil.ganho_fixo_mensal > 0 && (
                <p className="form-hint" style={{ color: 'var(--success)', fontWeight: '500' }}>
                  Ativo: {formatarMoeda(perfil.ganho_fixo_mensal)}
                </p>
              )}
            </div>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Salvando...' : 'Atualizar Renda'}
            </button>
          </form>
        </div>

        {/* Dados Pessoais */}
        <div className="config-card">
          <div className="config-header">
            <div className="config-icon">👤</div>
            <div>
              <h3>Dados da Conta</h3>
              <p className="form-hint" style={{ margin: 0 }}>Identificação no sistema</p>
            </div>
          </div>

          <form onSubmit={handleNome}>
            <div className="form-group">
              <label htmlFor="nome">Nome de Exibição</label>
              <input
                type="text"
                id="nome"
                value={perfil.nome || ''}
                onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                placeholder="Como você quer ser chamado?"
                required
                minLength={2}
              />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="email">Email de Acesso</label>
              <input
                type="email"
                id="email"
                value={perfil.email || user?.email || ''}
                disabled
                className="input-disabled"
              />
            </div>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>

      {/* Dicas */}
      <div className="card tips-card">
        <h3>💡 Dicas do Sistema</h3>
        <ul className="tips-list">
          <li>
            <strong>Ganho Fixo:</strong> Definir sua renda mensal ajuda o sistema a calcular quanto sobra do seu dinheiro.
          </li>
          <li>
            <strong>Metas:</strong> Use o menu "Metas" para definir objetivos de economia (Carro, Casa, Viagem).
          </li>
          <li>
            <strong>Segurança:</strong> Nunca compartilhe sua senha. O suporte nunca pedirá sua senha.
          </li>
        </ul>
      </div>
    </div>
  )
}

