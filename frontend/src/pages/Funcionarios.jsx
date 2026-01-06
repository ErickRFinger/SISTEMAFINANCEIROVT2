import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './TeamStyles.css' // Premium Team CSS

export default function Funcionarios() {
    const [funcionarios, setFuncionarios] = useState([])
    const [filteredFuncionarios, setFilteredFuncionarios] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingFuncionario, setEditingFuncionario] = useState(null)

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

    useEffect(() => {
        if (!searchTerm) {
            setFilteredFuncionarios(funcionarios)
        } else {
            const lower = searchTerm.toLowerCase()
            const filtered = funcionarios.filter(f =>
                f.nome.toLowerCase().includes(lower) ||
                (f.cargo && f.cargo.toLowerCase().includes(lower))
            )
            setFilteredFuncionarios(filtered)
        }
    }, [searchTerm, funcionarios])

    const fetchFuncionarios = async () => {
        try {
            setLoading(true)
            const res = await api.get('/funcionarios')
            setFuncionarios(res.data)
            setFilteredFuncionarios(res.data)
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
        if (window.confirm('Tem certeza que deseja remover este colaborador?')) {
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

    return (
        <div className="team-page">
            <div className="team-header">
                <div className="team-title">
                    <h1>👥 Gestão de Pessoal</h1>
                    <p style={{ color: '#94a3b8' }}>Sua equipe e colaboradores.</p>
                </div>
                <div className="team-controls">
                    <button className="btn-team-add" onClick={() => openModal()}>
                        + Colaborador
                    </button>
                    {/* Could add Search here too for consistency, but simpler header for now */}
                </div>
            </div>

            {loading ? (
                <div className="loading">Carregando equipe...</div>
            ) : (
                <div className="team-grid">
                    {filteredFuncionarios.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>
                            <p>Sua equipe está vazia.</p>
                        </div>
                    ) : (
                        filteredFuncionarios.map(func => (
                            <div key={func.id} className="member-card">
                                <div className={`member-status ${func.status}`} title={`Status: ${func.status}`}></div>

                                <div className="member-avatar">
                                    {func.nome.charAt(0).toUpperCase()}
                                </div>

                                <div className="member-info">
                                    <h3>{func.nome}</h3>
                                    <span className="member-role">{func.cargo || 'Cargo não def.'}</span>
                                </div>

                                <div className="member-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Admissão</span>
                                        <span className="stat-value">{func.data_admissao ? new Date(func.data_admissao).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Salário</span>
                                        <span className="stat-value">R$ {Number(func.salario || 0).toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>

                                <div className="member-actions">
                                    <button className="btn-team-action" onClick={() => openModal(func)}>Editar</button>
                                    <button className="btn-team-action" onClick={() => handleDelete(func.id)} style={{ color: '#fca5a5' }}>Remover</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ background: '#1e293b', color: 'white' }}>
                        <h2>{editingFuncionario ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome Completo *</label>
                                <input name="nome" value={formData.nome} onChange={handleInputChange} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input name="cargo" value={formData.cargo} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                </div>
                                <div className="form-group">
                                    <label>Salário (R$)</label>
                                    <input type="number" name="salario" value={formData.salario} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Admissão</label>
                                    <input type="date" name="data_admissao" value={formData.data_admissao} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                        <option value="ferias">Férias</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-confirm" style={{ background: 'var(--team-primary)' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
