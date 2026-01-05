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
    const moveCard = async (card, direction) => {
        // Encontrar colunas adjacentes
        // Esta lógica seria no backend idealmente, mas vamos simplificar:
        // Apenas abrimos o modal de edição e o usuário muda o status? 
        // Não, o usuário pediu Kanban Funcionando.
        // Vamos fazer botões [<] [>] no card para mover de coluna.

        try {
            const currentAxis = columns.findIndex(col => col.titulo === card.status)
            let targetColIndex = direction === 'next' ? currentAxis + 1 : currentAxis - 1

            if (targetColIndex >= 0 && targetColIndex < columns.length) {
                const targetCol = columns[targetColIndex]
                // Use the specific MOVE endpoint
                await api.put(`/kanban/cards/${card.id}/move`, {
                    nova_coluna_id: targetCol.id
                })
                fetchKanban()
            }
        } catch (e) { console.error(e) }
    }

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
                                <div key={col.id} className="kanban-column">
                                    <div className="kanban-column-header">
                                        <h3>{col.titulo}</h3>
                                        <span className="count-badge">{col.cards?.length || 0}</span>
                                    </div>
                                    <div className="kanban-column-body">
                                        {col.cards?.map(card => (
                                            <div key={card.id} className="kanban-card">
                                                <div className="kanban-card-top">
                                                    <span className={`priority-dot ${card.prioridade}`} />
                                                    {card.tipo_movimento === 'entrada' ? '💰' : '💸'}
                                                </div>
                                                <h4>{card.titulo}</h4>
                                                {card.valor && <p className="kanban-value">R$ {Number(card.valor).toLocaleString('pt-BR')}</p>}

                                                <div className="kanban-controls">
                                                    <button onClick={() => moveCard(card, 'prev')} disabled={col.titulo === columns[0].titulo}>←</button>
                                                    <button onClick={() => openModal(card)}>✎</button>
                                                    <button onClick={() => handleDelete(card.id)}>🗑</button>
                                                    <button onClick={() => moveCard(card, 'next')} disabled={col.titulo === columns[columns.length - 1].titulo}>→</button>
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
