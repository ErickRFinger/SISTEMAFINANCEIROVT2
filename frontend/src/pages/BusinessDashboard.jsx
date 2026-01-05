import React, { useState, useEffect } from 'react'
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

    useEffect(() => {
        // Mock Data simulation (since we are setting up)
        setTimeout(() => {
            setStats({
                faturamento: 15400.50,
                receber: 3200.00,
                pagar: 1800.00,
                lucro: 13600.50
            })
            setChartData([
                { name: 'Sem 1', valor: 2000 },
                { name: 'Sem 2', valor: 4500 },
                { name: 'Sem 3', valor: 3800 },
                { name: 'Sem 4', valor: 5100 },
            ])
            setLoading(false)
        }, 1000)
    }, [])

    if (loading) return <div className="loading">Carregando Painel Empresarial...</div>

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>🚀 Business Dashboard</h1>
                    <p className="subtitle">Visão estratégica da sua empresa</p>
                </div>
                <div className="date-badge">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card premium-card">
                    <div className="stat-icon income-icon">💰</div>
                    <div className="stat-info">
                        <h3>Faturamento</h3>
                        <p className="stat-value">R$ {stats.faturamento.toLocaleString('pt-BR')}</p>
                        <span className="stat-trend positive">+12% vs mês anterior</span>
                    </div>
                </div>

                <div className="stat-card premium-card">
                    <div className="stat-icon balance-icon">📈</div>
                    <div className="stat-info">
                        <h3>Lucro Líquido</h3>
                        <p className="stat-value">R$ {stats.lucro.toLocaleString('pt-BR')}</p>
                        <span className="stat-trend positive">Margem excelente</span>
                    </div>
                </div>

                <div className="stat-card premium-card">
                    <div className="stat-icon expense-icon">💸</div>
                    <div className="stat-info">
                        <h3>A Pagar</h3>
                        <p className="stat-value text-danger">R$ {stats.pagar.toLocaleString('pt-BR')}</p>
                        <span className="stat-trend">Vence em breve</span>
                    </div>
                </div>

                <div className="stat-card premium-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>🕒</div>
                    <div className="stat-info">
                        <h3>A Receber</h3>
                        <p className="stat-value text-warning">R$ {stats.receber.toLocaleString('pt-BR')}</p>
                        <span className="stat-trend">Projeção futura</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-content-grid">
                <div className="chart-container premium-card main-chart">
                    <h3>Fluxo de Caixa (Mensal)</h3>
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
                                />
                                <Area type="monotone" dataKey="valor" stroke="#6366f1" fillOpacity={1} fill="url(#colorValor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Recent Activity */}
                <div className="side-panel premium-card">
                    <h3>Atalhos Rápidos</h3>
                    <div className="quick-actions-list">
                        <button className="action-item">
                            <span>📦</span> Novo Produto
                        </button>
                        <button className="action-item">
                            <span>🤝</span> Novo Cliente
                        </button>
                        <button className="action-item">
                            <span>📑</span> Criar Demanda
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
