import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function BusinessDashboard() {
    const { user } = useAuth()

    // Dados Mockados para "O General" (enquanto não implementamos o backend real)
    const stats = {
        receitasHoje: 0,
        contasPagarHoje: 0,
        chamadosAtraso: 0,    // SLA Estourado (Operacional)
        propostasAbertas: 0,  // CRM (Comercial)
        estoqueBaixo: 0       // Produtos acabando
    }

    return (
        <div className="dashboard-container business-theme">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🏢 Painel Empresarial
                        <span style={{ fontSize: '0.6em', background: '#333', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                            GENERAL
                        </span>
                    </h1>
                    <p>Visão estratégica da sua empresa em tempo real.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/transacoes" className="btn-secondary">
                        Nova Venda
                    </Link>
                    <Link to="/orcamentos" className="btn-primary">
                        Novo Orçamento
                    </Link>
                </div>
            </div>

            {/* CARDS DO GENERAL - VISÃO ESTRATÉGICA */}
            <div className="dashboard-cards">

                {/* FINANCEIRO */}
                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Financeiro Hoje</h3>
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Receitas</p>
                        <p className="card-value positive">R$ {stats.receitasHoje},00</p>
                        <hr style={{ margin: '8px 0', opacity: 0.2 }} />
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>A Pagar</p>
                        <p className="card-value negative">R$ {stats.contasPagarHoje},00</p>
                    </div>
                </div>

                {/* OPERACIONAL (KANBAN) */}
                <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Operacional</h3>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    </div>
                    <p className="card-value" style={{ color: stats.chamadosAtraso > 0 ? '#ef4444' : 'var(--text)' }}>
                        {stats.chamadosAtraso}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>Chamados em Atraso</p>
                    <Link to="/kanban" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '10px', display: 'block' }}>Ver Quadro Kanban →</Link>
                </div>

                {/* COMERCIAL (CRM) */}
                <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Comercial</h3>
                        <span style={{ fontSize: '1.5rem' }}>🤝</span>
                    </div>
                    <p className="card-value">{stats.propostasAbertas}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Propostas em Aberto</p>
                    <Link to="/crm" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '10px', display: 'block' }}>Acessar CRM →</Link>
                </div>

                {/* ESTOQUE */}
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Estoque</h3>
                        <span style={{ fontSize: '1.5rem' }}>📦</span>
                    </div>
                    <p className="card-value" style={{ color: stats.estoqueBaixo > 0 ? '#f59e0b' : 'var(--text)' }}>
                        {stats.estoqueBaixo}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>Itens Abaixo do Mínimo</p>
                    <Link to="/estoque" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '10px', display: 'block' }}>Repor Estoque →</Link>
                </div>

            </div>

            <div className="recent-transactions card" style={{ marginTop: '20px' }}>
                <h3>Atividades Recentes</h3>
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    Nenhuma atividade registrada hoje.
                </p>
            </div>
        </div>
    )
}
