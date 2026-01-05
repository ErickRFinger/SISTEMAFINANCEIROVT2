import React from 'react'
import '../components/Layout.css'

export default function BusinessDashboard() {
    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div>
                    <h1>🚀 Business Dashboard</h1>
                    <p>Visão geral da sua empresa.</p>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <h3>Faturamento Mensal</h3>
                    <p className="card-value" style={{ color: '#10b981' }}>R$ 0,00</p>
                    <span className="card-subtitle">Últimos 30 dias</span>
                </div>

                <div className="card">
                    <h3>Lucro Líquido</h3>
                    <p className="card-value" style={{ color: '#3b82f6' }}>R$ 0,00</p>
                </div>

                <div className="card">
                    <h3>Contas a Pagar</h3>
                    <p className="card-value" style={{ color: '#ef4444' }}>R$ 0,00</p>
                </div>

                <div className="card">
                    <h3>Contas a Receber</h3>
                    <p className="card-value" style={{ color: '#f59e0b' }}>R$ 0,00</p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>📢 Atividades Recentes</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Nenhuma atividade registrada hoje.</p>
            </div>
        </div>
    )
}
