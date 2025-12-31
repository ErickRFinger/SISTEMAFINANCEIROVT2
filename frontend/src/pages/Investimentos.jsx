import { useState, useEffect } from 'react'
import api from '../services/api'
import './Investimentos.css'

export default function Investimentos() {
    const [investimentos, setInvestimentos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [totalInvestido, setTotalInvestido] = useState(0)
    const [totalAtual, setTotalAtual] = useState(0)

    const [novoInvestimento, setNovoInvestimento] = useState({
        nome: '',
        tipo: 'renda_fixa',
        instituicao: '',
        valor_investido: '',
        valor_atual: '',
        data_aplicacao: new Date().toISOString().split('T')[0],
        observacoes: ''
    })

    useEffect(() => {
        carregarInvestimentos()
    }, [])

    const carregarInvestimentos = async () => {
        try {
            const response = await api.get('/investimentos')
            const dados = response.data || []
            setInvestimentos(dados)

            // Calcular totais
            const investido = dados.reduce((acc, inv) => acc + Number(inv.valor_investido), 0)
            const atual = dados.reduce((acc, inv) => acc + Number(inv.valor_atual), 0)

            setTotalInvestido(investido)
            setTotalAtual(atual)
        } catch (error) {
            console.error('Erro ao carregar investimentos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/investimentos', {
                ...novoInvestimento,
                valor_investido: parseFloat(novoInvestimento.valor_investido),
                valor_atual: parseFloat(novoInvestimento.valor_atual || novoInvestimento.valor_investido)
            })

            setNovoInvestimento({
                nome: '',
                tipo: 'renda_fixa',
                instituicao: '',
                valor_investido: '',
                valor_atual: '',
                data_aplicacao: new Date().toISOString().split('T')[0],
                observacoes: ''
            })
            setShowForm(false)
            carregarInvestimentos()
        } catch (error) {
            console.error('Erro ao criar investimento:', error)
            alert('Erro ao salvar investimento')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este investimento?')) return

        try {
            await api.delete(`/investimentos/${id}`)
            carregarInvestimentos()
        } catch (error) {
            console.error('Erro ao deletar:', error)
        }
    }

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor)
    }

    const calcularRendimento = (investido, atual) => {
        const diff = atual - investido
        return {
            valor: diff,
            percentual: investido > 0 ? (diff / investido) * 100 : 0
        }
    }

    const tiposInvestimento = {
        renda_fixa: 'Renda Fixa',
        acoes: 'Ações',
        fiis: 'FIIs',
        cripto: 'Criptomoedas',
        tesouro: 'Tesouro Direto',
        fundos: 'Fundos',
        outros: 'Outros'
    }

    // FIX VISUAL: FORÇAR TEMA ESCURO VIA INLINE STYLE (JÁ QUE O CSS NÃO ESTÁ ATUALIZANDO)
    const invasiveDarkStyles = `
      .invest-stat-card, .novo-investimento-card, .investimento-card {
        background-color: #1f2937 !important; /* Cinza Escuro */
        border: 1px solid #374151 !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important;
        color: white !important;
        backdrop-filter: none !important;
      }
      .investimento-type-badge {
        background-color: #374151 !important;
        color: #e5e7eb !important;
        border: 1px solid #4b5563 !important;
      }
      .investimentos-header h2, .invest-stat-value, .invest-val, .novo-investimento-header h3 {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }
      .invest-label, .investimentos-subtitle, .invest-stat-info h3 {
        color: #9ca3af !important;
      }
    `;

    return (
        <div className="investimentos-container">
            <style>{invasiveDarkStyles}</style>

            {/* <Sidebar /> */}
            <div className="investimentos-header">
                <h2>📈 Investimentos</h2>
                <p className="investimentos-subtitle">Acompanhe a evolução do seu patrimônio</p>
            </div>

            <div className="invest-stats-grid">
                <div className="invest-stat-card">
                    <div className="invest-stat-icon total">💰</div>
                    <div className="invest-stat-info">
                        <h3>Total Investido</h3>
                        <div className="invest-stat-value">{formatarMoeda(totalInvestido)}</div>
                    </div>
                </div>

                <div className="invest-stat-card">
                    <div className="invest-stat-icon rendimento">🚀</div>
                    <div className="invest-stat-info">
                        <h3>Valor Atual</h3>
                        <div className="invest-stat-value">{formatarMoeda(totalAtual)}</div>
                    </div>
                </div>

                <div className="invest-stat-card">
                    <div className="invest-stat-icon count">📊</div>
                    <div className="invest-stat-info">
                        <h3>Rendimento Total</h3>
                        <div className={`invest-stat-value ${totalAtual >= totalInvestido ? 'profit' : 'loss'}`}>
                            {totalAtual >= totalInvestido ? '+' : ''}
                            {formatarMoeda(totalAtual - totalInvestido)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="novo-investimento-card">
                <div
                    className="novo-investimento-header"
                    onClick={() => setShowForm(!showForm)}
                >
                    <h3>⚡ Novo Investimento</h3>
                    <button className="btn-secondary btn-sm">
                        {showForm ? 'Cancelar' : 'Adicionar'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="fade-in">
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Nome do Ativo</label>
                                <input
                                    type="text"
                                    value={novoInvestimento.nome}
                                    onChange={e => setNovoInvestimento({ ...novoInvestimento, nome: e.target.value })}
                                    placeholder="Ex: CDB Nubank, PETR4"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo</label>
                                <select
                                    value={novoInvestimento.tipo}
                                    onChange={e => setNovoInvestimento({ ...novoInvestimento, tipo: e.target.value })}
                                >
                                    {Object.entries(tiposInvestimento).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Instituição</label>
                                <input
                                    type="text"
                                    value={novoInvestimento.instituicao}
                                    onChange={e => setNovoInvestimento({ ...novoInvestimento, instituicao: e.target.value })}
                                    placeholder="Ex: NuInvest, XP"
                                />
                            </div>
                            <div className="form-group">
                                <label>Valor Investido (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={novoInvestimento.valor_investido}
                                    onChange={e => setNovoInvestimento({ ...novoInvestimento, valor_investido: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Valor Atual (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={novoInvestimento.valor_atual}
                                    onChange={e => setNovoInvestimento({ ...novoInvestimento, valor_atual: e.target.value })}
                                    placeholder="Se diferente do investido"
                                />
                            </div>
                            <div className="form-group">
                                <label>Data Aplicação</label>
                                <input
                                    type="date"
                                    value={novoInvestimento.data_aplicacao}
                                    onChange={e => setNovoInvestimento({ ...novoInvestimento, data_aplicacao: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                            Salvar Investimento
                        </button>
                    </form>
                )}
            </div>

            <div className="investimentos-list">
                {investimentos.map(item => {
                    const rendimento = calcularRendimento(item.valor_investido, item.valor_atual)
                    return (
                        <div key={item.id} className="investimento-card">
                            <div className="investimento-header">
                                <strong>{item.nome}</strong>
                                <span className="investimento-type-badge">
                                    {tiposInvestimento[item.tipo] || item.tipo}
                                </span>
                            </div>
                            <div className="investimento-body">
                                {item.instituicao && (
                                    <div className="invest-row" style={{ marginBottom: '1rem' }}>
                                        <span className="invest-label">Instituição</span>
                                        <span>{item.instituicao}</span>
                                    </div>
                                )}
                                <div className="invest-row">
                                    <span className="invest-label">Aplicado</span>
                                    <span className="invest-val">{formatarMoeda(item.valor_investido)}</span>
                                </div>
                                <div className="invest-row">
                                    <span className="invest-label">Atual</span>
                                    <span className="invest-val">{formatarMoeda(item.valor_atual)}</span>
                                </div>

                                <div className="invest-rendimento">
                                    <span className="invest-label">Rendimento</span>
                                    <div className={`rendimento-val ${rendimento.valor >= 0 ? 'positive' : 'negative'}`}>
                                        {rendimento.valor >= 0 ? '+' : ''}{formatarMoeda(rendimento.valor)}
                                        <small> ({rendimento.percentual.toFixed(2)}%)</small>
                                    </div>
                                </div>
                            </div>
                            <div className="investimento-actions">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="btn-danger btn-sm"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
