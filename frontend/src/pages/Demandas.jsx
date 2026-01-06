import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Demandas.css'

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

    // Drag & Drop Mock (Simples para garantir funcionamento sem dnd-kit pesado)
    // Para produção real, usaríamos react-beautiful-dnd, mas aqui vamos focar no visual + ações de botão "Mover"
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

    const openModal = (card = null, colId = null) => {
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
            // Se tiver colId, pre-setar (mas form nao tem campo coluna ainda, assume a primeira)
        }
        setModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingCard) {
                await api.put(`/kanban/cards/${editingCard.id}`, formData)
            } else {
                // Criar na primeira coluna
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
        if (window.confirm('Excluir card?')) {
            await api.delete(`/kanban/cards/${id}`)
            fetchKanban()
        }
    }

    return (
        <div className="kanban-page">
            <div className="page-header" style={{ padding: '0 1rem' }}>
                <div>
                    <h1>📑 Demandas e Projetos</h1>
                    <p>Fluxo de trabalho visual (Kanban)</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={fetchKanban} title="Recarregar quadro">🔄</button>
                    <button className={`btn-secondary ${viewMode === 'list' && 'active'}`} onClick={() => setViewMode('list')}>Lista</button>
                    <button className={`btn-secondary ${viewMode === 'kanban' && 'active'}`} onClick={() => setViewMode('kanban')}>Quadro</button>
                    <button className="btn-primary" onClick={() => openModal()}>+ Demanda</button>
                </div>
            </div>

            {loading ? <div className="loading">Carregando Quadro...</div> : (
                <>
                    {viewMode === 'kanban' ? (
                        <div className="kanban-board">
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className="kanban-column"
                                    onDragOver={(e) => {
                                        e.preventDefault();
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
                                    <div className="kanban-column-header">
                                        <h3>{col.titulo}</h3>
                                        <span className="count-badge">{col.cards?.length || 0}</span>
                                    </div>
                                    <div className="kanban-column-body">
                                        {col.cards?.map(card => (
                                            <div
                                                key={card.id}
                                                className="kanban-card"
                                                draggable="true"
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('cardId', card.id);
                                                    e.currentTarget.style.opacity = '0.5';
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.style.opacity = '1';
                                                }}
                                            >
                                                <div className="kanban-card-top">
                                                    <span className={`priority-dot ${card.prioridade}`} />
                                                    {card.tipo_movimento === 'entrada' ? '💰' : '💸'}
                                                </div>
                                                <h4>{card.titulo}</h4>
                                                {card.valor && <p className="kanban-value">R$ {Number(card.valor).toLocaleString('pt-BR')}</p>}

                                                <div className="kanban-controls">
                                                    <button className="btn-icon" onClick={() => openModal(card)}>✎</button>
                                                    <button className="btn-icon delete" onClick={() => handleDelete(card.id)}>🗑</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // MODO LISTA (Simples)
                        <div className="list-view container">
                            {columns.flatMap(c => c.cards).map(card => (
                                <div key={card.id} className="list-item-card">
                                    <span>{card.titulo}</span>
                                    <span>{card.status}</span>
                                    <span>R$ {card.valor}</span>
                                    <button onClick={() => openModal(card)}>Editar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Empty State / Init Setup */}
            {!loading && columns.length === 0 && (
                <div className="empty-state-kanban" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h2>⚠️ Quadro Vazio</h2>
                    <p>Você ainda não tem colunas configuradas.</p>
                    <button
                        className="btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={async () => {
                            try {
                                setLoading(true)
                                await api.post('/kanban/setup')
                                fetchKanban()
                            } catch (e) {
                                alert('Erro ao criar colunas: ' + e.message)
                                setLoading(false)
                            }
                        }}
                    >
                        ⚡ Criar Colunas Padrão
                    </button>
                </div>
            )}


            {/* Modal - Reutilizar estrutura simples */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingCard ? 'Editar' : 'Nova'} Demanda</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Título</label>
                                <input name="titulo" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Valor (R$)</label>
                                <input type="number" name="valor" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Movimento</label>
                                <select name="tipo_movimento" value={formData.tipo_movimento} onChange={e => setFormData({ ...formData, tipo_movimento: e.target.value })}>
                                    <option value="saida">Despesa</option>
                                    <option value="entrada">Receita</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setModalOpen(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-confirm">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
