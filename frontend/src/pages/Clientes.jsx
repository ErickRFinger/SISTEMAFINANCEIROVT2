import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Clientes.css' // New Premium Styles

export default function Clientes() {
    const [clientes, setClientes] = useState([])
    const [filteredClientes, setFilteredClientes] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState(null)
    const [formData, setFormData] = useState({
        nome: '',
        documento: '', // CPF/CNPJ
        email: '',
        telefone: '',
        tipo: 'pessoa_fisica', // ou pessoa_juridica
        status: 'ativo'
    })

    useEffect(() => {
        fetchClientes()
    }, [])

    useEffect(() => {
        if (!searchTerm) {
            setFilteredClientes(clientes)
        } else {
            const lower = searchTerm.toLowerCase()
            const filtered = clientes.filter(c =>
                c.nome.toLowerCase().includes(lower) ||
                (c.email && c.email.toLowerCase().includes(lower)) ||
                (c.documento && c.documento.includes(lower))
            )
            setFilteredClientes(filtered)
        }
    }, [searchTerm, clientes])

    const fetchClientes = async () => {
        try {
            setLoading(true)
            const res = await api.get('/clientes')
            setClientes(res.data)
            setFilteredClientes(res.data)
        } catch (error) {
            console.error('Erro ao buscar clientes', error)
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
            if (editingClient) {
                await api.put(`/clientes/${editingClient.id}`, formData)
            } else {
                await api.post('/clientes', formData)
            }
            setModalOpen(false)
            fetchClientes()
            resetForm()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar cliente.')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este cliente?')) {
            try {
                await api.delete(`/clientes/${id}`)
                fetchClientes()
            } catch (error) {
                console.error(error)
            }
        }
    }

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client)
            setFormData({
                nome: client.nome,
                documento: client.documento || '',
                email: client.email || '',
                telefone: client.telefone || '',
                tipo: client.tipo || 'pessoa_fisica',
                status: client.status || 'ativo'
            })
        } else {
            resetForm()
        }
        setModalOpen(true)
    }

    const resetForm = () => {
        setEditingClient(null)
        setFormData({ nome: '', documento: '', email: '', telefone: '', tipo: 'pessoa_fisica', status: 'ativo' })
    }

    return (
        <div className="clients-page">
            <div className="clients-header-area">
                <div className="clients-header-top">
                    <div className="clients-title">
                        <h1>🤝 Base de Clientes (CRM)</h1>
                        <p className="clients-subtitle">Gerenciamento de relacionamentos e contatos.</p>
                    </div>
                    <button className="btn-crm-primary" onClick={() => openModal()}>
                        <span>+</span> Novo Cliente
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="clients-controls">
                    <div className="search-bar-container">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar por nome, email ou documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading">Carregando CRM...</div>
            ) : (
                <div className="clients-grid">
                    {filteredClientes.length === 0 ? (
                        <div className="empty-crm" style={{ gridColumn: '1/-1' }}>
                            <span style={{ fontSize: '3rem', opacity: 0.5 }}>📇</span>
                            <p>{searchTerm ? 'Nenhum cliente encontrado para a busca.' : 'Sua base de clientes está vazia.'}</p>
                        </div>
                    ) : (
                        filteredClientes.map(client => (
                            <div key={client.id} className="client-card">
                                {/* Header / Avatar */}
                                <div className="client-header">
                                    <div className="client-avatar">
                                        {client.tipo === 'pessoa_fisica' ? '👤' : '🏢'}
                                    </div>
                                    <div className="client-info">
                                        <h3>{client.nome}</h3>
                                        <span className="client-type-badge">
                                            {client.tipo === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                                        </span>
                                    </div>
                                    <div className={`status-pill ${client.status === 'ativo' ? 'active' : 'inactive'}`} title={client.status}></div>
                                </div>

                                {/* Details */}
                                <div className="client-details">
                                    <div className="detail-row">
                                        <span>📧</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.email || 'Não informado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>📱</span>
                                        <span>{client.telefone || 'Não informado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>🆔</span>
                                        <span>{client.documento || 'S/ Documento'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="client-actions">
                                    <button className="btn-icon-action" onClick={() => openModal(client)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="btn-icon-action delete" onClick={() => handleDelete(client.id)}>
                                        🗑️ Remover
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL (Reused styles for now, can be upgraded later) */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        <h2>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome / Razão Social *</label>
                                <input name="nome" value={formData.nome} onChange={handleInputChange} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select name="tipo" value={formData.tipo} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                        <option value="pessoa_fisica">Pessoa Física</option>
                                        <option value="pessoa_juridica">Pessoa Jurídica</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>CPF / CNPJ</label>
                                    <input name="documento" value={formData.documento} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>

                            <div className="form-group">
                                <label>Telefone / WhatsApp</label>
                                <input name="telefone" value={formData.telefone} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-confirm" style={{ background: 'var(--crm-primary)', color: 'white' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
