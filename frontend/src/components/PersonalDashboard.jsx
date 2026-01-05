import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FinancialCharts from './FinancialCharts'

export default function PersonalDashboard() {
    const { user } = useAuth()
    const [resumo, setResumo] = useState({
        saldo: 0,
        receitas: 0,
        despesas: 0,
        investimentos: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchResumo()
    }, [])

    const fetchResumo = async () => {
        try {
            // Buscar resumo financeiro
            const [transacoesRes, investimentosRes] = await Promise.all([
                api.get('/transacoes'),
                api.get('/investimentos')
            ])

            const transacoes = transacoesRes.data
            const investimentos = investimentosRes.data

            const receitas = transacoes
                .filter(t => t.tipo === 'receita')
                .reduce((acc, curr) => acc + Number(curr.valor), 0)

            const despesas = transacoes
                .filter(t => t.tipo === 'despesa')
                .reduce((acc, curr) => acc + Number(curr.valor), 0)

            const totalInvestido = investimentos
                .reduce((acc, curr) => acc + Number(curr.valor_atual), 0)

            setResumo({
                saldo: receitas - despesas,
                receitas,
                despesas,
                investimentos: totalInvestido
            })
        } catch (error) {
            console.error('Erro ao buscar resumo:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="loading">Carregando dados...</div>
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Olá, {user?.nome?.split(' ')[0]}! 👋</h1>
                    <p>Aqui está o resumo das suas finanças pessoais hoje.</p>
                </div>
                <Link to="/transacoes" className="btn-primary">
                    + Nova Transação
                </Link>
            </div>

            <div className="dashboard-cards">
                <div className="card">
                    <h3>Saldo Atual</h3>
                    <p className={`card-value ${resumo.saldo >= 0 ? 'positive' : 'negative'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.saldo)}
                    </p>
                </div>

                <div className="card">
                    <h3>Receitas (Mês)</h3>
                    <p className="card-value positive">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.receitas)}
                    </p>
                </div>

                <div className="card">
                    <h3>Despesas (Mês)</h3>
                    <p className="card-value negative">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.despesas)}
                    </p>
                </div>

                <div className="card">
                    <h3>Investimentos</h3>
                    <p className="card-value">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.investimentos)}
                    </p>
                </div>
            </div>

            <div className="charts-section">
                <FinancialCharts />
            </div>
        </div>
    )
}
