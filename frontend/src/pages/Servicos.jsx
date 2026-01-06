import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './ServicosStyles.css' // Premium Brand CSS

export default function Servicos() {
    const [servicos, setServicos] = useState([])
    const [filteredServicos, setFilteredServicos] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco_venda: '',
        tipo_item: 'servico'
    })

    useEffect(() => {
        fetchServicos()
    }, [])

    useEffect(() => {
        if (!searchTerm) {
            setFilteredServicos(servicos)
        } else {
            const lower = searchTerm.toLowerCase()
            const filtered = servicos.filter(s =>
                s.nome.toLowerCase().includes(lower) ||
                (s.descricao && s.descricao.toLowerCase().includes(lower))
            )
            setFilteredServicos(filtered)
        }
    }, [searchTerm, servicos])

    const fetchServicos = async () => {
        try {
            setLoading(true)
            const res = await api.get('/produtos?tipo=servico')
            setServicos(res.data)
            setFilteredServicos(res.data)
        } catch (error) {
            console.error('Erro ao buscar serviços', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingItem) {
                await api.put(`/produtos/${editingItem.id}`, formData)
            } else {
                await api.post('/produtos', formData)
            }
            setModalOpen(false)
            fetchServicos()
            resetForm()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar.')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Remover este serviço do catálogo?')) {
            try {
                await api.delete(`/produtos/${id}`)
                fetchServicos()
            } catch (error) {
                console.error(error)
            }
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                nome: item.nome,
                descricao: item.descricao || '',
                preco_venda: item.preco_venda,
                tipo_item: 'servico'
            })
        } else {
            resetForm()
        }
        setModalOpen(true)
    }

    const resetForm = () => {
        setEditingItem(null)
        setFormData({ nome: '', descricao: '', preco_venda: '', tipo_item: 'servico' })
    }

    return (
        <div className="services-page">
            <div className="services-header">
                <div className="services-title">
                    <h1>🛠️ Catálogo de Serviços</h1>
                    <p style={{ color: '#94a3b8' }}>Tabela de preços e serviços oferecidos.</p>
                </div>

                <div className="services-search-area">
                    <input
                        type="text"
                        placeholder="Buscar serviço..."
                        className="service-search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button className="btn-service-add" onClick={() => openModal()}>
                        <span>+</span> Novo
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Carregando catálogo...</div>
            ) : (
                <div className="services-grid">
                    {filteredServicos.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>
                            <p>{searchTerm ? 'Nenhum serviço encontrado.' : 'Seu catálogo está vazio.'}</p>
                        </div>
                    ) : (
                        filteredServicos.map(item => (
                            <div key={item.id} className="service-card">
                                <div className="service-card-top">
                                    <div className="service-icon">🛠️</div>
                                    <div className="service-info">
                                        <h3>{item.nome}</h3>
                                        <span className="service-price">
                                            R$ {Number(item.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="service-body">
                                    {item.descricao || 'Sem descrição detalhada.'}
                                </div>

                                <div className="service-actions">
                                    <button className="btn-action" onClick={() => openModal(item)}>Editar</button>
                                    <button className="btn-action delete" onClick={() => handleDelete(item.id)}>Remover</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ background: '#1e293b', color: 'white' }}>
                        <h2>{editingItem ? 'Editar' : 'Novo'} Serviço</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome do Serviço *</label>
                                <input name="nome" value={formData.nome} onChange={handleInputChange} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea name="descricao" value={formData.descricao} onChange={handleInputChange} rows="3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', borderRadius: '6px', padding: '10px' }} />
                            </div>

                            <div className="form-group">
                                <label>Valor (R$) *</label>
                                <input type="number" name="preco_venda" value={formData.preco_venda} onChange={handleInputChange} step="0.01" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-confirm" style={{ background: 'var(--service-primary)' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
