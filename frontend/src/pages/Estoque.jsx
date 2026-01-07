import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Funcionarios.css' // Reutilizando CSS de funcionários por enquanto ou criar um novo

export default function Estoque() {
    const [produtos, setProdutos] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    // Form Data now includes 'imagem' file object and 'imagem_url' for preview
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco_venda: '',
        preco_custo: '',
        quantidade_estoque: '',
        localizacao: '',
        tipo_item: 'produto',
        margem_lucro: 0,
        imagem: null // Stores File object
    })

    useEffect(() => {
        fetchProdutos()
    }, [])

    const fetchProdutos = async () => {
        try {
            setLoading(true)
            const res = await api.get('/produtos?tipo=produto')
            setProdutos(res.data)
        } catch (error) {
            console.error('Erro ao buscar produtos', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, imagem: e.target.files[0] }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const data = new FormData();
            data.append('nome', formData.nome);
            data.append('descricao', formData.descricao);
            data.append('preco_venda', formData.preco_venda);
            data.append('preco_custo', formData.preco_custo);
            data.append('quantidade_estoque', formData.quantidade_estoque);
            data.append('localizacao', formData.localizacao);
            data.append('tipo_item', formData.tipo_item);
            data.append('margem_lucro', formData.margem_lucro);

            if (formData.imagem) {
                data.append('imagem', formData.imagem);
            }

            if (editingItem) {
                await api.put(`/produtos/${editingItem.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                await api.post('/produtos', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }
            setModalOpen(false)
            fetchProdutos()
            resetForm()
        } catch (error) {
            console.error('Erro ao salvar produto:', error)
            const errorMsg = error.response?.data?.error || error.response?.data || error.message || 'Erro desconhecido ao salvar.';
            alert(`Erro ao salvar: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este produto?')) {
            try {
                await api.delete(`/produtos/${id}`)
                fetchProdutos()
            } catch (error) {
                console.error('Erro ao deletar:', error)
            }
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                nome: item.nome,
                descricao: item.descricao || '',
                preco_venda: item.preco_venda,
                preco_custo: item.preco_custo || '',
                quantidade_estoque: item.quantidade_estoque || '',
                localizacao: item.localizacao || '',
                tipo_item: 'produto',
                margem_lucro: item.margem_lucro || 0,
                imagem: null
            })
        } else {
            resetForm()
        }
        setModalOpen(true)
    }

    const resetForm = () => {
        setEditingItem(null)
        setFormData({
            nome: '',
            descricao: '',
            preco_venda: '',
            preco_custo: '',
            quantidade_estoque: '',
            localizacao: '',
            tipo_item: 'produto',
            margem_lucro: 0,
            imagem: null
        })
    }

    return (
        <div className="funcionarios-page">
            <div className="page-header">
                <div>
                    <h1>📦 Estoque de Produtos</h1>
                    <p>Controle de inventário físico e valuation.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn-secondary"
                        onClick={() => window.open(import.meta.env.VITE_API_URL + '/setup/fix-inventory', '_blank')}
                        title="Clique aqui se as fotos não estiverem carregando"
                    >
                        🛠️ Reparar Sistema
                    </button>
                    <button className="btn-primary" onClick={() => openModal()}>
                        + Novo Produto
                    </button>
                </div>
            </div>

            {/* TOTALS SUMMARY */}
            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="funcionario-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🏭</span>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Valor de Custo (Ativo)</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                            R$ {produtos.reduce((acc, item) => acc + (Number(item.preco_custo || 0) * Number(item.quantidade_estoque || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="funcionario-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>💰</span>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Potencial de Venda</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#34d399' }}>
                            R$ {produtos.reduce((acc, item) => acc + (Number(item.preco_venda || 0) * Number(item.quantidade_estoque || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="funcionario-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📦</span>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Itens em Estoque</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                            {produtos.reduce((acc, item) => acc + Number(item.quantidade_estoque || 0), 0)} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>unid.</span>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading">Carregando estoque...</div>
            ) : (
                <div className="funcionarios-grid">
                    {produtos.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum produto cadastrado.</p>
                        </div>
                    ) : (
                        produtos.map(item => (
                            <div key={item.id} className="funcionario-card">
                                <div className="card-header">
                                    {item.imagem_url ? (
                                        <img
                                            src={item.imagem_url}
                                            alt={item.nome}
                                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder" style={{ background: '#f59e0b' }}>
                                            📦
                                        </div>
                                    )}
                                    <div className="card-info">
                                        <h3>{item.nome}</h3>
                                        <span className="cargo-badge">Qtd: {item.quantidade_estoque}</span>
                                    </div>
                                </div>

                                <div className="card-details">
                                    <p><strong>Preço Venda:</strong> R$ {Number(item.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Local:</strong> {item.localizacao || '-'}</p>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-edit" onClick={() => openModal(item)}>Editar</button>
                                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Remover</button>
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
                        <h2>{editingItem ? 'Editar Produto' : 'Novo Produto'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <label
                                    htmlFor="product-image"
                                    style={{
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        padding: '10px',
                                        border: '1px dashed rgba(255,255,255,0.3)',
                                        borderRadius: '8px'
                                    }}
                                >
                                    {formData.imagem ? '📷 Imagem Selecionada' : (editingItem?.imagem_url ? '🔄 Alterar Imagem' : '📷 Adicionar Foto')}
                                </label>
                                <input
                                    id="product-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                {editingItem?.imagem_url && !formData.imagem && (
                                    <div style={{ marginTop: '5px' }}>
                                        <img src={editingItem.imagem_url} alt="Atual" style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Nome do Produto *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Preço Venda (R$) *</label>
                                    <input
                                        type="number"
                                        name="preco_venda"
                                        value={formData.preco_venda}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Quantidade</label>
                                    <input
                                        type="number"
                                        name="quantidade_estoque"
                                        value={formData.quantidade_estoque}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Localização</label>
                                    <input
                                        type="text"
                                        name="localizacao"
                                        value={formData.localizacao}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Prateleira A"
                                    />
                                </div>
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
