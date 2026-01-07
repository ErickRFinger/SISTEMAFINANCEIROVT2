import React, { useState, useEffect, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../services/api'
import './DemandasStyles.css'

// --- COMPONENTS ---

const SortableCard = ({ card, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: card.id,
        data: {
            type: 'Card',
            card,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'alta': return 'label-high';
            case 'media': return 'label-medium';
            case 'baixa': return 'label-low';
            default: return 'label-low';
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="trello-card"
            onClick={() => onClick(card)}
        >
            <div className="card-labels">
                <span className={`card-label ${getPriorityLabel(card.prioridade)}`} title={`Prioridade: ${card.prioridade}`} />
            </div>
            <h4 className="card-title">{card.titulo}</h4>
            <div className="card-footer">
                <div className="card-meta">
                    <div className="meta-item" title="Tipo">
                        {card.tipo_movimento === 'entrada' ? '📈' : '📉'}
                    </div>
                    {Number(card.valor) > 0 && (
                        <span className={`valor-badge ${card.tipo_movimento}`}>
                            R$ {Number(card.valor).toLocaleString('pt-BR')}
                        </span>
                    )}
                </div>
                <div className="card-avatar"><span>👤</span></div>
            </div>
        </div>
    );
};

const SortableColumn = ({ column, cards, onEditColumn, onDeleteColumn, onAddCard, onCardClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

    return (
        <div ref={setNodeRef} style={style} className="kanban-column">
            <div className="column-header" {...attributes} {...listeners}>
                <h3 className="column-title">
                    {column.titulo}
                    <span className="column-count">{cards.length}</span>
                </h3>
                <div className="column-actions">
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEditColumn(column); }}>✎</button>
                    <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); onDeleteColumn(column.id); }}>×</button>
                </div>
            </div>

            <div className="column-body">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <SortableCard key={card.id} card={card} onClick={onCardClick} />
                    ))}
                </SortableContext>
            </div>
            <div className="column-footer">
                <button className="btn-add-card" onClick={() => onAddCard(column.id)}>
                    + Adicionar card
                </button>
            </div>
        </div>
    );
};


