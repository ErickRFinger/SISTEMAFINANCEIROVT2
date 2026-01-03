/* SmartInsights.jsx - AI Financial Tips */
import { useMemo } from 'react'
import { startOfMonth, endOfMonth, isAfter } from 'date-fns'

export default function SmartInsights({ transacoes = [], resumo = {}, metas = [] }) {
    const insights = useMemo(() => {
        const list = []

        // 1. RECEITA x DESPESA
        if (resumo.despesas > resumo.receitas && resumo.receitas > 0) {
            list.push({
                type: 'danger',
                icon: '🚨',
                title: 'Fluxo de Caixa Negativo',
                msg: 'Você gastou mais do que recebeu este mês. Atenção aos gastos supérfluos!'
            })
        } else if (resumo.receitas > 0 && (resumo.despesas / resumo.receitas) < 0.5) {
            list.push({
                type: 'success',
                icon: '🏆',
                title: 'Grande Economia',
                msg: 'Parabéns! Você guardou mais de 50% da sua renda este mês.'
            })
        }

        // 2. METAS EM RISCO
        const metasAtrasadas = metas.filter(m => m.status === 'ativa' && m.valor_atual < m.valor_meta * 0.5 && isAfter(new Date(), new Date(m.data_inicio)))
        if (metasAtrasadas.length > 0) {
            list.push({
                type: 'warning',
                icon: '🎯',
                title: 'Metas Precisam de Atenção',
                msg: `Você tem ${metasAtrasadas.length} metas que parecem estar progredindo devagar. Que tal fazer um aporte hoje?`
            })
        }

        // 3. Categoria TOP GASTO
        const categoriasGasto = {}
        transacoes.filter(t => t.tipo === 'despesa').forEach(t => {
            if (!categoriasGasto[t.categoria_nome]) categoriasGasto[t.categoria_nome] = 0
            categoriasGasto[t.categoria_nome] += Number(t.valor)
        })
        const entries = Object.entries(categoriasGasto)
        if (entries.length > 0) {
            const topGasto = entries.sort((a, b) => b[1] - a[1])[0]
            if (topGasto && resumo.receitas > 0 && topGasto[1] > (resumo.receitas * 0.3)) {
                list.push({
                    type: 'info',
                    icon: '💡',
                    title: `Gasto Alto em ${topGasto[0]}`,
                    msg: `Essa categoria consumiu mais de 30% da sua renda. Tente reduzir mês que vem.`
                })
            }
        }

        return list
    }, [transacoes, resumo, metas])

    if (insights.length === 0) return null

    return (
        <div className="insights-container" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            {insights.map((insight, idx) => (
                <div key={idx} style={{
                    minWidth: '280px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start'
                }}>
                    <div style={{ fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {insight.icon}
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#fff' }}>{insight.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>{insight.msg}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
