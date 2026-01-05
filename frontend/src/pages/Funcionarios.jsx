import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Funcionarios.css' // Vamos criar um CSS específico para ficar bonito

export default function Funcionarios() {
    const [funcionarios, setFuncionarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingFuncionario, setEditingFuncionario] = useState(null)

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        cargo: '',
        salario: '',
        data_admissao: '',
        telefone: '',
        email: '',
        status: 'ativo'
    })

    useEffect(() => {
        fetchFuncionarios()
    }, [])

    const fetchFuncionarios = async () => {
        try {
            setLoading(true)
            const res = await api.get('/funcionarios')
            setFuncionarios(res.data)
        } catch (error) {
            console.error('Erro ao buscar funcionários', error)
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
            if (editingFuncionario) {
                await api.put(`/funcionarios/${editingFuncionario.id}`, formData)
            } else {
                await api.post('/funcionarios', formData)
            }
            setModalOpen(false)
            fetchFuncionarios()
            resetForm()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar funcionário.')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
            try {
                await api.delete(`/funcionarios/${id}`)
                fetchFuncionarios()
            } catch (error) {
                console.error('Erro ao deletar:', error)
            }
        }
    }

    const openModal = (funcionario = null) => {
        if (funcionario) {
            setEditingFuncionario(funcionario)
            setFormData({
                nome: funcionario.nome,
                cargo: funcionario.cargo || '',
                salario: funcionario.salario || '',
                data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : '',
                telefone: funcionario.telefone || '',
                email: funcionario.email || '',
                status: funcionario.status || 'ativo'
            })
        } else {
            resetForm()
        }
        setModalOpen(true)
    }

    const resetForm = () => {
        setEditingFuncionario(null)
        setFormData({
            nome: '',
            cargo: '',
            salario: '',
            data_admissao: '',
            telefone: '',
            email: '',
            status: 'ativo'
        })
    }

    // --- Render ---

    return (
        <div className="funcionarios-page">
            <div className="page-header">
                <div>
                    <h1>👥 Gestão de Pessoal</h1>
                    <p>Cadastre e gerencie sua equipe.</p>
                </div>
                <button className="btn-primary" onClick={() => openModal()}>
                    + Novo Funcionário
                </button>
            </div>

            {loading ? (
                <div className="loading">Carregando equipe...</div>
            ) : (
                <div className="funcionarios-grid">
                    {funcionarios.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum funcionário cadastrado.</p>
                        </div>
                    ) : (
                        funcionarios.map(func => (
                            <div key={func.id} className="funcionario-card">
                                <div className="card-header">
                                    <div className="avatar-placeholder">
                                        {func.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="card-info">
                                        <h3>{func.nome}</h3>
                                        <span className="cargo-badge">{func.cargo || 'Sem Cargo'}</span>
                                    </div>
                                    <span className={`status-dot ${func.status === 'ativo' ? 'online' : 'offline'}`} title={func.status}></span>
                                </div>

                                <div className="card-details">
                                    <p><strong>Salário:</strong> R$ {Number(func.salario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Admissão:</strong> {func.data_admissao ? new Date(func.data_admissao).toLocaleDateString() : '-'}</p>
                                    {func.email && <p><strong>Email:</strong> {func.email}</p>}
                                </div>

                                <div className="card-actions">
                                    <button className="btn-edit" onClick={() => openModal(func)}>Editar</button>
                                    <button className="btn-delete" onClick={() => handleDelete(func.id)}>Remover</button>
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
                        <h2>{editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome Completo *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input
                                        type="text"
                                        name="cargo"
                                        value={formData.cargo}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Vendedor"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Salário (R$)</label>
                                    <input
                                        type="number"
                                        name="salario"
                                        value={formData.salario}
                                        onChange={handleInputChange}
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data Admissão</label>
                                    <input
                                        type="date"
                                        name="data_admissao"
                                        value={formData.data_admissao}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                        <option value="ferias">Férias</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="text"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleInputChange}
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
