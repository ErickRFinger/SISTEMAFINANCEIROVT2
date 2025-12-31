import { useState, useEffect } from 'react'
import api from '../services/api'
import { format } from 'date-fns'
import './Metas.css'

export default function Metas() {
  const [metas, setMetas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor_meta: '',
    valor_atual: '0',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    categoria_id: '',
    status: 'ativa'
  })

  useEffect(() => {
    carregarCategorias()
    carregarMetas()
  }, [filtroStatus])

  const carregarMetas = async () => {
    try {
      setLoading(true)
      const params = filtroStatus ? { status: filtroStatus } : {}
      const response = await api.get('/metas', { params })
      setMetas(response.data)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/categorias')
      setCategorias(response.data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        valor_meta: parseFloat(formData.valor_meta) || 0,
        valor_atual: parseFloat(formData.valor_atual) || 0,
        categoria_id: formData.categoria_id || null
      }

      // Validar valores
      if (dataToSend.valor_meta <= 0) {
        alert('O valor da meta deve ser maior que zero')
        return
      }

      if (editing) {
        await api.put(`/metas/${editing.id}`, dataToSend)
      } else {
        await api.post('/metas', dataToSend)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      await carregarMetas()
      alert(editing ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Erro ao salvar meta'
      alert(errorMessage)
    }
  }

  const handleEdit = (meta) => {
    setEditing(meta)
    setFormData({
      titulo: meta.titulo,
      descricao: meta.descricao || '',
      valor_meta: meta.valor_meta,
      valor_atual: meta.valor_atual,
      data_inicio: meta.data_inicio,
      data_fim: meta.data_fim,
      categoria_id: meta.categoria_id || '',
      status: meta.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta meta?')) return

    try {
      await api.delete(`/metas/${id}`)
      await carregarMetas()
      alert('Meta deletada com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
      alert(error.response?.data?.error || 'Erro ao deletar meta')
    }
  }

  const handleAdicionarValor = async (meta) => {
    const valor = prompt(`Adicionar valor à meta "${meta.titulo}":`)
    if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
      alert('Valor inválido')
      return
    }

    try {
      await api.post(`/metas/${meta.id}/adicionar`, { valor: parseFloat(valor) })
      await carregarMetas()
      alert('Valor adicionado com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar valor:', error)
      alert(error.response?.data?.error || 'Erro ao adicionar valor')
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      valor_meta: '',
      valor_atual: '0',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      categoria_id: '',
      status: 'ativa'
    })
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data) => {
    try {
      return format(new Date(data), "dd/MM/yyyy")
    } catch {
      return data
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>🎯 Metas</h2>
          <p className="page-subtitle">Defina e acompanhe suas metas financeiras</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary"
        >
          + Nova Meta
        </button>
      </div>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Filtrar por status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="ativa">Ativas</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {metas.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>Nenhuma meta encontrada</p>
            <button
              onClick={() => {
                setEditing(null)
                resetForm()
                setShowModal(true)
              }}
              className="btn-primary"
            >
              Criar Primeira Meta
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {metas.map((meta) => (
            <div key={meta.id} className="card meta-card">
              <div className="meta-header">
                <div>
                  <h3>{meta.titulo}</h3>
                  {meta.descricao && <p className="meta-descricao">{meta.descricao}</p>}
                </div>
                <div className={`meta-status ${meta.status}`}>
                  {meta.status === 'ativa' ? '🟢' : meta.status === 'concluida' ? '✅' : '🔴'}
                  <span>{meta.status}</span>
                </div>
              </div>

              <div className="meta-progress">
                <div className="meta-progress-bar">
                  <div
                    className="meta-progress-fill"
                    style={{ width: `${Math.min(meta.progresso || 0, 100)}%` }}
                  />
                </div>
                <div className="meta-progress-text">
                  <span>{formatarMoeda(meta.valor_atual)}</span>
                  <span>de {formatarMoeda(meta.valor_meta)}</span>
                  <span className="meta-progress-percent">{Math.round(meta.progresso || 0)}%</span>
                </div>
              </div>

              <div className="meta-info">
                <div className="meta-info-item">
                  <span className="meta-info-label">Início:</span>
                  <span>{formatarData(meta.data_inicio)}</span>
                </div>
                <div className="meta-info-item">
                  <span className="meta-info-label">Fim:</span>
                  <span>{formatarData(meta.data_fim)}</span>
                </div>
                {meta.categoria_nome && (
                  <div className="meta-info-item">
                    <span className="meta-info-label">Categoria:</span>
                    <span
                      className="meta-categoria"
                      style={{ color: meta.categoria_cor || '#6366f1' }}
                    >
                      {meta.categoria_nome}
                    </span>
                  </div>
                )}
              </div>

              <div className="meta-actions">
                <button
                  onClick={() => handleAdicionarValor(meta)}
                  className="btn-primary btn-sm"
                  disabled={meta.status !== 'ativa'}
                >
                  + Adicionar Valor
                </button>
                <button
                  onClick={() => handleEdit(meta)}
                  className="btn-secondary btn-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(meta.id)}
                  className="btn-danger btn-sm"
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar Meta' : 'Nova Meta'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  placeholder="Ex: Comprar um carro"
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da meta..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Valor da Meta (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor_meta}
                  onChange={(e) => setFormData({ ...formData, valor_meta: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Valor Atual (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_atual}
                  onChange={(e) => setFormData({ ...formData, valor_atual: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Data de Início *</label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Data de Fim *</label>
                <input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                >
                  <option value="">Sem categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              {editing && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ativa">Ativa</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditing(null)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

