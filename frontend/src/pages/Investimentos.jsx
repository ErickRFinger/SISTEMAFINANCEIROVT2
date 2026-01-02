import { useState, useEffect } from 'react'
import api from '../services/api'
import './Investimentos.css'

export default function Investimentos() {
    const [investimentos, setInvestimentos] = useState([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false) // Toggle do formulário
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
        renda_fixa: 'Renda Fixa',
        acoes: 'Ações',
        fiis: 'FIIs',
        cripto: 'Criptomoedas',
        tesouro: 'Tesouro Direto',
        fundos: 'Fundos',
        outros: 'Outros'
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
            // Silencioso ou alert simples
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validação básica de número (aceita 1000,50 ou 1000.50)
        const parseValue = (val) => {
            if (!val) return 0
            return parseFloat(String(val).replace(',', '.'))
        }

        const valInvestido = parseValue(form.valor_investido)
        const valAtual = form.valor_atual ? parseValue(form.valor_atual) : valInvestido

        const payload = {
            nome: form.nome,
            tipo: form.tipo,
            instituicao: form.instituicao,
            valor_investido: valInvestido,
            valor_atual: valAtual,
            data_aplicacao: form.data_aplicacao,
            observacoes: form.observacoes
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
            alert('Erro ao salvar. Verifique se o servidor está online.')
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

    return (
        <div className="investimentos-container fade-in">
            <header className="invest-header">
                <h2>Meus Investimentos</h2>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Fechar' : '+ Novo Investimento'}
                </button>
            </header>

            {/* Cards Totais */}
            <div className="invest-stats-grid">
                <div className="stat-card card">
                    <span>Investido</span>
                    <h3>{formatar(stats.investido)}</h3>
                </div>
                <div className="stat-card card">
                    <span>Atual</span>
                    <h3>{formatar(stats.atual)}</h3>
                </div>
                <div className="stat-card card">
                    <span>Rendimento</span>
                    <h3 style={{ color: stats.rendimento >= 0 ? '#4ade80' : '#f87171' }}>
                        {formatar(stats.rendimento)} ({stats.percentual.toFixed(1)}%)
                    </h3>
                </div>
            </div>

            {/* Formulário */}
            {showForm && (
                <form onSubmit={handleSubmit} className="card form-investimento mt-4">
                    <h3>Novo Aporte</h3>
                    <div className="grid grid-2">
                        <label>
                            Nome
                            <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                        </label>
                        <label>
                            Tipo
                            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                {Object.entries(tiposInvestimento).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </label>
                        <label>
                            Instituição
                            <input value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} />
                        </label>
                        <label>
                            Valor Investido (R$)
                            <input required value={form.valor_investido} onChange={e => setForm({ ...form, valor_investido: e.target.value })} />
                        </label>
                        <label>
                            Valor Atual (R$)
                            <input value={form.valor_atual} onChange={e => setForm({ ...form, valor_atual: e.target.value })} placeholder="Igual ao investido se vazio" />
                        </label>
                        <label>
                            Data
                            <input type="date" value={form.data_aplicacao} onChange={e => setForm({ ...form, data_aplicacao: e.target.value })} />
                        </label>
                    </div>
                    <button className="btn-success full-width mt-4" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </form>
            )}

            {/* Lista */}
            <div className="lista-investimentos mt-4">
                {investimentos.map(inv => (
                    <div key={inv.id} className="card mb-2 flex-row-between invest-item">
                        <div>
                            <h4>{inv.nome}</h4>
                            <small>{tiposInvestimento[inv.tipo]} - {inv.instituicao}</small>
                        </div>
                        <div className="text-right">
                            <div>{formatar(inv.valor_atual)}</div>
                            <small>{((inv.valor_atual - inv.valor_investido) / inv.valor_investido * 100).toFixed(1)}%</small>
                        </div>
                        <button onClick={() => handleDelete(inv.id)} className="btn-icon delete-btn">🗑️</button>
                    </div>
                ))}
            </div>
        </div>
    )
}
