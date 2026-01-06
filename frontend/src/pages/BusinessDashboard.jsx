import React, { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import './Dashboard.css' // Reutilizar estilos premium

export default function BusinessDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        faturamento: 0,
        receber: 0,
        pagar: 0,
        lucro: 0
    })
    const [chartData, setChartData] = useState([])

    // Date State
    const hoje = new Date()
    const [mesAno, setMesAno] = useState({
        mes: String(hoje.getMonth() + 1).padStart(2, '0'),
        ano: String(hoje.getFullYear())
    })

    const fetchBusinessData = useCallback(async () => {
        try {
            setLoading(true)

            // 1. Fetch Resumo Financeiro (Same as Personal)
            // Maps: Receitas -> Faturamento, Despesas -> A Pagar, Saldo -> Lucro
            const resumoRes = await api.get('/transacoes/resumo/saldo', { params: mesAno })
            const resumo = resumoRes.data || { receitas: 0, despesas: 0, saldo: 0 }

            setStats({
                faturamento: Number(resumo.receitas),
                receber: 0, // Not implemented in backend yet
                pagar: Number(resumo.despesas),
                lucro: Number(resumo.saldo)
            })

            // 2. Fetch Transactions for Chart
            const transacoesRes = await api.get('/transacoes', { params: mesAno })
            const transacoes = Array.isArray(transacoesRes.data) ? transacoesRes.data : []

            // Process Chart Data (Group by Day)
            const dailyData = transacoes.reduce((acc, t) => {
                if (t.tipo === 'receita') {
                    const dia = new Date(t.data).getDate()
                    acc[dia] = (acc[dia] || 0) + Number(t.valor)
                }
                return acc
            }, {})

            // Format for Recharts
            const formattedChartData = Object.keys(dailyData).map(dia => ({
                name: `Dia ${dia}`,
                valor: dailyData[dia]
            })).sort((a, b) => {
                const diaA = parseInt(a.name.split(' ')[1])
                const diaB = parseInt(b.name.split(' ')[1])
                return diaA - diaB
            })

            setChartData(formattedChartData)

        } catch (error) {
            console.error('Erro ao buscar dados empresariais:', error)
        } finally {
            setLoading(false)
        }
    }, [mesAno])

    useEffect(() => {
        fetchBusinessData()
    }, [fetchBusinessData])

    if (loading) return <div className="loading">Carregando Painel Empresarial...</div>

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>🚀 Business Dashboard</h1>
                    <p className="subtitle">Visão estratégica da sua empresa</p>
                </div>

                {/* Date Selector */}
                <div className="mes-selector">
                    <input
                        type="month"
                        value={`${mesAno.ano}-${mesAno.mes}`}
                        onChange={(e) => {
                            const [ano, mes] = e.target.value.split('-')
                            setMesAno({ mes, ano })
                        }}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card premium-card">
                    <div className="stat-icon income-icon">💰</div>
                    <div className="stat-info">
                        <h3>Faturamento</h3>
                        <p className="stat-value">R$ {stats.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <span className="stat-trend positive">Receita Bruta</span>
                    </div>
                </div>

                <div className="stat-card premium-card">
                    <div className="stat-icon balance-icon">📈</div>
                    <div className="stat-info">
                        <h3>Lucro Líquido</h3>
                        <p className="stat-value">R$ {stats.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <span className={`stat-trend ${stats.lucro >= 0 ? 'positive' : 'negative'}`}>
                            {stats.lucro >= 0 ? 'Lucro' : 'Prejuízo'}
                        </span>
                    </div>
                </div>

                <div className="stat-card premium-card">
                    <div className="stat-icon expense-icon">💸</div>
                    <div className="stat-info">
                        <h3>Despesas Operacionais</h3>
                        <p className="stat-value text-danger">R$ {stats.pagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <span className="stat-trend">Total Gasto</span>
                    </div>
                </div>

                <div className="stat-card premium-card" style={{ opacity: 0.7 }}>
                    <div className="stat-icon" style={{ background: '#e5e7eb', color: '#6b7280' }}>🔒</div>
                    <div className="stat-info">
                        <h3>A Receber</h3>
                        <p className="stat-value" style={{ fontSize: '1.2rem', color: '#6b7280' }}>Em Breve</p>
                        <span className="stat-trend">Funcionalidade futura</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-content-grid">
                <div className="chart-container premium-card main-chart">
                    <h3>Fluxo de Receita (Diário)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px' }}
                                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#6366f1" fillOpacity={1} fill="url(#colorValor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        {chartData.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', marginTop: '-150px' }}>
                                Sem dados de receita para este mês.
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="side-panel premium-card">
                    <h3>Atalhos Rápidos</h3>
                    <div className="quick-actions-list">
                        <button className="action-item" onClick={() => window.location.href = '/produtos'}>
                            <span>📦</span> Gerenciar Estoque
                        </button>
                        <button className="action-item" onClick={() => window.location.href = '/clientes'}>
                            <span>🤝</span> Base de Clientes
                        </button>
                        <button className="action-item" onClick={() => window.location.href = '/kanban'}>
                            <span>📑</span> Quadro Kanban
                        </button>
                        <button className="action-item" onClick={() => window.location.href = '/funcionarios'}>
                            <span>👥</span> Equipe
                        </button>
                    </div>

                    <h3 style={{ marginTop: '2rem' }}>Status do Sistema</h3>
                    <div className="server-status">
                        <div className="status-item">
                            <span className="status-dot online"></span>
                            Banco de Dados Conectado
                        </div>
                        <div className="status-item">
                            <span className="status-dot online"></span>
                            API Operacional
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
