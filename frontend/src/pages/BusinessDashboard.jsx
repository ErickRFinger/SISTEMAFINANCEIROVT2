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
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import './BusinessDashboard.css' // Updated Import

export default function BusinessDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        faturamento: 0,
        receber: 0,
        pagar: 0,
        lucro: 0
    })
    const [chartData, setChartData] = useState([])
    const [projectionData, setProjectionData] = useState([])
    const [catData, setCatData] = useState([])

    // Date State
    const hoje = new Date()
    const [mesAno, setMesAno] = useState({
        mes: String(hoje.getMonth() + 1).padStart(2, '0'),
        ano: String(hoje.getFullYear())
    })

    const fetchBusinessData = useCallback(async () => {
        setLoading(true)

        const safeFetch = (promise, fallback) => promise.then(res => res.data).catch(err => {
            console.warn('Falha parcial no dashboard:', err.message);
            return fallback;
        });

        try {
            const [resumo, receivables, transacoes, projecao] = await Promise.all([
                safeFetch(api.get('/transacoes/resumo/saldo', { params: mesAno }), { receitas: 0, despesas: 0, saldo: 0 }),
                safeFetch(api.get('/transacoes/resumo/receber'), { total: 0 }),
                safeFetch(api.get('/transacoes', { params: mesAno }), []),
                safeFetch(api.get('/transacoes/projecao?dias=30'), [])
            ]);

            setStats({
                faturamento: Number(resumo.receitas || 0),
                receber: Number(receivables.total || 0),
                pagar: Number(resumo.despesas || 0),
                lucro: Number(resumo.saldo || 0)
            })

            const txList = Array.isArray(transacoes) ? transacoes : []
            setProjectionData(Array.isArray(projecao) ? projecao : [])

            // Chart 1: Daily Flow
            const dailyData = txList.reduce((acc, t) => {
                if (t.tipo === 'receita') {
                    const dia = new Date(t.data).getDate()
                    acc[dia] = (acc[dia] || 0) + Number(t.valor)
                }
                return acc
            }, {})

            const formattedChartData = Object.keys(dailyData).map(dia => ({
                name: `Dia ${dia}`,
                valor: dailyData[dia]
            })).sort((a, b) => {
                const diaA = parseInt(a.name.split(' ')[1])
                const diaB = parseInt(b.name.split(' ')[1])
                return diaA - diaB
            })
            setChartData(formattedChartData)

            // New: Category Chart Logic
            const catGroup = txList
                .filter(t => t.tipo === 'receita')
                .reduce((acc, t) => {
                    const catName = t.categorias?.nome || 'Outros'
                    acc[catName] = (acc[catName] || 0) + Number(t.valor)
                    return acc
                }, {})

            const formattedCatData = Object.keys(catGroup).map((key, index) => ({
                name: key,
                value: catGroup[key],
                color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][index % 5]
            }))
            setCatData(formattedCatData)

        } catch (error) {
            console.error('Erro crítico no dashboard:', error)
        } finally {
            setLoading(false)
        }
    }, [mesAno])

    useEffect(() => {
        fetchBusinessData()
        const handleFocus = () => fetchBusinessData()
        window.addEventListener('focus', handleFocus)
        const handleEvent = () => setTimeout(fetchBusinessData, 500)
        window.addEventListener('transacaoCriada', handleEvent)
        return () => {
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('transacaoCriada', handleEvent)
        }
    }, [fetchBusinessData])

    if (loading) return (
        <div className="business-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="loading-spinner"></div>
        </div>
    )

    return (
        <div className="business-dashboard">
            {/* Header */}
            <header className="bd-header">
                <div className="bd-title">
                    <h1>🚀 Business Intelligence</h1>
                    <p className="bd-subtitle">Visão estratégica e performance financeira</p>
                </div>
                <div className="bd-controls">
                    <input
                        type="month"
                        className="bd-date-input"
                        value={`${mesAno.ano}-${mesAno.mes}`}
                        onChange={(e) => {
                            const [ano, mes] = e.target.value.split('-')
                            setMesAno({ mes, ano })
                        }}
                    />
                </div>
            </header>

            {/* KPI Cards */}
            <div className="bd-kpi-grid">
                {/* Faturamento */}
                <div className="kpi-card receita">
                    <div className="kpi-header">
                        <span className="kpi-icon">💰</span>
                        <span className="kpi-trend trend-up">↗ +12%</span>
                    </div>
                    <div>
                        <div className="kpi-value">R$ {stats.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="kpi-title">Faturamento Bruto</div>
                    </div>
                </div>

                {/* Lucro */}
                <div className="kpi-card lucro">
                    <div className="kpi-header">
                        <span className="kpi-icon">📈</span>
                        <span className={`kpi-trend ${stats.lucro >= 0 ? 'trend-up' : 'trend-down'}`}>
                            {stats.lucro >= 0 ? '↗ Positivo' : '↘ Atenção'}
                        </span>
                    </div>
                    <div>
                        <div className="kpi-value" style={{ color: stats.lucro >= 0 ? '#10b981' : '#ef4444' }}>
                            R$ {stats.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="kpi-title">Lucro Líquido</div>
                    </div>
                </div>

                {/* Despesas */}
                <div className="kpi-card despesa">
                    <div className="kpi-header">
                        <span className="kpi-icon">💸</span>
                        <span className="kpi-trend trend-neutral">➡ Estável</span>
                    </div>
                    <div>
                        <div className="kpi-value text-danger">R$ {stats.pagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="kpi-title">Despesas Operacionais</div>
                    </div>
                </div>

                {/* A Receber */}
                <div className="kpi-card receber">
                    <div className="kpi-header">
                        <span className="kpi-icon">📝</span>
                        <span className="kpi-trend trend-up">↗ Pendente</span>
                    </div>
                    <div>
                        <div className="kpi-value">R$ {stats.receber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="kpi-title">Contas a Receber</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="bd-charts-section">
                {/* Left Column: Main Charts */}
                <div className="charts-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Area Chart: Fluxo Diário */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">📊 Fluxo de Receita Diária</h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValor2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={val => `R$${val / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                                        />
                                        <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValor2)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state">
                                    <span style={{ fontSize: '3rem', opacity: 0.5 }}>📉</span>
                                    <p>Sem dados de receita para este período.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Area Chart: Projeção */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">🔮 Projeção de Fluxo (30 Dias)</h3>
                        </div>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <AreaChart data={projectionData}>
                                    <defs>
                                        <linearGradient id="colorProj2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" hide />
                                    <YAxis stroke="#94a3b8" tickFormatter={val => `R$${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo Projetado']}
                                    />
                                    <Area type="monotone" dataKey="saldo_projetado" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProj2)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Right Column: Secondary Data & Actions */}
                <div className="bd-sidebar">

                    {/* Donut Chart: Categorias */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">🍩 Top Categorias</h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            {catData.length > 0 ? (
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={catData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {catData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: 'no', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                                        />
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <span style={{ fontSize: '2rem', opacity: 0.5 }}>🍩</span>
                                    <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Sem dados.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Panel */}
                    <div className="chart-card">
                        <h3 className="chart-title" style={{ marginBottom: '1rem' }}>⚡ Acesso Rápido</h3>
                        <div className="actions-grid">
                            <div className="action-btn" onClick={() => window.location.href = '/produtos'}>
                                <span className="action-icon">📦</span>
                                <span className="action-label">Estoque</span>
                            </div>
                            <div className="action-btn" onClick={() => window.location.href = '/clientes'}>
                                <span className="action-icon">🤝</span>
                                <span className="action-label">Clientes</span>
                            </div>
                            <div className="action-btn" onClick={() => window.location.href = '/kanban'}>
                                <span className="action-icon">📑</span>
                                <span className="action-label">Projetos</span>
                            </div>
                            <div className="action-btn" onClick={() => window.location.href = '/funcionarios'}>
                                <span className="action-icon">👥</span>
                                <span className="action-label">Equipe</span>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="chart-card">
                        <h3 className="chart-title" style={{ marginBottom: '1rem' }}>🖥 Status</h3>
                        <div className="status-list">
                            <div className="status-item">
                                <span className="status-indicator online"></span>
                                Banco de Dados
                            </div>
                            <div className="status-item">
                                <span className="status-indicator online"></span>
                                API Integrada
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
