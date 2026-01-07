import React, { useState, useEffect, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
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
        id: `card-${card.id}`, // Prefix Card ID
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

    // ... (keep label logic same)
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
        id: `col-${column.id}`, // Prefix Column ID
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

    // Card IDs for SortableContext must also be prefixed
    const cardIds = useMemo(() => cards.map((c) => `card-${c.id}`), [cards]);

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

    // ... (keep standard states)
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [columnModalOpen, setColumnModalOpen] = useState(false)

    // Forms
    const [editingCard, setEditingCard] = useState(null)
    const [cardFormData, setCardFormData] = useState({
        titulo: '', descricao: '', valor: '', prioridade: 'media', dificuldade: 'medio',
        tipo_movimento: 'saida', data_conclusao: '', coluna_id: null, responsavel_id: '', cliente_id: ''
    })

    const [editingColumn, setEditingColumn] = useState(null)
    const [columnTitle, setColumnTitle] = useState('')

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

    const onDragStart = (event) => {
        setActiveDragId(event.active.id); // This will be 'card-1' or 'col-1'
        setActiveDragData(event.active.data.current);
    }

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        // IDs are prefixed
        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        const isActiveCard = activeIdStr.startsWith('card-');
        const isOverCard = overIdStr.startsWith('card-');
        const isOverColumn = overIdStr.startsWith('col-');

        if (!isActiveCard) return; // Only process card drags in DragOver for sorting

        const getRealId = (str) => parseInt(str.split('-')[1]);

        // Helper to find column containing a card (by real ID) or by column ID
        const findColumn = (idStr) => {
            if (idStr.startsWith('col-')) {
                return columns.find(c => c.id === getRealId(idStr));
            }
            if (idStr.startsWith('card-')) {
                return columns.find(c => c.cards.some(card => card.id === getRealId(idStr)));
            }
            return null;
        };

        const activeColumn = findColumn(activeIdStr);
        const overColumn = findColumn(overIdStr);

        if (!activeColumn || !overColumn) return;

        if (activeColumn.id !== overColumn.id) {
            setColumns((prev) => {
                const activeColIndex = prev.findIndex((c) => c.id === activeColumn.id);
                const overColIndex = prev.findIndex((c) => c.id === overColumn.id);

                const newColumns = [...prev];
                const activeCol = { ...newColumns[activeColIndex] };
                const overCol = { ...newColumns[overColIndex] };

                const realActiveCardId = getRealId(activeIdStr);
                const cardIndex = activeCol.cards.findIndex(c => c.id === realActiveCardId);
                const activeCard = activeCol.cards[cardIndex];

                if (!activeCard) return prev; // Safety

                // Remove from source
                activeCol.cards = [...activeCol.cards];
                activeCol.cards.splice(cardIndex, 1);

                // Add to target
                overCol.cards = [...overCol.cards];
                let newIndex;
                if (isOverCard) {
                    const realOverCardId = getRealId(overIdStr);
                    const overCardIndex = overCol.cards.findIndex(c => c.id === realOverCardId);

                    const isBelowOverItem = over &&
                        active.rect.current.translated &&
                        active.rect.current.translated.top > over.rect.top + over.rect.height;
                    const modifier = isBelowOverItem ? 1 : 0;
                    newIndex = overCardIndex >= 0 ? overCardIndex + modifier : overCol.cards.length + 1;
                } else {
                    newIndex = overCol.cards.length + 1;
                }

                // Update card's internal column ID
                const updatedCard = { ...activeCard, coluna_id: overColumn.id };

                // Safe splice
                if (newIndex > overCol.cards.length) newIndex = overCol.cards.length;
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

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);
        const type = active.data.current?.type;

        const getRealId = (str) => parseInt(str.split('-')[1]);

        // --- COLUMN SORTING ---
        if (type === 'Column') {
            if (activeIdStr !== overIdStr) {
                setColumns((items) => {
                    const oldIndex = items.findIndex(c => c.id === getRealId(activeIdStr));
                    const newIndex = items.findIndex(c => c.id === getRealId(overIdStr));
                    return arrayMove(items, oldIndex, newIndex);
                });
                // TODO: Save column order if backend supports it
            }
            return;
        }

        // --- CARD SORTING / MOVING ---
        if (type === 'Card') {
            const findColumn = (idStr) => {
                if (idStr.startsWith('col-')) return columns.find(c => c.id === getRealId(idStr));
                return columns.find(c => c.cards.some(card => card.id === getRealId(idStr)));
            };

            const activeColumn = findColumn(activeIdStr);
            const realActiveId = getRealId(activeIdStr);

            if (activeColumn) {
                const cardIndex = activeColumn.cards.findIndex(c => c.id === realActiveId);

                // Call API to persist move
                await api.put(`/kanban/cards/${realActiveId}/move`, {
                    nova_coluna_id: activeColumn.id,
                    nova_posicao: cardIndex
                });
            }
        }
    }

    // Keep all standard handlers (Modal, Create, Delete, etc.)
    // ...

    // ... (handlers like handleCreateColumn, handleDeleteColumn, etc. remain unchanged, skipping for brevity in replacement)
    // Actually, I need to include them or ensure previous code is preserved.
    // Since I'm replacing a huge block, I'll resume standard functions.

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
                coluna_id: card.coluna_id,
                responsavel_id: card.responsavel_id || '',
                cliente_id: card.cliente_id || ''
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
                coluna_id: columnId || columns[0]?.id,
                responsavel_id: '',
                cliente_id: ''
            })
        }
        setModalOpen(true)
    }

    const handleCardSubmit = async (e) => {
        e.preventDefault();
        try {
            const defaultColumnId = columns.length > 0 ? columns[0].id : null;
            const finalColId = cardFormData.coluna_id || defaultColumnId;

            if (!finalColId) {
                alert('Erro: Nenhuma coluna encontrada. Crie uma coluna primeiro.');
                return;
            }

            const payload = {
                ...cardFormData,
                coluna_id: finalColId,
                valor: Number(cardFormData.valor || 0),
                responsavel_id: cardFormData.responsavel_id || null,
                cliente_id: cardFormData.cliente_id || null
            };

            if (editingCard && editingCard.id) {
                await api.put(`/kanban/cards/${editingCard.id}`, payload);
            } else {
                await api.post('/kanban/cards', payload);
            }

            setModalOpen(false);
            setEditingCard(null);
            fetchKanban();
        } catch (error) {
            console.error('Erro ao salvar card:', error);
            const msg = error.response?.data?.error || 'Erro ao salvar.';
            alert(msg);
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
                    <SortableContext items={columns.map(c => `col-${c.id}`)} strategy={horizontalListSortingStrategy}>
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

            {/* Modal Components */}
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
