import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Funcionarios.css'

export default function Servicos() {
    const [servicos, setServicos] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco_venda: '', // VALOR
        tipo_item: 'servico'
    })

    useEffect(() => {
        fetchServicos()
    }, [])

    const fetchServicos = async () => {
        try {
            setLoading(true)
            const res = await api.get('/produtos?tipo=servico')
            setServicos(res.data)
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
            console.error('Erro ao salvar serviço:', error)
            alert('Erro ao salvar serviço.')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este serviço?')) {
            try {
                await api.delete(`/produtos/${id}`)
                fetchServicos()
            } catch (error) {
                console.error('Erro ao deletar:', error)
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
        setFormData({
            nome: '',
            descricao: '',
            preco_venda: '',
            tipo_item: 'servico'
        })
    }

    return (
        <div className="funcionarios-page">
            <div className="page-header">
                <div>
                    <h1>🛠️ Catálogo de Serviços</h1>
                    <p>Gerencie seus serviços e tabela de preços.</p>
                </div>
                <button className="btn-primary" onClick={() => openModal()}>
                    + Novo Serviço
                </button>
            </div>

            {loading ? (
                <div className="loading">Carregando serviços...</div>
            ) : (
                <div className="funcionarios-grid">
                    {servicos.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum serviço cadastrado.</p>
                        </div>
                    ) : (
                        servicos.map(item => (
                            <div key={item.id} className="funcionario-card">
                                <div className="card-header">
                                    <div className="avatar-placeholder" style={{ background: '#3b82f6' }}>
                                        🛠️
                                    </div>
                                    <div className="card-info">
                                        <h3>{item.nome}</h3>
                                        <span className="cargo-badge">Serviço</span>
                                    </div>
                                </div>

                                <div className="card-details">
                                    <p><strong>Valor:</strong> R$ {Number(item.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p className="descricao-text">{item.descricao || 'Sem descrição'}</p>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-edit" onClick={() => openModal(item)}>Editar</button>
                                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Remover</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingItem ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome do Serviço *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Valor (R$) *</label>
                                <input
                                    type="number"
                                    name="preco_venda"
                                    value={formData.preco_venda}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-confirm">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
