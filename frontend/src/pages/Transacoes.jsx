import { useState, useEffect } from 'react'
import api from '../services/api'
import { format } from 'date-fns'
import ConfirmModal from '../components/ConfirmModal'
import './Transacoes.css'

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [bancos, setBancos] = useState([])
  const [cartoes, setCartoes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filtros, setFiltros] = useState({
    tipo: '',
    mes: String(new Date().getMonth() + 1).padStart(2, '0'),
    ano: String(new Date().getFullYear())
  })
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    data: new Date().toISOString().split('T')[0],
    categoria_id: '',
    banco_id: '',
    cartao_id: ''
  })

  useEffect(() => {
    carregarCategorias()
    carregarBancos()
  }, [])

  useEffect(() => {
    carregarTransacoes()
  }, [filtros])

  const carregarTransacoes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/transacoes', { params: filtros })
      setTransacoes(response.data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
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

  const carregarBancos = async () => {
    try {
      const response = await api.get('/bancos')
      setBancos(response.data)

      // Carregar cartões de cada banco
      const cartoesPorBanco = {}
      for (const banco of response.data) {
        try {
          const cartoesRes = await api.get(`/bancos/${banco.id}/cartoes`)
          cartoesPorBanco[banco.id] = cartoesRes.data
        } catch (error) {
          cartoesPorBanco[banco.id] = []
        }
      }
      setCartoes(cartoesPorBanco)
    } catch (error) {
      console.error('Erro ao carregar bancos:', error)
    }
  }

  const getCartoesDoBanco = () => {
    if (!formData.banco_id) return []
    return cartoes[formData.banco_id] || []
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/transacoes/${editing.id}`, formData)
      } else {
        await api.post('/transacoes', formData)
      }
      setShowModal(false)
      setEditing(null)
      setFormData({
        descricao: '',
        valor: '',
        tipo: 'despesa',
        data: new Date().toISOString().split('T')[0],
        categoria_id: '',
        banco_id: '',
        cartao_id: ''
      })
      await carregarTransacoes()

      // Disparar evento customizado para atualizar dashboard
      window.dispatchEvent(new CustomEvent('transacaoCriada'))

      // Mostrar mensagem de sucesso
      alert(editing ? 'Transação atualizada com sucesso!' : 'Transação criada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert(error.response?.data?.error || 'Erro ao salvar transação')
    }
  }

  const handleEdit = (transacao) => {
    setEditing(transacao)
    setFormData({
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo: transacao.tipo,
      data: transacao.data,
      categoria_id: transacao.categoria_id || '',
      banco_id: transacao.banco_id || '',
      cartao_id: transacao.cartao_id || ''
    })
    setShowModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      await api.delete(`/transacoes/${deleteId}`)
      setDeleteId(null)
      setShowDeleteModal(false)
      carregarTransacoes()
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
      alert('Erro ao deletar transação')
    }
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data) => {
    return format(new Date(data), "dd/MM/yyyy")
  }

  const categoriasFiltradas = categorias.filter(cat => !formData.tipo || cat.tipo === formData.tipo)

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>💳 Transações</h2>
          <p className="page-subtitle">Gerencie suas receitas e despesas</p>
        </div>
        <button onClick={() => {
          setEditing(null)
          setFormData({
            descricao: '',
            valor: '',
            tipo: 'despesa',
            data: new Date().toISOString().split('T')[0],
            categoria_id: ''
          })
          setShowModal(true)
        }} className="btn-primary">
          + Nova Transação
        </button>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Mês/Ano</label>
            <input
              type="month"
              value={`${filtros.ano}-${filtros.mes}`}
              onChange={(e) => {
                const [ano, mes] = e.target.value.split('-')
                setFiltros({ ...filtros, mes, ano })
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : transacoes.length === 0 ? (
        <div className="card">
          <p className="text-center" style={{ color: 'var(--text-light)', padding: '2rem' }}>
            Nenhuma transação encontrada
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="transacoes-table">
            {transacoes.map((transacao) => (
              <div key={transacao.id} className="transacao-row">
                <div className="transacao-info">
                  <div
                    className="transacao-categoria-badge"
                    style={{ backgroundColor: transacao.categoria_cor || '#6366f1' }}
                  >
                    {transacao.categoria_nome || 'Sem categoria'}
                  </div>
                  <div>
                    <p className="transacao-descricao">{transacao.descricao}</p>
                    <p className="transacao-data">{formatarData(transacao.data)}</p>
                    {(transacao.banco_nome || transacao.cartao_nome) && (
                      <p className="transacao-banco-cartao">
                        {transacao.banco_nome && `🏦 ${transacao.banco_nome}`}
                        {transacao.banco_nome && transacao.cartao_nome && ' • '}
                        {transacao.cartao_nome && `💳 ${transacao.cartao_nome}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="transacao-actions">
                  <span className={`transacao-valor ${transacao.tipo}`}>
                    {transacao.tipo === 'receita' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                  </span>
                  <button
                    onClick={() => handleEdit(transacao)}
                    className="btn-secondary btn-sm btn-icon"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(transacao.id)}
                    className="btn-danger btn-sm btn-icon"
                    title="Deletar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar' : 'Nova'} Transação</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value, categoria_id: '' })}
                  required
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                >
                  <option value="">Sem categoria</option>
                  {categoriasFiltradas.map((cat) => (
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
                <label>Data</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        isDangerous={true}
      />
    </div>
  )
}
