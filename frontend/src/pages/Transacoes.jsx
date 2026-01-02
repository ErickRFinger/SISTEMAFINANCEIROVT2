import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  const [searchTerm, setSearchTerm] = useState('')

  const [filtros, setFiltros] = useState({
    tipo: '',
    mes: String(new Date().getMonth() + 1).padStart(2, '0'),
    ano: String(new Date().getFullYear())
  })

  // Form State
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    data: new Date().toISOString().split('T')[0],
    categoria_id: '',
    banco_id: '',
    cartao_id: '',
    is_recorrente: false
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
      resetForm()
      await carregarTransacoes()
      window.dispatchEvent(new CustomEvent('transacaoCriada'))
      alert(editing ? 'Atualizado!' : 'Criado!')
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar')
    }
  }

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      tipo: 'despesa',
      data: new Date().toISOString().split('T')[0],
      categoria_id: '',
      banco_id: '',
      cartao_id: '',
      is_recorrente: false
    })
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
      cartao_id: transacao.cartao_id || '',
      is_recorrente: transacao.is_recorrente || false
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
      alert('Erro ao deletar')
    }
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  const exportToCSV = () => {
    if (!transacoes || transacoes.length === 0) {
      alert('Nada para exportar.')
      return
    }
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Data;Descrição;Categoria;Tipo;Valor;Banco/Cartão\n"
    transacoes.forEach(t => {
      const data = format(new Date(t.data), "dd/MM/yyyy")
      const desc = t.descricao.replace(/;/g, ',')
      const cat = t.categoria_nome || 'Sem Categoria'
      const tipo = t.tipo === 'receita' ? 'Receita' : 'Despesa'
      const valor = t.valor.toString().replace('.', ',')
      const bancoCartao = `${t.banco_nome || ''} ${t.cartao_nome ? '(' + t.cartao_nome + ')' : ''}`.trim()
      csvContent += `${data};${desc};${cat};${tipo};${valor};${bancoCartao}\n`
    })
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `financeiro_${filtros.mes}_${filtros.ano}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Lógica de Agrupamento
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter(t =>
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transacoes, searchTerm])

  const transacoesAgrupadas = useMemo(() => {
    const grupos = {}
    transacoesFiltradas.forEach(t => {
      const dataIso = t.data.split('T')[0] // Garante YYYY-MM-DD
      if (!grupos[dataIso]) grupos[dataIso] = []
      grupos[dataIso].push(t)
    })

    // Sort keys desc
    return Object.keys(grupos).sort((a, b) => new Date(b) - new Date(a)).map(data => ({
      data,
      itens: grupos[data]
    }))
  }, [transacoesFiltradas])

  const getGroupLabel = (dateStr) => {
    const data = parseISO(dateStr)
    if (isToday(data)) return 'Hoje'
    if (isYesterday(data)) return 'Ontem'
    return format(data, "EEEE, d 'de' MMMM", { locale: ptBR })
  }

  const categoriasFiltradas = categorias.filter(cat => !formData.tipo || cat.tipo === formData.tipo)

  return (
    <div className="container fade-in">
      <div className="transacoes-header-control">
        <div>
          <h2 style={{ margin: 0 }}>💳 Transações</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Extrato detalhado</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToCSV} className="btn-secondary btn-sm" title="Exportar CSV">📥 Exportar</button>
          <button onClick={() => { setEditing(null); resetForm(); setShowModal(true) }} className="btn-primary btn-sm">
            + Nova
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="filtros" style={{ alignItems: 'center' }}>
          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: 'auto' }}>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              style={{ borderRadius: '99px', padding: '0.5rem 1rem' }}
            >
              <option value="">Todos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: 'auto' }}>
            <input
              type="month"
              value={`${filtros.ano}-${filtros.mes}`}
              onChange={(e) => {
                const [ano, mes] = e.target.value.split('-')
                setFiltros({ ...filtros, mes, ano })
              }}
              style={{ borderRadius: '99px', padding: '0.4rem 1rem' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : transacoesAgrupadas.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="transacoes-list-visual">
          {transacoesAgrupadas.map(grupo => (
            <div key={grupo.data} className="date-group">
              <div className="date-group-header">{getGroupLabel(grupo.data)}</div>
              {grupo.itens.map(t => (
                <div key={t.id} className="t-card" onClick={() => handleEdit(t)}>
                  <div className="t-icon" style={{ background: t.tipo === 'receita' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: t.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                    {t.tipo === 'receita' ? '💰' : '💸'}
                  </div>
                  <div className="t-info">
                    <span className="t-desc">{t.descricao}</span>
                    <div className="t-meta">
                      <span className="t-badge" style={{ color: t.categoria_cor || '#ccc' }}>
                        {t.categoria_nome || 'Geral'}
                      </span>
                      {(t.banco_nome || t.cartao_nome) && (
                        <span>• {t.banco_nome} {t.cartao_nome ? `(${t.cartao_nome})` : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`t-amount ${t.tipo}`}>
                      {t.tipo === 'receita' ? '+' : '-'} {formatarMoeda(t.valor)}
                    </div>
                  </div>
                  <div className="t-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id) }} className="btn-icon delete-btn">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar' : 'Nova'} Transação</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição</label>
                <input required value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Valor</label>
                  <input type="number" step="0.01" required value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value, categoria_id: '' })}>
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={formData.categoria_id} onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Banco</label>
                  <select value={formData.banco_id} onChange={(e) => setFormData({ ...formData, banco_id: e.target.value, cartao_id: '' })}>
                    <option value="">Nenhum</option>
                    {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
                {formData.banco_id && (
                  <div className="form-group">
                    <label>Cartão</label>
                    <select value={formData.cartao_id} onChange={(e) => setFormData({ ...formData, cartao_id: e.target.value })}>
                      <option value="">Nenhum</option>
                      {getCartoesDoBanco().map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_recorrente}
                    onChange={e => setFormData({ ...formData, is_recorrente: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>🔄 É gasto recorrente?</span>
                </label>
              </div>

              <div className="form-group">
                <label>Data</label>
                <input type="date" required value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Excluir Transação"
        message="Tem certeza?"
        confirmText="Excluir"
        isDangerous={true}
      />
    </div>
  )
}