export default function Demandas() {
    const [columns, setColumns] = useState([])
    const [activeDragId, setActiveDragId] = useState(null)
    const [activeDragData, setActiveDragData] = useState(null)

    // UI States
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false) // Card Modal
    const [columnModalOpen, setColumnModalOpen] = useState(false) // Column Modal

    // Forms
    const [editingCard, setEditingCard] = useState(null)
    const [cardFormData, setCardFormData] = useState({
        titulo: '', descricao: '', valor: '', prioridade: 'media', dificuldade: 'medio',
        tipo_movimento: 'saida', data_conclusao: '', coluna_id: null
    })

    const [editingColumn, setEditingColumn] = useState(null)
    const [columnTitle, setColumnTitle] = useState('')

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

    // --- DRAG HANDLERS ---

    const onDragStart = (event) => {
        setActiveDragId(event.active.id);
        setActiveDragData(event.active.data.current);
    }

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        const isActiveCard = active.data.current?.type === 'Card';
        const isOverCard = over.data.current?.type === 'Card';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveCard) return;

        // Find source and destination columns
        const findColumn = (id) => {
            const col = columns.find(c => c.id === id);
            if (col) return col;
            return columns.find(c => c.cards.some(card => card.id === id));
        };

        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId);

        if (!activeColumn || !overColumn) return;

        if (activeColumn.id !== overColumn.id) {
            setColumns((prev) => {
                const activeColIndex = prev.findIndex((c) => c.id === activeColumn.id);
                const overColIndex = prev.findIndex((c) => c.id === overColumn.id);

                // Clone state
                const newColumns = [...prev];
                const activeCol = { ...newColumns[activeColIndex] };
                const overCol = { ...newColumns[overColIndex] };

                // Find card
                const cardIndex = activeCol.cards.findIndex(c => c.id === activeId);
                const activeCard = activeCol.cards[cardIndex];

                // Remove from active
                activeCol.cards = [...activeCol.cards];
                activeCol.cards.splice(cardIndex, 1);

                // Add to over
                overCol.cards = [...overCol.cards];
                // Check where to insert
                let newIndex;
                if (isOverCard) {
                    const overCardIndex = overCol.cards.findIndex(c => c.id === overId);
                    const isBelowOverItem = over &&
                        active.rect.current.translated &&
                        active.rect.current.translated.top > over.rect.top + over.rect.height;
                    const modifier = isBelowOverItem ? 1 : 0;
                    newIndex = overCardIndex >= 0 ? overCardIndex + modifier : overCol.cards.length + 1;
                } else {
                    newIndex = overCol.cards.length + 1;
                }

                // Update card's column ID immediately for UI consistency
                const updatedCard = { ...activeCard, coluna_id: overColumn.id };
                overCol.cards.splice(newIndex, 0, updatedCard);

                newColumns[activeColIndex] = activeCol;
                newColumns[overColIndex] = overCol;

                return newColumns;
            });
        }
    };

    const onDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragId(null);
        setActiveDragData(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        const type = active.data.current?.type;

        if (type === 'Column') {
            if (activeId !== overId) {
                setColumns((items) => {
                    const oldIndex = items.findIndex(c => c.id === activeId);
                    const newIndex = items.findIndex(c => c.id === overId);
                    return arrayMove(items, oldIndex, newIndex);
                });
                // TODO: Persist column reorder if backend supports it
            }
            return;
        }

        if (type === 'Card') {
            // Logic handled in DragOver mainly, but we need to persist here
            const findColumn = (id) => {
                const col = columns.find(c => c.id === id);
                if (col) return col;
                return columns.find(c => c.cards.some(card => card.id === id));
            };

            const activeColumn = findColumn(activeId); // Where it ended up in state
            if (activeColumn) {
                const card = activeColumn.cards.find(c => c.id === activeId);
                const cardIndex = activeColumn.cards.findIndex(c => c.id === activeId);

                // Call API
                await api.put(`/kanban/cards/${activeId}/move`, {
                    nova_coluna_id: activeColumn.id,
                    nova_posicao: cardIndex
                });
            }
        }
    }

    // --- COLUMN MANAGEMENT ---

    const handleCreateColumn = async () => {
        if (!columnTitle.trim()) return;
        try {
            if (editingColumn) {
                await api.put(`/kanban/columns/${editingColumn.id}`, { titulo: columnTitle });
            } else {
                await api.post('/kanban/columns', { titulo: columnTitle });
            }
            setColumnModalOpen(false);
            setColumnTitle('');
            setEditingColumn(null);
            fetchKanban();
        } catch (error) {
            console.error(error);
        }
    }

    const handleDeleteColumn = async (id) => {
        if (window.confirm('Tem certeza? Todos os cards desta coluna serão apagados.')) {
            try {
                await api.delete(`/kanban/columns/${id}`);
                fetchKanban();
            } catch (error) {
                console.error(error);
            }
        }
    }

    const openColumnModal = (col = null) => {
        setEditingColumn(col);
        setColumnTitle(col ? col.titulo : '');
        setColumnModalOpen(true);
    }

    // --- CARD MANAGEMENT ---

    const openCardModal = (card = null, columnId = null) => {
        if (card) {
            setEditingCard(card)
            setCardFormData({
                titulo: card.titulo,
                descricao: card.descricao || '',
                valor: card.valor || '',
                prioridade: card.prioridade || 'media',
                dificuldade: card.dificuldade || 'medio',
                tipo_movimento: card.tipo_movimento || 'saida',
                data_conclusao: card.data_conclusao ? card.data_conclusao.split('T')[0] : '',
                coluna_id: card.coluna_id
            })
        } else {
            setEditingCard(null)
            setCardFormData({
                titulo: '',
                descricao: '',
                valor: '',
                prioridade: 'media',
                dificuldade: 'medio',
                tipo_movimento: 'saida',
                data_conclusao: '',
                coluna_id: columnId || columns[0]?.id
            })
        }
        setModalOpen(true)
    }

    const handleCardSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingCard) {
                await api.put(`/kanban/cards/${editingCard.id}`, cardFormData)
            } else {
                await api.post('/kanban/cards', { ...cardFormData })
            }
            setModalOpen(false)
            fetchKanban()
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteCard = async (id) => {
        if (window.confirm('Excluir este card?')) {
            await api.delete(`/kanban/cards/${id}`)
            setModalOpen(false)
            fetchKanban()
        }
    }

    return (
        <div className="kanban-page">
            <header className="kanban-header">
                <div className="header-title">
                    <h1>📋 Quadro de Demandas</h1>
                </div>
                <div className="header-actions">
                    <button className="btn-trello" onClick={fetchKanban}>🔄 Atualizar</button>
                    <button className="btn-trello" onClick={() => openColumnModal()}>+ Add Coluna</button>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="kanban-board-container">
                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                        {columns.map(col => (
                            <SortableColumn
                                key={col.id}
                                column={col}
                                cards={col.cards || []}
                                onEditColumn={openColumnModal}
                                onDeleteColumn={handleDeleteColumn}
                                onAddCard={openCardModal}
                                onCardClick={(c) => openCardModal(c)}
                            />
                        ))}
                    </SortableContext>
                    {/* Placeholder for "Add Column" at end of list if desired */}
                </div>

                <DragOverlay>
                    {activeDragId ? (
                        activeDragData?.type === 'Column' ? (
                            <div className="kanban-column drag-overlay">
                                <div className="column-header"><h3>{activeDragData.column.titulo}</h3></div>
                            </div>
                        ) : (
                            <div className="trello-card drag-overlay">
                                <h4>{activeDragData.card.titulo}</h4>
                            </div>
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Column Modal */}
            {columnModalOpen && (
                <div className="trello-modal-overlay" onClick={(e) => e.target.className === 'trello-modal-overlay' && setColumnModalOpen(false)}>
                    <div className="trello-modal small">
                        <h2>{editingColumn ? 'Editar Coluna' : 'Nova Coluna'}</h2>
                        <input
                            className="trello-input"
                            value={columnTitle}
                            onChange={(e) => setColumnTitle(e.target.value)}
                            placeholder="Nome da coluna..."
                            autoFocus
                        />
                        <div className="trello-actions">
                            <button className="btn-trello" onClick={() => setColumnModalOpen(false)}>Cancelar</button>
                            <button className="btn-trello primary" onClick={handleCreateColumn}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Card Modal (Same as before but simplified) */}
            {modalOpen && (
                <div className="trello-modal-overlay" onClick={(e) => e.target.className === 'trello-modal-overlay' && setModalOpen(false)}>
                    <div className="trello-modal">
                        <form onSubmit={handleCardSubmit}>
                            <div className="modal-header">
                                <input
                                    name="titulo"
                                    placeholder="Título do card..."
                                    value={cardFormData.titulo}
                                    onChange={e => setCardFormData({ ...cardFormData, titulo: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prioridade</label>
                                    <select className="trello-select" value={cardFormData.prioridade} onChange={e => setCardFormData({ ...cardFormData, prioridade: e.target.value })}>
                                        <option value="alta">🔴 Alta</option>
                                        <option value="media">🟡 Média</option>
                                        <option value="baixa">🟢 Baixa</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tipo Movimento</label>
                                    <select className="trello-select" value={cardFormData.tipo_movimento} onChange={e => setCardFormData({ ...cardFormData, tipo_movimento: e.target.value })}>
                                        <option value="saida">📉 Despesa</option>
                                        <option value="entrada">📈 Receita</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Valor Estimado (R$)</label>
                                <input type="number" className="trello-input" value={cardFormData.valor} onChange={e => setCardFormData({ ...cardFormData, valor: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea className="trello-textarea" rows="4" value={cardFormData.descricao} onChange={e => setCardFormData({ ...cardFormData, descricao: e.target.value })} />
                            </div>
                            <div className="trello-actions">
                                {editingCard && (
                                    <button type="button" className="btn-trello danger" onClick={() => handleDeleteCard(editingCard.id)}>🗑 Excluir</button>
                                )}
                                <button type="button" className="btn-trello" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-trello primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
