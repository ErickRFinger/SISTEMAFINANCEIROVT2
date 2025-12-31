import { useState, useEffect } from 'react'
import api from '../services/api'
import './Categorias.css'

export default function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'despesa',
    cor: '#6366f1'
  })

  useEffect(() => {
    carregarCategorias()
  }, [filtroTipo])

  const carregarCategorias = async () => {
    try {
      setLoading(true)
      const params = filtroTipo ? { tipo: filtroTipo } : {}
      const response = await api.get('/categorias', { params })
      setCategorias(response.data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/categorias/${editing.id}`, formData)
      } else {
        await api.post('/categorias', formData)
      }
      setShowModal(false)
      setEditing(null)
      setFormData({
        nome: '',
        tipo: 'despesa',
        cor: '#6366f1'
      })
      carregarCategorias()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert(error.response?.data?.error || 'Erro ao salvar categoria')
    }
  }

  const handleEdit = (categoria) => {
    setEditing(categoria)
    setFormData({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return
    
    try {
      await api.delete(`/categorias/${id}`)
      carregarCategorias()
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      alert(error.response?.data?.error || 'Erro ao deletar categoria')
    }
  }

  const coresPredefinidas = [
    '#6366f1', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'
  ]

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>🏷️ Categorias</h2>
          <p className="page-subtitle">Organize suas transações por categorias</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({
              nome: '',
              tipo: 'despesa',
              cor: '#6366f1'
            })
            setShowModal(true)
          }}
          className="btn-primary"
        >
          + Nova Categoria
        </button>
      </div>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Filtrar por tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : categorias.length === 0 ? (
        <div className="card">
          <p className="text-center" style={{ color: 'var(--text-light)', padding: '2rem' }}>
            Nenhuma categoria encontrada
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="card categoria-card">
              <div
                className="categoria-color"
                style={{ backgroundColor: categoria.cor }}
              />
              <div className="categoria-content">
                <h3>{categoria.nome}</h3>
                <span className={`categoria-tipo ${categoria.tipo}`}>
                  {categoria.tipo === 'receita' ? '💰 Receita' : '💸 Despesa'}
                </span>
              </div>
              <div className="categoria-actions">
                <button
                  onClick={() => handleEdit(categoria)}
                  className="btn-secondary btn-sm btn-icon"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(categoria.id)}
                  className="btn-danger btn-sm btn-icon"
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar' : 'Nova'} Categoria</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cor</label>
                <div className="color-picker">
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    style={{ width: '100%', height: '50px', cursor: 'pointer' }}
                  />
                  <div className="color-presets">
                    {coresPredefinidas.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className="color-preset"
                        style={{ backgroundColor: cor }}
                        onClick={() => setFormData({ ...formData, cor })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditing(null)
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

