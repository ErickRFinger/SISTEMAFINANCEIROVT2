import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import FinancialCharts from '../components/FinancialCharts'
import './Transacoes.css' // Reusing styles for consistency

export default function Relatorios() {
    const [transacoes, setTransacoes] = useState([])
    const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0 })
    const [loading, setLoading] = useState(true)

    const hoje = new Date()
    const [mesAno, setMesAno] = useState({
        mes: String(hoje.getMonth() + 1).padStart(2, '0'),
        ano: String(hoje.getFullYear())
    })

    useEffect(() => {
        carregarDados()
    }, [mesAno])

    const carregarDados = async () => {
        try {
            setLoading(true)

            const [transacoesRes, resumoRes] = await Promise.all([
                api.get('/transacoes', { params: mesAno }),
                api.get('/transacoes/resumo/saldo', { params: mesAno })
            ])

            setTransacoes(transacoesRes.data || [])
            setResumo(resumoRes.data || { receitas: 0, despesas: 0, saldo: 0 })

        } catch (error) {
            console.error('Erro ao carregar relatório:', error)
        } finally {
            setLoading(false)
        }
    }

    // Cálculos Extras para Relatórios
    const topCategorias = useMemo(() => {
        if (!transacoes.length) return []
        const despesas = transacoes.filter(t => t.tipo === 'despesa')
        const agrupado = despesas.reduce((acc, t) => {
            const cat = t.categoria_nome || 'Outros'
            acc[cat] = (acc[cat] || 0) + Number(t.valor)
            return acc
        }, {})

        return Object.entries(agrupado)
            .map(([nome, valor]) => ({ nome, valor }))
            .sort((a, b) => b.valor - a.valor)
    }, [transacoes])

    const formatarMoeda = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    return (
        <div className="container fade-in">
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <div>
                    <h2>📈 Relatórios Gerenciais</h2>
                    <p className="page-subtitle">Análise detalhada do seu fluxo financeiro</p>
                </div>
                <div className="mes-selector">
                    <input
                        type="month"
                        value={`${mesAno.ano}-${mesAno.mes}`}
                        onChange={(e) => {
                            const [ano, mes] = e.target.value.split('-')
                            setMesAno({ mes, ano })
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading">Carregando dados...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Gráficos Visuais */}
                    <FinancialCharts transacoes={transacoes} resumo={resumo} />

                    {/* Tabela de Detalhamento por Categoria */}
                    <div className="card">
                        <h3>🏆 Gastos por Categoria (Detalhado)</h3>
                        <div className="transacoes-table">
                            {topCategorias.length > 0 ? (
                                topCategorias.map((cat, idx) => (
                                    <div key={idx} className="transacao-row" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className="transacao-info">
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>#{idx + 1}</span>
                                            <span>{cat.nome}</span>
                                        </div>
                                        <div className="transacao-valor despesa">
                                            {formatarMoeda(cat.valor)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nenhuma despesa no período.</p>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
