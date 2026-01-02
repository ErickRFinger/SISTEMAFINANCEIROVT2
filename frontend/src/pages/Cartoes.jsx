import { useState, useEffect } from 'react'
import api from '../services/api'
import './Cartoes.css'

export default function Cartoes() {
    const [cartoes, setCartoes] = useState([])
    const [bancos, setBancos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)

    // Estado do formulário
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'credito',
        limite: '',
        dia_fechamento: '',
        dia_vencimento: '',
        cor: '#818cf8',
        ativo: true,
        banco_id: ''
    })

    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            setLoading(true)
            const [cartoesRes, bancosRes] = await Promise.all([
                api.get('/cartoes'),
                api.get('/bancos')
            ])
            setCartoes(cartoesRes.data)
            setBancos(bancosRes.data)
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (!formData.banco_id) {
                alert('Selecione um banco')
                return
            }

            // Reutiliza a API de bancos que já lida com criação de cartões
            if (editing) {
                await api.put(`/bancos/${formData.banco_id}/cartoes/${editing.id}`, formData)
            } else {
                await api.post(`/bancos/${formData.banco_id}/cartoes`, formData)
            }

            setShowModal(false)
            setEditing(null)
            resetForm()
            await carregarDados()
            alert(editing ? 'Cartão atualizado com sucesso!' : 'Cartão criado com sucesso!')
        } catch (error) {
            console.error('Erro ao salvar cartão:', error)
            alert(error.response?.data?.error || 'Erro ao salvar cartão')
        }
    }

    const handleEdit = (cartao) => {
        setEditing(cartao)
        setFormData({
            nome: cartao.nome,
            tipo: cartao.tipo,
            limite: cartao.limite || '',
            dia_fechamento: cartao.dia_fechamento || '',
            dia_vencimento: cartao.dia_vencimento || '',
            cor: cartao.cor,
            ativo: cartao.ativo,
            banco_id: cartao.banco_id
        })
        setShowModal(true)
    }

    const handleDelete = async (cartao) => {
        if (!confirm(`Tem certeza que deseja deletar o cartão "${cartao.nome}"?`)) return

        try {
            await api.delete(`/bancos/${cartao.banco_id}/cartoes/${cartao.id}`)
            await carregarDados()
            alert('Cartão deletado com sucesso!')
        } catch (error) {
            console.error('Erro ao deletar cartão:', error)
            alert(error.response?.data?.error || 'Erro ao deletar cartão')
        }
    }

    const resetForm = () => {
        setFormData({
            nome: '',
            tipo: 'credito',
            limite: '',
            dia_fechamento: '',
            dia_vencimento: '',
            cor: '#818cf8',
            ativo: true,
            banco_id: ''
        })
    }

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor)
    }

    // Função para calcular próxima fatura (estimada)
    const getProximaFatura = (diaFechamento) => {
        if (!diaFechamento) return 'N/A'

        const hoje = new Date()
        const diaAtual = hoje.getDate()
        const mesAtual = hoje.getMonth()
        const anoAtual = hoje.getFullYear()

        let mesFatura = mesAtual
        let anoFatura = anoAtual

        if (diaAtual > diaFechamento) {
            mesFatura++
            if (mesFatura > 11) {
                mesFatura = 0
                anoFatura++
            }
        }

        const data = new Date(anoFatura, mesFatura, diaFechamento)
        return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(data)
    }

    if (loading) return <div className="loading">Carregando...</div>

    return (
        <div className="container">
            <div className="page-header">
                <div>
                    <h2>💳 Meus Cartões</h2>
                    <p className="page-subtitle">Gerencie seus cartões de crédito e faturas</p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null)
                        resetForm()
                        setShowModal(true)
                    }}
                    className="btn-primary"
                >
                    + Novo Cartão
                </button>
            </div>

            {cartoes.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">💳</div>
                        <p>Nenhum cartão cadastrado</p>
                        <button
                            onClick={() => {
                                setEditing(null)
                                resetForm()
                                setShowModal(true)
                            }}
                            className="btn-primary"
                        >
                            Cadastrar Primeiro Cartão
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-2">
                    {cartoes.map(cartao => (
                        <div key={cartao.id} className="card-credit-container">
                            {/* Visualização Estilo Cartão de Crédito */}
                            <div
                                className={`credit-card-visual ${!cartao.ativo ? 'inativo' : ''}`}
                                style={{
                                    background: `linear-gradient(135deg, ${cartao.cor}, ${adjustColor(cartao.cor, -40)})`
                                }}
                            >
                                <div className="credit-card-chip"></div>
                                <div className="credit-card-logo">{cartao.banco_nome || 'Banco'}</div>
                                <div className="credit-card-number">•••• •••• •••• ••••</div>
                                <div className="credit-card-info">
                                    <div className="credit-card-holder">
                                        <span>TITULAR</span>
                                        <div>{cartao.nome.toUpperCase()}</div>
                                    </div>
                                    <div className="credit-card-validity">
                                        <span>VENCE</span>
                                        <div>{cartao.dia_vencimento ? `Dia ${cartao.dia_vencimento}` : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalhes e Ações */}
                            <div className="credit-card-details">
                                <div className="detail-row">
                                    <span>Limite</span>
                                    <strong>{cartao.limite ? formatarMoeda(cartao.limite) : 'Não informado'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Fechamento</span>
                                    <strong>{cartao.dia_fechamento ? `Dia ${cartao.dia_fechamento}` : 'N/A'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Próximo Fechamento</span>
                                    <strong>{getProximaFatura(cartao.dia_fechamento)}</strong>
                                </div>

                                <div className="credit-card-actions">
                                    <button onClick={() => handleEdit(cartao)} className="btn-secondary btn-sm">
                                        ✏️ Editar
                                    </button>
                                    <button onClick={() => handleDelete(cartao)} className="btn-danger btn-sm">
                                        🗑️ Remover
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{editing ? 'Editar Cartão' : 'Novo Cartão'}</h3>
                        <form onSubmit={handleSubmit}>

                            {!editing && (
                                <div className="form-group">
                                    <label>Banco *</label>
                                    <select
                                        value={formData.banco_id}
                                        onChange={e => setFormData({ ...formData, banco_id: e.target.value })}
                                        required
                                        disabled={!!editing}
                                    >
                                        <option value="">Selecione um banco...</option>
                                        {bancos.map(banco => (
                                            <option key={banco.id} value={banco.id}>{banco.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Nome do Cartão *</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                    placeholder="Ex: Nubank Platinum"
                                />
                            </div>

                            <div className="form-group">
                                <label>Limite (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.limite}
                                    onChange={e => setFormData({ ...formData, limite: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dia Fechamento</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.dia_fechamento}
                                        onChange={e => setFormData({ ...formData, dia_fechamento: e.target.value })}
                                        placeholder="Ex: 5"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Dia Vencimento</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.dia_vencimento}
                                        onChange={e => setFormData({ ...formData, dia_vencimento: e.target.value })}
                                        placeholder="Ex: 10"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cor do Cartão</label>
                                <input
                                    type="color"
                                    value={formData.cor}
                                    onChange={e => setFormData({ ...formData, cor: e.target.value })}
                                    style={{ width: '100%', height: '40px' }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editing ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper para escurecer cor (para o gradiente)
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}
