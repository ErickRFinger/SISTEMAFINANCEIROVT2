import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './Dashboard.css' // Reusing dashboard styles for cards

export default function Vendas() {
    const [view, setView] = useState('pdv') // 'pdv' or 'history'

    // PDV State
    const [clientes, setClientes] = useState([])
    const [produtos, setProdutos] = useState([]) // Catálogo
    const [carrinho, setCarrinho] = useState([])
    const [selectedCliente, setSelectedCliente] = useState('')
    const [buscaProduto, setBuscaProduto] = useState('')
    const [pagamento, setPagamento] = useState('dinheiro')
    const [loading, setLoading] = useState(false)

    // History State
    const [historico, setHistorico] = useState([])

    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            const [cliRes, prodRes] = await Promise.all([
                api.get('/clientes'),
                api.get('/produtos')
            ])
            setClientes(cliRes.data || [])
            setProdutos(prodRes.data || [])
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        }
    }

    const addToCart = (produto) => {
        setCarrinho(prev => {
            const exists = prev.find(item => item.id === produto.id)
            if (exists) {
                return prev.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item)
            }
            return [...prev, { ...produto, quantidade: 1, preco: produto.preco_venda }]
        })
    }

    const removeFromCart = (prodId) => {
        setCarrinho(prev => prev.filter(item => item.id !== prodId))
    }

    const finalizarVenda = async () => {
        if (carrinho.length === 0) return alert('Carrinho vazio!')

        try {
            setLoading(true)
            await api.post('/vendas', {
                cliente_id: selectedCliente,
                itens: carrinho,
                forma_pagamento: pagamento,
                desconto: 0,
                observacoes: 'Venda via PDV'
            })
            alert('✅ Venda realizada com sucesso!')
            setCarrinho([])
            setSelectedCliente('')
            // Recarregar produtos para atualizar estoque visualmente
            const prodRes = await api.get('/produtos')
            setProdutos(prodRes.data)
        } catch (error) {
            console.error(error)
            alert('Erro ao finalizar venda')
        } finally {
            setLoading(false)
        }
    }

    const loadHistory = async () => {
        const res = await api.get('/vendas')
        setHistorico(res.data)
        setView('history')
    }

    // Filter products
    const filteredProdutos = produtos.filter(p =>
        p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
    )

    const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0)

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h1>🏪 Frente de Caixa (PDV)</h1>
                    <p className="subtitle">Vendas, Estoque e Financeiro integrados.</p>
                </div>
                <div>
                    <button className={`btn-secondary ${view === 'pdv' ? 'active' : ''}`} onClick={() => setView('pdv')} style={{ marginRight: 10 }}>Nova Venda</button>
                    <button className={`btn-secondary ${view === 'history' ? 'active' : ''}`} onClick={loadHistory}>Histórico</button>
                </div>
            </div>

            {view === 'pdv' ? (
                <div className="pdv-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                    {/* LEFT: Catálogo */}
                    <div className="card">
                        <input
                            placeholder="🔍 Buscar produto..."
                            value={buscaProduto}
                            onChange={e => setBuscaProduto(e.target.value)}
                            style={{ width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                        />
                        <div className="produtos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                            {filteredProdutos.map(prod => (
                                <div key={prod.id} className="produto-card" onClick={() => addToCart(prod)} style={{ padding: '1rem', background: '#0f172a', borderRadius: '8px', cursor: 'pointer', border: '1px solid #334155' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>{prod.nome}</h4>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Estoque: {prod.quantidade_estoque}</p>
                                    <p style={{ color: '#10b981', fontWeight: 'bold' }}>R$ {prod.preco_venda}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Carrinho */}
                    <div className="card carrinho-panel" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                        <h3>🛒 Carrinho</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label>Cliente</label>
                            <select
                                value={selectedCliente}
                                onChange={e => setSelectedCliente(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#1e293b', color: 'white', border: '1px solid #334155', marginTop: '4px' }}
                            >
                                <option value="">Consumidor Final</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>

                        <div className="carrinho-items" style={{ flex: 1, maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {carrinho.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #334155' }}>
                                    <div>
                                        <span>{item.quantidade}x {item.nome}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <span>R$ {item.preco * item.quantidade}</span>
                                        <span onClick={() => removeFromCart(item.id)} style={{ cursor: 'pointer', color: '#ef4444' }}>✖</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="carrinho-footer" style={{ borderTop: '2px solid #334155', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                <span>Total</span>
                                <span>R$ {totalCarrinho.toFixed(2)}</span>
                            </div>

                            <label>Pagamento</label>
                            <select
                                value={pagamento}
                                onChange={e => setPagamento(e.target.value)}
                                style={{ width: '100%', padding: '8px', marginBottom: '1rem', background: '#1e293b', color: 'white', border: '1px solid #334155' }}
                            >
                                <option value="dinheiro">Dinheiro</option>
                                <option value="pix">PIX</option>
                                <option value="cartao_credito">Cartão Crédito</option>
                                <option value="cartao_debito">Cartão Débito</option>
                            </select>

                            <button className="btn-primary" onClick={finalizarVenda} disabled={loading} style={{ width: '100%', fontSize: '1.2rem' }}>
                                {loading ? 'Processando...' : 'Finalizar Venda'}
                            </button>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="card">
                    <h3>📜 Histórico de Vendas</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '8px' }}>ID</th>
                                <th style={{ padding: '8px' }}>Data</th>
                                <th style={{ padding: '8px' }}>Cliente</th>
                                <th style={{ padding: '8px' }}>Valor</th>
                                <th style={{ padding: '8px' }}>Pagamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historico.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '8px' }}>#{v.id}</td>
                                    <td style={{ padding: '8px' }}>{new Date(v.data_venda).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px' }}>{v.cliente?.nome || 'Consumidor Final'}</td>
                                    <td style={{ padding: '8px' }}>R$ {Number(v.valor_total).toFixed(2)}</td>
                                    <td style={{ padding: '8px' }}>{v.forma_pagamento}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
