import { useState, useEffect } from 'react'
import api from '../services/api'
import './Investimentos.css'

export default function Investimentos() {
    const [investimentos, setInvestimentos] = useState([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [stats, setStats] = useState({ investido: 0, atual: 0, rendimento: 0, percentual: 0 })

    // Estado do formulário simples e direto
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
            alert('Não foi possível carregar seus investimentos parei.')
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

        // 1. Validação e Conversão de Tipos (CRÍTICO)
        // Substitui vírgula por ponto e garante que é número
        const valInvestido = parseFloat(String(form.valor_investido).replace(',', '.'))
        const valAtualInput = form.valor_atual ? parseFloat(String(form.valor_atual).replace(',', '.')) : null

        // Se valor atual estiver vazio, assume igual ao investido (0% rendimento inicial)
        const valAtualFinal = valAtualInput !== null && !isNaN(valAtualInput) ? valAtualInput : valInvestido

        if (isNaN(valInvestido) || valInvestido < 0) {
            alert('Por favor, insira um valor investido válido.')
            return
        }

        const payload = {
            nome: form.nome,
            tipo: form.tipo,
            instituicao: form.instituicao,
            valor_investido: valInvestido,
            valor_atual: valAtualFinal,
            data_aplicacao: form.data_aplicacao,
            observacoes: form.observacoes
        }

        console.log('📤 Enviando payload:', payload)

        try {
            setLoading(true)
            await api.post('/investimentos', payload)

            // Sucesso
            alert('✅ Investimento salvo com sucesso!')
            setShowForm(false)
            setForm({
                nome: '', tipo: 'renda_fixa', instituicao: '',
                valor_investido: '', valor_atual: '',
                data_aplicacao: new Date().toISOString().split('T')[0], observacoes: ''
            })
            carregarInvestimentos()

        } catch (error) {
            console.error('❌ Erro ao salvar:', error)

            // Tratamento de erro detalhado
            const backendMsg = error.response?.data?.details ||
                error.response?.data?.error ||
                'Erro desconhecido no servidor'

            alert(`❌ Falha ao salvar:\n${backendMsg}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Excluir este investimento?')) return
        try {
            await api.delete(`/investimentos/${id}`)
            carregarInvestimentos()
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir.')
        }
    }

    const formatar = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

    return (
        <div className="investimentos-container fade-in">
            <header className="invest-header">
                <div>
                    <h2>💼 Meus Investimentos</h2>
                    <p>Gerencie seu patrimônio e acompanhe a evolução.</p>
                </div>
                <button
                    className={`btn-primary ${showForm ? 'btn-danger' : ''}`}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✖ Fechar Formulário' : '＋ Novo Investimento'}
                </button>
            </header>

            {/* Cards de Resumo */}
            <div className="invest-stats-grid">
                <div className="card stat-card">
                    <span>Total Investido</span>
                    <h3>{formatar(stats.investido)}</h3>
                </div>
                <div className="card stat-card">
                    <span>Valor Atual</span>
                    <h3 style={{ color: '#00ff88', textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
                        {formatar(stats.atual)}
                    </h3>
                </div>
                <div className="card stat-card">
                    <span>Performance</span>
                    <h3 className={stats.rendimento >= 0 ? 'text-green' : 'text-red'}>
                        {stats.rendimento >= 0 ? '+' : ''}{formatar(stats.rendimento)}
                        <small style={{ fontSize: '0.6em', marginLeft: '8px', opacity: 0.8 }}>
                            ({stats.percentual.toFixed(2)}%)
                        </small>
                    </h3>
                </div>
            </div>

            {/* Formulário Novo */}
            {showForm && (
                <form onSubmit={handleSubmit} className="form-investimento card glass-panel">
                    <h3>Novo Aporte</h3>
                    <div className="grid grid-2">
                        <label>
                            Nome do Ativo *
                            <input
                                required
                                value={form.nome}
                                onChange={e => setForm({ ...form, nome: e.target.value })}
                                placeholder="Ex: Tesouro Selic, CDB..."
                            />
                        </label>
                        <label>
                            Tipo *
                            <select
                                value={form.tipo}
                                onChange={e => setForm({ ...form, tipo: e.target.value })}
                            >
                                {Object.entries(tiposInvestimento).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Instituição
                            <input
                                value={form.instituicao}
                                onChange={e => setForm({ ...form, instituicao: e.target.value })}
                                placeholder="Ex: Banco Inter, NuInvest..."
                            />
                        </label>
                        <label>
                            Valor Investido (R$) *
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={form.valor_investido}
                                onChange={e => setForm({ ...form, valor_investido: e.target.value })}
                                placeholder="0.00"
                            />
                        </label>
                        <label>
                            Valor Atual (R$)
                            <input
                                type="number"
                                step="0.01"
                                value={form.valor_atual}
                                onChange={e => setForm({ ...form, valor_atual: e.target.value })}
                                placeholder="Igual ao investido se vazio"
                            />
                        </label>
                        <label>
                            Data Aplicação
                            <input
                                type="date"
                                value={form.data_aplicacao}
                                onChange={e => setForm({ ...form, data_aplicacao: e.target.value })}
                            />
                        </label>
                    </div>
                    <button disabled={loading} className="btn-success full-width mt-4">
                        {loading ? '💾 Salvando...' : '✅ Salvar Investimento'}
                    </button>
                </form>
            )}

            {/* Lista de Ativos */}
            <div className="lista-investimentos mt-4">
                {investimentos.length === 0 && !loading && (
                    <div className="empty-state">
                        <p>Nenhum investimento cadastrado ainda.</p>
                    </div>
                )}

                {investimentos.map(inv => {
                    const lucro = (inv.valor_atual || 0) - (inv.valor_investido || 0)
                    const lucroPerc = inv.valor_investido ? (lucro / inv.valor_investido) * 100 : 0

                    return (
                        <div key={inv.id} className="invest-item card mb-2 flex-row-between">
                            <div className="invest-info">
                                <h4>{inv.nome}</h4>
                                <span className="badge">{tiposInvestimento[inv.tipo] || inv.tipo}</span>
                                <small>{inv.instituicao}</small>
                            </div>

                            <div className="invest-values text-right">
                                <div title="Valor Atual">
                                    <strong>{formatar(inv.valor_atual)}</strong>
                                </div>
                                <div className={`lucro-tag ${lucro >= 0 ? 'green' : 'red'}`}>
                                    {lucro >= 0 ? '▲' : '▼'} {lucroPerc.toFixed(1)}%
                                </div>
                            </div>

                            <button onClick={() => handleDelete(inv.id)} className="btn-icon delete-btn">
                                🗑️
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
