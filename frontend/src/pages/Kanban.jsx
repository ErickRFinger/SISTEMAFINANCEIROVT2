import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Kanban.css'

export default function Kanban() {
    const [board, setBoard] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [activeColumn, setActiveColumn] = useState(null) // ID da coluna onde vamos adicionar

    // Form
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        prioridade: 'media',
        dificuldade: 'medio',
        prazo: ''
    })

    useEffect(() => {
        fetchBoard()
    }, [])

    const fetchBoard = async () => {
        try {
            // 1. Tenta buscar colunas
            const res = await api.get('/kanban/columns')
            if (res.data.length === 0) {
                // Se não tem, faz setup inicial
                await api.post('/kanban/setup')
                const retry = await api.get('/kanban/columns')
                setBoard(retry.data)
            } else {
                setBoard(res.data)
            }
        } catch (error) {
            console.error('Erro ao carregar kanban:', error)
        } finally {
            setLoading(false)
        }
    }

    // --- Drag & Drop Handlers (HTML5 Native) ---

    const handleDragStart = (e, cardId, sourceColId) => {
        e.dataTransfer.setData('cardId', cardId)
        e.dataTransfer.setData('sourceColId', sourceColId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault() // Necessary to allow dropping
    }

    const handleDrop = async (e, targetColId) => {
        e.preventDefault()
        const cardId = e.dataTransfer.getData('cardId')
        const sourceColId = e.dataTransfer.getData('sourceColId')

        if (!cardId || sourceColId === targetColId.toString()) return

        // 1. Optimistic Update (UI First)
        const newBoard = board.map(col => {
            if (col.id.toString() === sourceColId) {
                return { ...col, cards: col.cards.filter(c => c.id.toString() !== cardId) }
            }
            if (col.id === targetColId) {
                // Find the card in the old board (inefficient but safe)
                const sourceCol = board.find(c => c.id.toString() === sourceColId)
                const card = sourceCol.cards.find(c => c.id.toString() === cardId)
                return { ...col, cards: [...col.cards, { ...card, coluna_id: targetColId }] }
            }
            return col
        })
        setBoard(newBoard)

        // 2. API Call
        try {
            await api.put(`/kanban/cards/${cardId}/move`, { nova_coluna_id: targetColId })
        } catch (error) {
            console.error('Erro ao mover card:', error)
            fetchBoard() // Revert on error
        }
    }

    // --- Modal Logic ---

    const openAddModal = (colId) => {
        setActiveColumn(colId)
        setFormData({
            titulo: '',
            descricao: '',
            prioridade: 'media',
            dificuldade: 'medio',
            prazo: ''
        })
        setModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.post('/kanban/cards', {
                coluna_id: activeColumn,
                ...formData
            })
            setModalOpen(false)
            fetchBoard()
        } catch (error) {
            console.error('Erro ao criar card:', error)
        }
    }

    return (
        <div className="kanban-page">
            <div className="page-header">
                <h1>📋 Quadro Operacional</h1>
                <button className="btn-secondary" onClick={fetchBoard}>🔄 Atualizar</button>
            </div>

            {loading ? (
                <div className="loading">Carregando quadro...</div>
            ) : (
                <div className="kanban-board">
                    {board.map(col => (
                        <div
                            key={col.id}
                            className="kanban-column"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="column-header" style={{ borderTop: `4px solid ${col.cor || '#ccc'}` }}>
                                <span>{col.titulo}</span>
                                <span className="column-count">{col.cards?.length || 0}</span>
                            </div>

                            <div className="column-body">
                                {col.cards?.map(card => (
                                    <div
                                        key={card.id}
                                        className={`kanban-card p-${card.prioridade}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                                    >
                                        <div className="card-title">{card.titulo}</div>
                                        {card.descricao && (
                                            <div style={{
                                                fontSize: '0.8rem', color: '#666', marginBottom: '8px',
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                            }}>
                                                {card.descricao}
                                            </div>
                                        )}

                                        <div className="card-meta">
                                            {card.prioridade === 'alta' && <span className="meta-tag" style={{ color: '#ef4444' }}>🔥 Alta</span>}
                                            {card.dificuldade && <span className="meta-tag">⚡ {card.dificuldade}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="add-card-btn" onClick={() => openAddModal(col.id)}>
                                + Adicionar Tarefa
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* NEW CARD MODAL */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Nova Tarefa</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Título da Demanda *</label>
                                <input
                                    autoFocus
                                    required
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    placeholder="Ex: Formatar Servidor"
                                />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prioridade (SLA)</label>
                                    <select value={formData.prioridade} onChange={e => setFormData({ ...formData, prioridade: e.target.value })}>
                                        <option value="baixa">🟢 Baixa</option>
                                        <option value="media">🟡 Média</option>
                                        <option value="alta">🔴 Alta</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Dificuldade</label>
                                    <select value={formData.dificuldade} onChange={e => setFormData({ ...formData, dificuldade: e.target.value })}>
                                        <option value="facil">Fácil</option>
                                        <option value="medio">Médio</option>
                                        <option value="dificil">Difícil</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-confirm">Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
