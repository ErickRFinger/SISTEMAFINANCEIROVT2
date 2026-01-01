import { useMemo } from 'react'
import './FinancialCharts.css'

export default function FinancialCharts({ transacoes, resumo }) {

    // 1. Processar dados para o Gráfico de Categorias (Barras)
    const categoryData = useMemo(() => {
        if (!transacoes || transacoes.length === 0) return []

        const despesas = transacoes.filter(t => t.tipo === 'despesa')
        const totalDespesas = despesas.reduce((acc, t) => acc + Number(t.valor), 0)

        if (totalDespesas === 0) return []

        const agupado = despesas.reduce((acc, t) => {
            const cat = t.categoria_nome || 'Outros'
            const cor = t.categoria_cor || '#94a3b8'
            if (!acc[cat]) acc[cat] = { valor: 0, cor }
            acc[cat].valor += Number(t.valor)
            return acc
        }, {})

        return Object.entries(agupado)
            .map(([nome, dados]) => ({
                nome,
                valor: dados.valor,
                porcentagem: ((dados.valor / totalDespesas) * 100).toFixed(1),
                cor: dados.cor
            }))
            .sort((a, b) => b.valor - a.valor) // Maior para menor
            .slice(0, 5) // Top 5
    }, [transacoes])

    // 2. Processar dados para o Gráfico de Rosca (Receita vs Despesa)
    const donutData = useMemo(() => {
        const rec = Number(resumo?.receitas || 0)
        const desp = Number(resumo?.despesas || 0)
        const total = rec + desp

        if (total === 0) return null

        const pRec = ((rec / total) * 100).toFixed(1)
        const pDesp = ((desp / total) * 100).toFixed(1)

        // CSS Conic Gradient
        // green start -> green end (pRec) -> red start (pRec) -> red end
        return {
            gradient: `conic-gradient(#10b981 0% ${pRec}%, #ef4444 ${pRec}% 100%)`,
            pRec,
            pDesp
        }
    }, [resumo])

    const formatarMoeda = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    if (!donutData) return null

    return (
        <div className="grid grid-2 charts-container">

            {/* GRÁFICO DE ROSCA (Fluxo) */}
            <div className="card chart-card">
                <h3>📊 Fluxo do Mês</h3>
                <div className="donut-wrapper">
                    <div className="donut-chart" style={{ background: donutData.gradient }}>
                        <div className="donut-hole">
                            <div className="donut-text">
                                <span className="donut-label">Movimentado</span>
                                <span className="donut-value">{formatarMoeda(Number(resumo.receitas) + Number(resumo.despesas))}</span>
                            </div>
                        </div>
                    </div>
                    <div className="donut-legend">
                        <div className="legend-item">
                            <span className="dot" style={{ background: '#10b981' }}></span>
                            <span>Receitas ({donutData.pRec}%)</span>
                        </div>
                        <div className="legend-item">
                            <span className="dot" style={{ background: '#ef4444' }}></span>
                            <span>Despesas ({donutData.pDesp}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRÁFICO DE BARRAS (Top Categorias) */}
            <div className="card chart-card">
                <h3>🏆 Top Despesas</h3>
                {categoryData.length > 0 ? (
                    <div className="bars-container">
                        {categoryData.map((cat, idx) => (
                            <div key={idx} className="bar-item">
                                <div className="bar-info">
                                    <span className="bar-label">{cat.nome}</span>
                                    <span className="bar-value">{formatarMoeda(cat.valor)}</span>
                                </div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${cat.porcentagem}%`,
                                            backgroundColor: cat.cor
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-data">Nenhuma despesa registrada neste mês.</p>
                )}
            </div>

        </div>
    )
}
