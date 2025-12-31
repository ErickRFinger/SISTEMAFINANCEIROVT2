import { useState, useEffect } from 'react'
import api from '../services/api'
import './Bancos.css'

export default function Bancos() {
  const [bancos, setBancos] = useState([])
  const [cartoes, setCartoes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModalBanco, setShowModalBanco] = useState(false)
  const [showModalCartao, setShowModalCartao] = useState(false)
  const [editingBanco, setEditingBanco] = useState(null)
  const [editingCartao, setEditingCartao] = useState(null)
  const [bancoSelecionado, setBancoSelecionado] = useState(null)
  const [formDataBanco, setFormDataBanco] = useState({
    nome: '',
    tipo: 'banco',
    saldo_inicial: '0',
    saldo_atual: '0',
    cor: '#6366f1',
    observacoes: ''
  })
  const [formDataCartao, setFormDataCartao] = useState({
    nome: '',
    tipo: 'credito',
    limite: '',
    dia_fechamento: '',
    dia_vencimento: '',
    cor: '#818cf8',
    ativo: true
  })

  useEffect(() => {
    carregarBancos()
  }, [])

  const carregarBancos = async () => {
    try {
      setLoading(true)
      console.log('🔄 [BANCOS] Carregando bancos...')
      const response = await api.get('/bancos')
      console.log('✅ [BANCOS] Bancos carregados:', response.data?.length || 0)
      setBancos(response.data || [])
      
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
      console.error('❌ [BANCOS] Erro ao carregar bancos:', error)
      console.error('   Mensagem:', error.message)
      console.error('   Response:', error.response?.data)
      console.error('   Status:', error.response?.status)
      // Não mostrar erro genérico, deixar a página carregar vazia
      setBancos([])
    } finally {
      setLoading(false)
    }
  }

  const carregarCartoes = async (bancoId) => {
    try {
      const response = await api.get(`/bancos/${bancoId}/cartoes`)
      setCartoes({ ...cartoes, [bancoId]: response.data })
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
    }
  }

  const handleSubmitBanco = async (e) => {
    e.preventDefault()
    try {
      if (editingBanco) {
        // Para edição, enviar apenas os campos necessários
        const updateData = {
          nome: formDataBanco.nome,
          tipo: formDataBanco.tipo,
          cor: formDataBanco.cor,
          observacoes: formDataBanco.observacoes
        }
        
        // Incluir saldo_atual apenas se foi modificado
        if (formDataBanco.saldo_atual !== undefined && formDataBanco.saldo_atual !== '') {
          const saldoAtual = parseFloat(formDataBanco.saldo_atual)
          if (!isNaN(saldoAtual)) {
            updateData.saldo_atual = saldoAtual
          }
        }
        
        await api.put(`/bancos/${editingBanco.id}`, updateData)
      } else {
        // Para criação, enviar saldo_inicial
        const createData = {
          nome: formDataBanco.nome,
          tipo: formDataBanco.tipo,
          saldo_inicial: parseFloat(formDataBanco.saldo_inicial) || 0,
          cor: formDataBanco.cor,
          observacoes: formDataBanco.observacoes
        }
        
        await api.post('/bancos', createData)
      }
      setShowModalBanco(false)
      setEditingBanco(null)
      resetFormBanco()
      await carregarBancos()
      alert(editingBanco ? 'Banco atualizado com sucesso!' : 'Banco criado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar banco:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.response?.data?.details ||
                          error.message || 
                          'Erro ao salvar banco'
      alert(errorMessage)
    }
  }

  const handleSubmitCartao = async (e) => {
    e.preventDefault()
    if (!bancoSelecionado) {
      alert('Selecione um banco primeiro')
      return
    }

    try {
      if (editingCartao) {
        await api.put(`/bancos/${bancoSelecionado.id}/cartoes/${editingCartao.id}`, formDataCartao)
      } else {
        await api.post(`/bancos/${bancoSelecionado.id}/cartoes`, formDataCartao)
      }
      setShowModalCartao(false)
      setEditingCartao(null)
      setBancoSelecionado(null)
      resetFormCartao()
      await carregarCartoes(bancoSelecionado.id)
      alert(editingCartao ? 'Cartão atualizado com sucesso!' : 'Cartão criado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar cartão:', error)
      alert(error.response?.data?.error || 'Erro ao salvar cartão')
    }
  }

  const handleEditBanco = (banco) => {
    setEditingBanco(banco)
    setFormDataBanco({
      nome: banco.nome,
      tipo: banco.tipo || 'banco',
      saldo_inicial: banco.saldo_inicial || '0',
      saldo_atual: banco.saldo_atual || '0',
      cor: banco.cor || '#6366f1',
      observacoes: banco.observacoes || ''
    })
    setShowModalBanco(true)
  }

  const handleEditCartao = (banco, cartao) => {
    setBancoSelecionado(banco)
    setEditingCartao(cartao)
    setFormDataCartao({
      nome: cartao.nome,
      tipo: cartao.tipo,
      limite: cartao.limite || '',
      dia_fechamento: cartao.dia_fechamento || '',
      dia_vencimento: cartao.dia_vencimento || '',
      cor: cartao.cor,
      ativo: cartao.ativo
    })
    setShowModalCartao(true)
  }

  const handleDeleteBanco = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este banco? Todos os cartões associados serão removidos.')) return

    try {
      await api.delete(`/bancos/${id}`)
      await carregarBancos()
      alert('Banco deletado com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar banco:', error)
      alert(error.response?.data?.error || 'Erro ao deletar banco')
    }
  }

  const handleDeleteCartao = async (bancoId, cartaoId) => {
    if (!confirm('Tem certeza que deseja deletar este cartão?')) return

    try {
      await api.delete(`/bancos/${bancoId}/cartoes/${cartaoId}`)
      await carregarCartoes(bancoId)
      alert('Cartão deletado com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar cartão:', error)
      alert(error.response?.data?.error || 'Erro ao deletar cartão')
    }
  }

  const resetFormBanco = () => {
    setFormDataBanco({
      nome: '',
      tipo: 'banco',
      saldo_inicial: '0',
      saldo_atual: '0',
      cor: '#6366f1',
      observacoes: ''
    })
  }

  const resetFormCartao = () => {
    setFormDataCartao({
      nome: '',
      tipo: 'credito',
      limite: '',
      dia_fechamento: '',
      dia_vencimento: '',
      cor: '#818cf8',
      ativo: true
    })
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const tiposBanco = [
    { value: 'banco', label: '🏦 Banco' },
    { value: 'carteira', label: '💼 Carteira' },
    { value: 'investimento', label: '📈 Investimento' },
    { value: 'outro', label: '📋 Outro' }
  ]

  const tiposCartao = [
    { value: 'credito', label: '💳 Crédito' },
    { value: 'debito', label: '💵 Débito' },
    { value: 'pre_pago', label: '💰 Pré-pago' }
  ]

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>🏦 Bancos e Cartões</h2>
          <p className="page-subtitle">Gerencie seus bancos e cartões de crédito</p>
        </div>
        <button
          onClick={() => {
            setEditingBanco(null)
            resetFormBanco()
            setShowModalBanco(true)
          }}
          className="btn-primary"
        >
          + Novo Banco
        </button>
      </div>

      {bancos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <p>Nenhum banco cadastrado</p>
            <button
              onClick={() => {
                setEditingBanco(null)
                resetFormBanco()
                setShowModalBanco(true)
              }}
              className="btn-primary"
            >
              Cadastrar Primeiro Banco
            </button>
          </div>
        </div>
      ) : (
        <div className="bancos-list">
          {bancos.map((banco) => (
            <div key={banco.id} className="card banco-card">
              <div className="banco-header">
                <div className="banco-info">
                  <div
                    className="banco-color"
                    style={{ backgroundColor: banco.cor }}
                  />
                  <div>
                    <h3>{banco.nome}</h3>
                    <p className="banco-tipo">{tiposBanco.find(t => t.value === banco.tipo)?.label || banco.tipo}</p>
                  </div>
                </div>
                <div className="banco-saldo">
                  <span className="banco-saldo-label">Saldo</span>
                  <span className="banco-saldo-valor">{formatarMoeda(banco.saldo_atual || 0)}</span>
                </div>
              </div>

              {banco.observacoes && (
                <p className="banco-observacoes">{banco.observacoes}</p>
              )}

              <div className="banco-actions">
                <button
                  onClick={() => {
                    setBancoSelecionado(banco)
                    setEditingCartao(null)
                    resetFormCartao()
                    setShowModalCartao(true)
                  }}
                  className="btn-primary btn-sm"
                >
                  + Adicionar Cartão
                </button>
                <button
                  onClick={() => handleEditBanco(banco)}
                  className="btn-secondary btn-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteBanco(banco.id)}
                  className="btn-danger btn-sm"
                >
                  🗑️ Deletar
                </button>
              </div>

              {/* Lista de Cartões */}
              {cartoes[banco.id] && cartoes[banco.id].length > 0 && (
                <div className="cartoes-list">
                  <h4 className="cartoes-title">Cartões</h4>
                  {cartoes[banco.id].map((cartao) => (
                    <div key={cartao.id} className="cartao-item">
                      <div className="cartao-info">
                        <div
                          className="cartao-color"
                          style={{ backgroundColor: cartao.cor }}
                        />
                        <div>
                          <p className="cartao-nome">{cartao.nome}</p>
                          <p className="cartao-tipo">
                            {tiposCartao.find(t => t.value === cartao.tipo)?.label || cartao.tipo}
                            {cartao.limite && ` • Limite: ${formatarMoeda(cartao.limite)}`}
                            {cartao.dia_fechamento && ` • Fecha: dia ${cartao.dia_fechamento}`}
                            {cartao.dia_vencimento && ` • Vence: dia ${cartao.dia_vencimento}`}
                          </p>
                        </div>
                      </div>
                      <div className="cartao-status">
                        {cartao.ativo ? (
                          <span className="cartao-ativo">🟢 Ativo</span>
                        ) : (
                          <span className="cartao-inativo">🔴 Inativo</span>
                        )}
                      </div>
                      <div className="cartao-actions">
                        <button
                          onClick={() => handleEditCartao(banco, cartao)}
                          className="btn-secondary btn-sm btn-icon"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCartao(banco.id, cartao.id)}
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
            </div>
          ))}
        </div>
      )}

      {/* Modal Banco */}
      {showModalBanco && (
        <div className="modal-overlay" onClick={() => setShowModalBanco(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingBanco ? 'Editar Banco' : 'Novo Banco'}</h3>
            <form onSubmit={handleSubmitBanco}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formDataBanco.nome}
                  onChange={(e) => setFormDataBanco({ ...formDataBanco, nome: e.target.value })}
                  required
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formDataBanco.tipo}
                  onChange={(e) => setFormDataBanco({ ...formDataBanco, tipo: e.target.value })}
                >
                  {tiposBanco.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {editingBanco ? (
                <div className="form-group">
                  <label>Saldo Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDataBanco.saldo_atual || 0}
                    onChange={(e) => setFormDataBanco({ ...formDataBanco, saldo_atual: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Saldo Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDataBanco.saldo_inicial}
                    onChange={(e) => setFormDataBanco({ ...formDataBanco, saldo_inicial: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Cor</label>
                <input
                  type="color"
                  value={formDataBanco.cor}
                  onChange={(e) => setFormDataBanco({ ...formDataBanco, cor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formDataBanco.observacoes}
                  onChange={(e) => setFormDataBanco({ ...formDataBanco, observacoes: e.target.value })}
                  placeholder="Observações sobre o banco..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalBanco(false)
                    setEditingBanco(null)
                    resetFormBanco()
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingBanco ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cartão */}
      {showModalCartao && (
        <div className="modal-overlay" onClick={() => setShowModalCartao(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingCartao ? 'Editar Cartão' : 'Novo Cartão'}
              {bancoSelecionado && ` - ${bancoSelecionado.nome}`}
            </h3>
            <form onSubmit={handleSubmitCartao}>
              <div className="form-group">
                <label>Nome do Cartão *</label>
                <input
                  type="text"
                  value={formDataCartao.nome}
                  onChange={(e) => setFormDataCartao({ ...formDataCartao, nome: e.target.value })}
                  required
                  placeholder="Ex: Cartão Gold"
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formDataCartao.tipo}
                  onChange={(e) => setFormDataCartao({ ...formDataCartao, tipo: e.target.value })}
                >
                  {tiposCartao.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {formDataCartao.tipo === 'credito' && (
                <>
                  <div className="form-group">
                    <label>Limite (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formDataCartao.limite}
                      onChange={(e) => setFormDataCartao({ ...formDataCartao, limite: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Dia de Fechamento (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formDataCartao.dia_fechamento}
                      onChange={(e) => setFormDataCartao({ ...formDataCartao, dia_fechamento: e.target.value })}
                      placeholder="Ex: 5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Dia de Vencimento (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formDataCartao.dia_vencimento}
                      onChange={(e) => setFormDataCartao({ ...formDataCartao, dia_vencimento: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Cor</label>
                <input
                  type="color"
                  value={formDataCartao.cor}
                  onChange={(e) => setFormDataCartao({ ...formDataCartao, cor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formDataCartao.ativo}
                    onChange={(e) => setFormDataCartao({ ...formDataCartao, ativo: e.target.checked })}
                  />
                  {' '}Cartão Ativo
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalCartao(false)
                    setEditingCartao(null)
                    setBancoSelecionado(null)
                    resetFormCartao()
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingCartao ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

