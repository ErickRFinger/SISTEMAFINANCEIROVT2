import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './DemandasStyles.css' // Updated to new Trello-style CSS

export default function Demandas() {
    const [columns, setColumns] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCard, setEditingCard] = useState(null)
    const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'list'

    // Form
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        valor: '',
        prioridade: 'media',
        dificuldade: 'medio',
        tipo_movimento: 'saida',
        data_conclusao: ''
    })

    useEffect(() => {
        fetchKanban()
    }, [])

    const fetchKanban = async () => {
        try {
            setLoading(true)
            const res = await api.get('/kanban/columns')
            setColumns(res.data)
        } catch (error) {
            console.error('Erro Kanban:', error)
        } finally {
            setLoading(false)
        }
    }

    // Drag & Drop Handler (Native HTML5)
    const handleDrop = async (cardId, novaColunaId) => {
        try {
            // Optimistic update locally
            const cardIdStr = String(cardId);
            const sourceCol = columns.find(col => col.cards.some(c => String(c.id) === cardIdStr));
            if (!sourceCol || sourceCol.id === novaColunaId) return;

            // Move card in UI state first
            setColumns(prev => prev.map(col => {
                if (col.id === sourceCol.id) {
                    return { ...col, cards: col.cards.filter(c => String(c.id) !== cardIdStr) };
                }
                if (col.id === novaColunaId) {
                    const card = sourceCol.cards.find(c => String(c.id) === cardIdStr);
                    return { ...col, cards: [...col.cards, { ...card, coluna_id: novaColunaId }] };
                }
                return col;
            }));

            // Call API
            await api.put(`/kanban/cards/${cardId}/move`, {
                nova_coluna_id: novaColunaId
            });
            // Background refresh to confirm consistency
            fetchKanban();
        } catch (error) {
            console.error('Erro ao mover card:', error);
            // Revert on error would be ideal, but simply refetching works too
            fetchKanban();
        }
    };

    const openModal = (card = null) => {
        if (card) {
            setEditingCard(card)
            setFormData({
                titulo: card.titulo,
                descricao: card.descricao || '',
                valor: card.valor || '',
                prioridade: card.prioridade || 'media',
                dificuldade: card.dificuldade || 'medio',
                tipo_movimento: card.tipo_movimento || 'saida',
                data_conclusao: card.data_conclusao ? card.data_conclusao.split('T')[0] : ''
            })
        } else {
            setEditingCard(null)
            setFormData({
                titulo: '',
                descricao: '',
                valor: '',
                prioridade: 'media',
                dificuldade: 'medio',
                tipo_movimento: 'saida',
                data_conclusao: ''
            })
        }
        setModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingCard) {
                await api.put(`/kanban/cards/${editingCard.id}`, formData)
            } else {
                if (columns.length === 0) return alert('Sem colunas!')
                await api.post('/kanban/cards', {
                    coluna_id: columns[0].id,
                    ...formData
                })
            }
            setModalOpen(false)
            fetchKanban()
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Excluir este card?')) {
            await api.delete(`/kanban/cards/${id}`)
            fetchKanban()
            setModalOpen(false)
        }
    }

    // Helper for Priority Colors
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'alta': return 'label-high';
            case 'media': return 'label-medium';
            case 'baixa': return 'label-low';
            default: return 'label-low';
        }
    }

    return (
        <div className="kanban-page">
            {/* Trello-like Header */}
            <header className="kanban-header">
                <div className="header-title">
                    <h1>📋 Quadro de Demandas</h1>
                    <span className="header-meta">| Área de Trabalho</span>
                </div>
                <div className="header-actions">
                    <button className="btn-trello" onClick={fetchKanban}>
                        🔄 Atualizar
                    </button>
                    {/* View Toggle Logic could go here */}
                    <button className="btn-trello primary" onClick={() => openModal()}>
                        + Novo Card
                    </button>
                </div>
            </header>

            {/* Main Board Area */}
            {loading && columns.length === 0 ? (
                <div className="loading-spinner" style={{ margin: 'auto' }}></div>
            ) : (
                <div className="kanban-board-container">
                    {/* Columns */}
                    {columns.map(col => (
                        <div
                            key={col.id}
                            className="kanban-column"
                            onDragOver={(e) => {
                                e.preventDefault(); // MANDATORY for dropping
                                e.dataTransfer.dropEffect = 'move';
                                e.currentTarget.classList.add('drag-over');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('drag-over');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('drag-over');
                                const cardId = e.dataTransfer.getData('cardId');
                                if (cardId) handleDrop(cardId, col.id);
                            }}
                        >
                            <div className="column-header">
                                <h3 className="column-title">
                                    {col.titulo}
                                    <span className="column-count">{col.cards?.length || 0}</span>
                                </h3>
                                <button className="btn-icon" style={{ opacity: 0.5 }}>•••</button>
                            </div>

                            <div className="column-body">
                                {col.cards?.map(card => (
                                    <div
                                        key={card.id}
                                        className="trello-card"
                                        draggable="true"
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('cardId', card.id);
                                            // Optional: Set Drag Image if needed, or leave default
                                            e.currentTarget.style.opacity = '0.4';
                                        }}
                                        onDragEnd={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                        onClick={(e) => {
                                            // Prevent click if it was a drag (simple heuristic or relying on browser)
                                            // For now standard onClick is fine, but we can stopPropagation if needed
                                            openModal(card);
                                        }}
                                    >
                                        {/* Color Label for Priority */}
                                        <div className="card-labels">
                                            <span className={`card-label ${getPriorityLabel(card.prioridade)}`} title={`Prioridade: ${card.prioridade}`} />
                                        </div>

                                        <h4 className="card-title">{card.titulo}</h4>

                                        {/* Card Footer Info */}
                                        <div className="card-footer">
                                            <div className="card-meta">
                                                {/* Visual indicator for movement type */}
                                                <div className="meta-item" title="Tipo">
                                                    {card.tipo_movimento === 'entrada' ? '📈' : '📉'}
                                                </div>

                                                {/* Value Badge if exists */}
                                                {Number(card.valor) > 0 && (
                                                    <span className={`valor-badge ${card.tipo_movimento}`}>
                                                        R$ {Number(card.valor).toLocaleString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Assignee Avatar (Placeholder) */}
                                            <div className="card-avatar" title="Responsável">
                                                <span>👤</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Add Column Button (Placeholder for future) */}
                    <button className="btn-trello" style={{ minWidth: '300px', justifyContent: 'center', opacity: 0.7 }}>
                        + Adicionar Coluna
                    </button>
                </div>
            )}

            {/* Empty State / Init Setup */}
            {!loading && columns.length === 0 && (
                <div className="empty-state-kanban" style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                    <h2 style={{ fontSize: '2rem' }}>👋 Bem-vindo ao seu Quadro</h2>
                    <p>Parece que está tudo vazio por aqui.</p>
                    <button className="btn-trello primary" style={{ margin: '1rem auto' }} onClick={async () => {
                        await api.post('/kanban/setup'); fetchKanban();
                    }}>
                        ⚡ Configurar Colunas Padrão
                    </button>
                </div>
            )}

            {/* Modal de Edição (Estilo Trello) */}
            {modalOpen && (
                <div className="trello-modal-overlay" onClick={(e) => e.target.className === 'trello-modal-overlay' && setModalOpen(false)}>
                    <div className="trello-modal">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <input
                                    name="titulo"
                                    placeholder="Título do card..."
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prioridade</label>
                                    <select className="trello-select" value={formData.prioridade} onChange={e => setFormData({ ...formData, prioridade: e.target.value })}>
                                        <option value="alta">🔴 Alta</option>
                                        <option value="media">🟡 Média</option>
                                        <option value="baixa">🟢 Baixa</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tipo Movimento</label>
                                    <select className="trello-select" value={formData.tipo_movimento} onChange={e => setFormData({ ...formData, tipo_movimento: e.target.value })}>
                                        <option value="saida">📉 Despesa</option>
                                        <option value="entrada">📈 Receita</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Valor Estimado (R$)</label>
                                <input
                                    type="number"
                                    className="trello-input"
                                    placeholder="0,00"
                                    value={formData.valor}
                                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    className="trello-textarea"
                                    rows="4"
                                    placeholder="Adicione detalhes..."
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                            <div className="trello-actions">
                                {editingCard && (
                                    <button type="button" className="btn-trello" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }} onClick={() => handleDelete(editingCard.id)}>
                                        🗑 Excluir
                                    </button>
                                )}
                                <button type="button" className="btn-trello" onClick={() => setModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-trello primary">
                                    {editingCard ? 'Salvar Alterações' : 'Criar Card'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
