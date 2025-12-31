import { useState, useEffect } from 'react'
import api from '../services/api'
import './GastosRecorrentes.css'

export default function GastosRecorrentes() {
  const [gastos, setGastos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [bancos, setBancos] = useState([])
  const [cartoes, setCartoes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dia_vencimento: '',
    tipo: 'mensal',
    categoria_id: '',
    banco_id: '',
    cartao_id: '',
    ativo: true,
    observacoes: ''
  })

  useEffect(() => {
    carregarDados()
  }, [filtroAtivo])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [gastosRes, categoriasRes, bancosRes] = await Promise.all([
        api.get('/gastos-recorrentes', { params: filtroAtivo ? { ativo: filtroAtivo } : {} }),
        api.get('/categorias'),
        api.get('/bancos')
      ])

      setGastos(gastosRes.data)
      setCategorias(categoriasRes.data)
      setBancos(bancosRes.data)

      // Carregar cartões de cada banco
      const cartoesPorBanco = {}
      for (const banco of bancosRes.data) {
        try {
          const cartoesRes = await api.get(`/bancos/${banco.id}/cartoes`)
          cartoesPorBanco[banco.id] = cartoesRes.data
        } catch (error) {
          cartoesPorBanco[banco.id] = []
        }
      }
      setCartoes(cartoesPorBanco)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/gastos-recorrentes/${editing.id}`, formData)
      } else {
        await api.post('/gastos-recorrentes', formData)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      await carregarDados()
      alert(editing ? 'Gasto recorrente atualizado com sucesso!' : 'Gasto recorrente criado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar gasto recorrente:', error)
      alert(error.response?.data?.error || 'Erro ao salvar gasto recorrente')
    }
  }

  const handleEdit = (gasto) => {
    setEditing(gasto)
    setFormData({
      descricao: gasto.descricao,
      valor: gasto.valor,
      dia_vencimento: gasto.dia_vencimento,
      tipo: gasto.tipo,
      categoria_id: gasto.categoria_id || '',
      banco_id: gasto.banco_id || '',
      cartao_id: gasto.cartao_id || '',
      ativo: gasto.ativo,
      observacoes: gasto.observacoes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este gasto recorrente?')) return

    try {
      await api.delete(`/gastos-recorrentes/${id}`)
      await carregarDados()
      alert('Gasto recorrente deletado com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar gasto recorrente:', error)
      alert(error.response?.data?.error || 'Erro ao deletar gasto recorrente')
    }
  }

  const handleGerarTransacao = async (gasto) => {
    if (!confirm(`Gerar transação para "${gasto.descricao}" no valor de ${formatarMoeda(gasto.valor)}?`)) return

    try {
      await api.post(`/gastos-recorrentes/${gasto.id}/gerar-transacao`)
      alert('Transação gerada com sucesso!')
      window.dispatchEvent(new CustomEvent('transacaoCriada'))
    } catch (error) {
      console.error('Erro ao gerar transação:', error)
      alert(error.response?.data?.error || 'Erro ao gerar transação')
    }
  }

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      dia_vencimento: '',
      tipo: 'mensal',
      categoria_id: '',
      banco_id: '',
      cartao_id: '',
      ativo: true,
      observacoes: ''
    })
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const tiposRecorrencia = [
    { value: 'mensal', label: '📅 Mensal' },
    { value: 'semanal', label: '📆 Semanal' },
    { value: 'quinzenal', label: '🗓️ Quinzenal' },
    { value: 'anual', label: '📆 Anual' }
  ]

  const getCartoesDoBanco = () => {
    if (!formData.banco_id) return []
    return cartoes[formData.banco_id] || []
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>🔄 Gastos Recorrentes</h2>
          <p className="page-subtitle">Gerencie suas despesas que se repetem mensalmente</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary"
        >
          + Novo Gasto Recorrente
        </button>
      </div>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Filtrar por status</label>
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {gastos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <p>Nenhum gasto recorrente cadastrado</p>
            <button
              onClick={() => {
                setEditing(null)
                resetForm()
                setShowModal(true)
              }}
              className="btn-primary"
            >
              Criar Primeiro Gasto Recorrente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {gastos.map((gasto) => (
            <div key={gasto.id} className="card gasto-card">
              <div className="gasto-header">
                <div>
                  <h3>{gasto.descricao}</h3>
                  <p className="gasto-valor">{formatarMoeda(gasto.valor)}</p>
                </div>
                <div className={`gasto-status ${gasto.ativo ? 'ativo' : 'inativo'}`}>
                  {gasto.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                </div>
              </div>

              <div className="gasto-info">
                <div className="gasto-info-item">
                  <span className="gasto-info-label">Tipo:</span>
                  <span>{tiposRecorrencia.find(t => t.value === gasto.tipo)?.label || gasto.tipo}</span>
                </div>
                <div className="gasto-info-item">
                  <span className="gasto-info-label">Vencimento:</span>
                  <span>Dia {gasto.dia_vencimento}</span>
                </div>
                {gasto.categoria_nome && (
                  <div className="gasto-info-item">
                    <span className="gasto-info-label">Categoria:</span>
                    <span style={{ color: gasto.categoria_cor || '#6366f1' }}>
                      {gasto.categoria_nome}
                    </span>
                  </div>
                )}
                {gasto.banco_nome && (
                  <div className="gasto-info-item">
                    <span className="gasto-info-label">Banco:</span>
                    <span>{gasto.banco_nome}</span>
                  </div>
                )}
                {gasto.cartao_nome && (
                  <div className="gasto-info-item">
                    <span className="gasto-info-label">Cartão:</span>
                    <span>{gasto.cartao_nome}</span>
                  </div>
                )}
                {gasto.observacoes && (
                  <div className="gasto-info-item">
                    <span className="gasto-info-label">Observações:</span>
                    <span>{gasto.observacoes}</span>
                  </div>
                )}
              </div>

              <div className="gasto-actions">
                {gasto.ativo && (
                  <button
                    onClick={() => handleGerarTransacao(gasto)}
                    className="btn-success btn-sm"
                  >
                    💳 Gerar Transação
                  </button>
                )}
                <button
                  onClick={() => handleEdit(gasto)}
                  className="btn-secondary btn-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(gasto.id)}
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
            <h3>{editing ? 'Editar Gasto Recorrente' : 'Novo Gasto Recorrente'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  placeholder="Ex: Aluguel, Internet, etc."
                />
              </div>

              <div className="form-group">
                <label>Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Dia de Vencimento (1-31) *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_vencimento}
                  onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
                  required
                  placeholder="Ex: 5"
                />
              </div>

              <div className="form-group">
                <label>Tipo de Recorrência</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  {tiposRecorrencia.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                >
                  <option value="">Sem categoria</option>
                  {categorias.filter(c => c.tipo === 'despesa').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Banco</label>
                <select
                  value={formData.banco_id}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      banco_id: e.target.value,
                      cartao_id: '' // Limpar cartão quando mudar banco
                    })
                  }}
                >
                  <option value="">Sem banco</option>
                  {bancos.map((banco) => (
                    <option key={banco.id} value={banco.id}>
                      {banco.nome}
                    </option>
                  ))}
                </select>
              </div>

              {formData.banco_id && (
                <div className="form-group">
                  <label>Cartão</label>
                  <select
                    value={formData.cartao_id}
                    onChange={(e) => setFormData({ ...formData, cartao_id: e.target.value })}
                  >
                    <option value="">Sem cartão</option>
                    {getCartoesDoBanco().map((cartao) => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre o gasto..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  {' '}Gasto Ativo
                </label>
              </div>

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

