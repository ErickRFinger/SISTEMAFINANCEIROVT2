import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Funcionarios.css' // Reusing the clean card styles

export default function Clientes() {
    const [clientes, setClientes] = useState([])
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

    const fetchClientes = async () => {
        try {
            setLoading(true)
            const res = await api.get('/clientes')
            setClientes(res.data)
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
        if (window.confirm('Remover este cliente?')) {
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
        <div className="funcionarios-page"> {/* Reusing padding/layout */}
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>🤝 Base de Clientes</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus parceiros de negócios.</p>
                </div>
                <button className="btn-primary" onClick={() => openModal()}>
                    + Novo Cliente
                </button>
            </div>

            {loading ? (
                <div className="loading">Carregando...</div>
            ) : (
                <div className="funcionarios-grid">
                    {clientes.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: '16px' }}>
                            <p>Nenhum cliente na base.</p>
                        </div>
                    ) : (
                        clientes.map(client => (
                            <div key={client.id} className="funcionario-card">
                                <div className="card-header">
                                    <div className="avatar-placeholder" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                        {client.tipo === 'pessoa_juridica' ? '🏢' : '👤'}
                                    </div>
                                    <div className="card-info">
                                        <h3>{client.nome}</h3>
                                        <span className="cargo-badge">{client.tipo === 'pessoa_juridica' ? 'Empresa' : 'Pessoa Física'}</span>
                                    </div>
                                    <span className={`status-dot ${client.status === 'ativo' ? 'online' : 'offline'}`}></span>
                                </div>

                                <div className="card-details">
                                    <p><strong>Doc:</strong> {client.documento || '-'}</p>
                                    <p><strong>Tel:</strong> {client.telefone || '-'}</p>
                                    <p><strong>Email:</strong> {client.email || '-'}</p>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-edit" onClick={() => openModal(client)}>Editar</button>
                                    <button className="btn-delete" onClick={() => handleDelete(client.id)}>Remover</button>
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
                        <h2>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome / Razão Social *</label>
                                <input name="nome" value={formData.nome} onChange={handleInputChange} required />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
                                        <option value="pessoa_fisica">Pessoa Física</option>
                                        <option value="pessoa_juridica">Pessoa Jurídica</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>CPF / CNPJ</label>
                                    <input name="documento" value={formData.documento} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label>Telefone / WhatsApp</label>
                                <input name="telefone" value={formData.telefone} onChange={handleInputChange} />
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
