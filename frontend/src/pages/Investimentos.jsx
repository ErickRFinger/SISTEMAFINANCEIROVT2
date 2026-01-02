import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import './Investimentos.css'

export default function Investimentos() {
    const [investimentos, setInvestimentos] = useState([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [stats, setStats] = useState({ investido: 0, atual: 0, rendimento: 0, percentual: 0 })

    const [form, setForm] = useState({
        nome: '',
        tipo: 'renda_fixa',
        instituicao: '',
        valor_investido: '',
        valor_atual: '',
        data_aplicacao: new Date().toISOString().split('T')[0],
        observacoes: ''
    })

    const tiposInvestimento = {
        renda_fixa: { label: 'Renda Fixa', color: '#3b82f6', icon: '🏦' },
        acoes: { label: 'Ações', color: '#f59e0b', icon: '📈' },
        fiis: { label: 'FIIs', color: '#8b5cf6', icon: '🏢' },
        cripto: { label: 'Criptomoedas', color: '#ef4444', icon: '₿' },
        tesouro: { label: 'Tesouro Direto', color: '#10b981', icon: '🏛️' },
        fundos: { label: 'Fundos', color: '#ec4899', icon: '📊' },
        outros: { label: 'Outros', color: '#6b7280', icon: '💎' }
    }

    useEffect(() => {
        carregarInvestimentos()
    }, [])

    const carregarInvestimentos = async () => {
        setLoading(true)
        try {
            const res = await api.get('/investimentos')
            const lista = res.data || []
            setInvestimentos(lista)
            calcularTotais(lista)
        } catch (error) {
            console.error('Erro ao carregar:', error)
        } finally {
            setLoading(false)
        }
    }

    const calcularTotais = (lista) => {
        const investido = lista.reduce((acc, curr) => acc + Number(curr.valor_investido || 0), 0)
        const atual = lista.reduce((acc, curr) => acc + Number(curr.valor_atual || 0), 0)
        const rendimento = atual - investido
        const percentual = investido > 0 ? (rendimento / investido) * 100 : 0

        setStats({ investido, atual, rendimento, percentual })
    }

    // Calcula dados para o Gráfico de Rosca
    const chartData = useMemo(() => {
        const agrp = {}
        let total = 0
        investimentos.forEach(inv => {
            const val = Number(inv.valor_atual || 0)
            if (val > 0) {
                agrp[inv.tipo] = (agrp[inv.tipo] || 0) + val
                total += val
            }
        })

        let accumPercent = 0
        return Object.entries(agrp).map(([tipo, valor]) => {
            const percent = (valor / total) * 100
            const start = accumPercent
            accumPercent += percent
            return {
                tipo,
                percent,
                start,
                color: tiposInvestimento[tipo]?.color || '#ccc',
                label: tiposInvestimento[tipo]?.label
            }
        }).sort((a, b) => b.percent - a.percent)
    }, [investimentos])

    const handleSubmit = async (e) => {
        e.preventDefault()
        const parseValue = (val) => {
            if (!val) return 0
            return parseFloat(String(val).replace(',', '.'))
        }

        const valInvestido = parseValue(form.valor_investido)
        const valAtual = form.valor_atual ? parseValue(form.valor_atual) : valInvestido

        const payload = {
            ...form,
            valor_investido: valInvestido,
            valor_atual: valAtual,
        }

        try {
            setLoading(true)
            await api.post('/investimentos', payload)
            alert('Investimento salvo!')
            setShowForm(false)
            setForm({
                nome: '', tipo: 'renda_fixa', instituicao: '',
                valor_investido: '', valor_atual: '',
                data_aplicacao: new Date().toISOString().split('T')[0], observacoes: ''
            })
            carregarInvestimentos()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Excluir este item?')) return
        try {
            await api.delete(`/investimentos/${id}`)
            carregarInvestimentos()
        } catch (error) {
            alert('Erro ao excluir')
        }
    }

    const formatar = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

    // Renderiza Pie Chart via SVG (Conic Gradient simulado com paths)
    // Usando conic-gradient CSS é mais fácil para donut simples
    const renderDonut = () => {
        if (chartData.length === 0) return <div style={{ opacity: 0.5 }}>Sem dados</div>

        let gradientStr = chartData.map(d => `${d.color} 0 ${d.percent}%`).join(', ')
        // Para conic-gradient funcionar sequencialmente, precisa de offsets. 
        // Melhor abordagem simples: conic-gradient

        const gradientParts = []
        let currentPos = 0
        chartData.forEach(d => {
            gradientParts.push(`${d.color} ${currentPos}% ${(currentPos + d.percent)}%`)
            currentPos += d.percent
        })

        return (
            <div
                className="donut-chart"
                style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: `conic-gradient(${gradientParts.join(', ')})`,
                    position: 'relative',
                    margin: '0 auto'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '110px', height: '110px',
                    background: 'var(--bg-card)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>TOTAL</span>
                    <span style={{ fontWeight: 'bold' }}>{formatar(stats.atual)}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="investimentos-container">
            <header className="investimentos-header">
                <div>
                    <h2>Meus Investimentos</h2>
                    <p className="investimentos-subtitle">Gerencie seu patrimônio e acompanhe rendimentos</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{ padding: '0.75rem 1.5rem' }}
                >
                    {showForm ? 'Fechar' : '+ Novo Aporte'}
                </button>
            </header>

            {/* DASHBOARD GRID */}
            <div className="invest-dashboard">
                {/* CHART SECTION */}
                <div className="chart-card">
                    {renderDonut()}
                    <div className="legend-grid">
                        {chartData.map(d => (
                            <div key={d.tipo} className="legend-item">
                                <div className="legend-color" style={{ background: d.color }}></div>
                                <span>{d.label} ({Math.round(d.percent)}%)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* STATS SECTION */}
                <div className="invest-stats-grid">
                    <div className="invest-stat-card">
                        <div className="invest-stat-header">
                            <div className="invest-stat-icon total">💰</div>
                            <span className="invest-stat-label">Valor Total</span>
                        </div>
                        <span className="invest-stat-value">{formatar(stats.atual)}</span>
                        <small style={{ opacity: 0.6 }}>Aplicado: {formatar(stats.investido)}</small>
                    </div>

                    <div className="invest-stat-card">
                        <div className="invest-stat-header">
                            <div className={`invest-stat-icon ${stats.rendimento >= 0 ? 'profit' : 'yield'}`}>
                                {stats.rendimento >= 0 ? '🚀' : '📉'}
                            </div>
                            <span className="invest-stat-label">Rendimento</span>
                        </div>
                        <span className={`invest-stat-value ${stats.rendimento >= 0 ? 'positive' : 'negative'}`}>
                            {stats.rendimento >= 0 ? '+' : ''}{formatar(stats.rendimento)}
                        </span>
                        <small style={{ color: stats.rendimento >= 0 ? '#34d399' : '#f87171' }}>
                            {stats.percentual.toFixed(2)}% de retorno
                        </small>
                    </div>
                </div>
            </div>

            {/* FORMULÁRIO */}
            {showForm && (
                <form onSubmit={handleSubmit} className="form-card fade-in">
                    <h3 style={{ marginBottom: '1.5rem' }}>Novo Aporte</h3>
                    <div className="grid grid-2">
                        <label>
                            Nome do Ativo
                            <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: PETR4, Tesouro Selic..." />
                        </label>
                        <label>
                            Tipo
                            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                {Object.entries(tiposInvestimento).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </label>
                        <label>
                            Instituição
                            <input value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} placeholder="Ex: Nubank, XP..." />
                        </label>
                        <label>
                            Valor Investido (R$)
                            <input required value={form.valor_investido} type="number" step="0.01" onChange={e => setForm({ ...form, valor_investido: e.target.value })} />
                        </label>
                        <label>
                            Valor Atual (R$)
                            <input value={form.valor_atual} type="number" step="0.01" onChange={e => setForm({ ...form, valor_atual: e.target.value })} placeholder="Deixe vazio se for igual" />
                        </label>
                        <label>
                            Data Aplicação
                            <input type="date" value={form.data_aplicacao} onChange={e => setForm({ ...form, data_aplicacao: e.target.value })} />
                        </label>
                    </div>
                    <button className="btn-success full-width mt-4" disabled={loading}>
                        {loading ? 'Salvando...' : 'Confirmar Aporte'}
                    </button>
                </form>
            )}

            {/* ASSETS GRID */}
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', opacity: 0.8 }}>Meus Ativos</h3>

            {investimentos.length === 0 ? (
                <p style={{ opacity: 0.5 }}>Nenhum investimento cadastrado ainda.</p>
            ) : (
                <div className="assets-grid">
                    {investimentos.map(inv => {
                        const style = tiposInvestimento[inv.tipo] || tiposInvestimento['outros']
                        const rentabilidade = ((inv.valor_atual - inv.valor_investido) / inv.valor_investido) * 100

                        return (
                            <div key={inv.id} className={`asset-card ${inv.tipo}`}>
                                <div className="asset-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div className="asset-icon-placeholder" style={{ color: style.color, background: `${style.color}20` }}>
                                            {style.icon}
                                        </div>
                                        <div className="asset-info">
                                            <h4>{inv.nome}</h4>
                                            <span>{style.label} • {inv.instituicao}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(inv.id)} className="btn-icon" style={{ opacity: 0.5 }}>🗑️</button>
                                </div>

                                <div className="asset-values">
                                    <div className="asset-val-item">
                                        <span>Valor Atual</span>
                                        <strong>{formatar(inv.valor_atual)}</strong>
                                    </div>
                                    <div className="asset-val-item" style={{ textAlign: 'right' }}>
                                        <span>Retorno</span>
                                        <strong style={{ color: rentabilidade >= 0 ? '#34d399' : '#f87171' }}>
                                            {rentabilidade >= 0 ? '+' : ''}{rentabilidade.toFixed(2)}%
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
