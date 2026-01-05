import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import FinancialCharts from '../components/FinancialCharts'
import SmartInsights from '../components/SmartInsights'
import './Dashboard.css'

export default function Dashboard() {
  const [resumo, setResumo] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0
  })
  const [transacoes, setTransacoes] = useState([])
  const [metas, setMetas] = useState([])
  const [totalGuardado, setTotalGuardado] = useState(0)
  const [perfil, setPerfil] = useState({ ganho_fixo_mensal: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Privacy Mode State (Persisted in localStorage)
  const [privacyMode, setPrivacyMode] = useState(() => {
    return localStorage.getItem('privacyMode') === 'true'
  })

  const hoje = new Date()
  const [mesAno, setMesAno] = useState({
    mes: String(hoje.getMonth() + 1).padStart(2, '0'),
    ano: String(hoje.getFullYear())
  })

  // Update localStorage when privacyMode changes
  useEffect(() => {
    localStorage.setItem('privacyMode', privacyMode)
  }, [privacyMode])

  const togglePrivacy = () => {
    setPrivacyMode(!privacyMode)
  }

  const carregarDados = useCallback(async () => {
    // ... existing carregarDados logic ...
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Carregando dados do dashboard...', mesAno)

      // Carregar cada requisição individualmente para melhor tratamento de erros
      let resumoData = { receitas: 0, despesas: 0, saldo: 0 }
      let transacoesData = []
      let perfilData = { ganho_fixo_mensal: 0 }

      // Carregar resumo
      try {
        const resumoRes = await api.get('/transacoes/resumo/saldo', { params: mesAno })
        resumoData = resumoRes.data || {}
      } catch (error) {
        console.error('❌ Erro ao carregar resumo:', error)
        setError('Erro ao carregar resumo financeiro')
      }

      // Carregar Metas (para Insights)
      try {
        const metasRes = await api.get('/metas')
        setMetas(metasRes.data || [])
      } catch (error) { console.error('Erro metas', error) }

      // Carregar transações
      try {
        const transacoesRes = await api.get('/transacoes', { params: { ...mesAno } })
        transacoesData = Array.isArray(transacoesRes.data) ? transacoesRes.data : []
      } catch (error) {
        console.error('❌ Erro ao carregar transações:', error)
        if (!error.response || error.response.status !== 401) {
          setError(prev => prev ? prev + ' | Erro ao carregar transações' : 'Erro ao carregar transações')
        }
      }

      // Carregar perfil
      try {
        const perfilRes = await api.get('/perfil')
        perfilData = perfilRes.data || { ganho_fixo_mensal: 0 }
      } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error)
        if (error.response?.status === 401) throw error
      }

      // Garantir que resumo sempre tenha valores numéricos
      const resumoFormatado = {
        receitas: Number(resumoData.receitas) || 0,
        despesas: Number(resumoData.despesas) || 0,
        saldo: Number(resumoData.saldo) || 0
      }

      // Limitar transações a 10
      const transacoesLimitadas = transacoesData.slice(0, 10)

      setResumo(resumoFormatado)
      setTransacoes(transacoesLimitadas)
      setPerfil(perfilData)

      // Carregar bancos e investimentos para calcular Patrimônio Total
      try {
        const [bancosRes, investimentosRes] = await Promise.all([
          api.get('/bancos'),
          api.get('/investimentos')
        ])

        const moveisBancos = bancosRes.data || []
        const totalBancos = moveisBancos.reduce((acc, banco) => acc + (Number(banco.saldo_atual) || 0), 0)

        const listaInvestimentos = investimentosRes.data || []
        const totalInvestimentos = listaInvestimentos.reduce((acc, inv) => acc + (Number(inv.valor_atual) || 0), 0)

        setTotalGuardado(totalBancos + totalInvestimentos)
      } catch (error) {
        console.error('❌ Erro ao carregar patrimônio:', error)
      }

    } catch (error) {
      console.error('❌ Erro crítico ao carregar dados:', error)
      if (error.response?.status === 401) return

      const errorMessage = error.response?.data?.error || error.message || 'Erro ao carregar dados'
      setError(errorMessage)
      setResumo({ receitas: 0, despesas: 0, saldo: 0 })
      setTransacoes([])
      setTotalGuardado(0)
    } finally {
      setLoading(false)
    }
  }, [mesAno])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Ouvir evento de transação criada
  useEffect(() => {
    const handleTransacaoCriada = () => {
      console.log('🔄 Transação criada detectada, recarregando dados...')
      setTimeout(() => {
        carregarDados()
      }, 800)
    }

    window.addEventListener('transacaoCriada', handleTransacaoCriada)

    return () => {
      window.removeEventListener('transacaoCriada', handleTransacaoCriada)
    }
  }, [carregarDados])

  const formatarMoeda = (valor) => {
    if (privacyMode) return '••••'

    const numValor = Number(valor) || 0
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValor)
  }

  const formatarData = (data) => {
    try {
      return format(new Date(data), "dd/MM/yyyy")
    } catch {
      return data
    }
  }

  const calcularPercentualGasto = () => {
    const receitas = Number(resumo.receitas) || 0
    const despesas = Number(resumo.despesas) || 0
    if (receitas === 0) return '0'
    return ((despesas / receitas) * 100).toFixed(1)
  }

  const calcularEconomia = () => {
    const receitas = Number(resumo.receitas) || 0
    const despesas = Number(resumo.despesas) || 0
    return receitas - despesas
  }

  const calcularProjecaoMensal = () => {
    const hoje = new Date()
    const diasNoMes = new Date(parseInt(mesAno.ano), parseInt(mesAno.mes), 0).getDate()
    const diaAtual = hoje.getDate()
    const diasRestantes = diasNoMes - diaAtual
    const despesas = Number(resumo.despesas) || 0

    if (diaAtual === 0) return despesas

    const mediaDiaria = despesas / diaAtual
    const projecao = despesas + (mediaDiaria * diasRestantes)
    return projecao
  }

  const percentualGasto = calcularPercentualGasto()
  const economia = calcularEconomia()
  const projecaoMensal = calcularProjecaoMensal()

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    )
  }

  // REMOVED INVASIVE STYLES - Now in Dashboard.css

  const diasNoMes = new Date(parseInt(mesAno.ano), parseInt(mesAno.mes), 0).getDate()
  const diaAtual = new Date().getDate()
  const progressoMes = (diaAtual / diasNoMes) * 100

  return (
    <div className="dashboard-container">

      <div className="dashboard-header-container">
        <div>
          <h2>💰 Financeiro</h2>
          <p className="dashboard-subtitle">Visão geral das suas finanças</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={togglePrivacy}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.8rem', fontSize: '1.2rem', minHeight: 'auto' }}
            title={privacyMode ? "Mostrar valores" : "Esconder valores"}
          >
            {privacyMode ? '👁️' : '🔒'}
          </button>

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
      </div>

      {error && (
        <div className="error-message">
          <div>
            <strong>⚠️ Erro ao carregar dados</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>{error}</p>
          </div>
          <button onClick={carregarDados} className="btn-secondary btn-sm">
            🔄 Tentar Novamente
          </button>
        </div>
      )}

      {/* SMART INSIGHTS WIDGET */}
      <SmartInsights transacoes={transacoes} resumo={resumo} metas={metas} />

      {/* Grid Superior: Total Guardado + Projeção */}
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        {/* Total Guardado (Patrimônio) */}
        <div className="card total-guardado-card" style={{ marginBottom: 0 }}>
          <div className="total-guardado-header">
            <div className="total-guardado-icon">🏦</div>
            <div>
              <h3>Patrimônio</h3>
              <p className="total-guardado-subtitle">Saldo acumulado</p>
            </div>
          </div>
          <p className="total-guardado-valor">{formatarMoeda(totalGuardado)}</p>
        </div>

        {/* Nova Widget de Projeção */}
        <div className="projection-widget card" style={{ marginBottom: 0 }}>
          <div className="projection-header">
            <div>
              <p className="projection-title">Projeção de Gastos (Fim do Mês)</p>
              <div className="projection-amount">{formatarMoeda(projecaoMensal)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="projection-title">Gasto Atual</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatarMoeda(resumo.despesas)}</div>
            </div>
          </div>

          <div className="projection-bar-container">
            {/* Barra de Progresso do Mês (Cinza Escuro/Marcador) */}
            <div
              className="projection-marker"
              style={{ left: `${progressoMes}%` }}
              title={`Hoje: Dia ${diaAtual}`}
            />
            {/* Barra de Gastos vs Receita */}
            <div
              className={`projection-bar-fill ${Number(percentualGasto) < progressoMes ? 'safe' : Number(percentualGasto) < 85 ? 'warning' : 'danger'}`}
              style={{ width: `${Math.min(Number(percentualGasto), 100)}%` }}
            />
          </div>

          <div className="projection-details">
            <span>{diaAtual} de {diasNoMes} dias ({Math.round(progressoMes)}%)</span>
            <span>{percentualGasto}% da Receita gasta</span>
          </div>
        </div>
      </div>

      {/* NOVOS GRÁFICOS VISUAIS */}
      <FinancialCharts transacoes={transacoes} resumo={resumo} />

      {/* Cards de Resumo */}
      <div className="grid grid-3">
        <div className="card resumo-card receita">
          <div className="resumo-icon">💰</div>
          <div className="resumo-content">
            <h3>Receitas</h3>
            <p className="resumo-valor">{formatarMoeda(resumo.receitas)}</p>
            {perfil.ganho_fixo_mensal > 0 && (
              <p className="resumo-subtitle">
                Ganho fixo: {formatarMoeda(perfil.ganho_fixo_mensal)}
              </p>
            )}
          </div>
        </div>

        <div className="card resumo-card despesa">
          <div className="resumo-icon">💸</div>
          <div className="resumo-content">
            <h3>Despesas</h3>
            <p className="resumo-valor">{formatarMoeda(resumo.despesas)}</p>
            <p className="resumo-subtitle">
              Média diária: {formatarMoeda(resumo.despesas / Math.max(1, new Date().getDate()))}
            </p>
          </div>
        </div>

        <div className={`card resumo-card saldo ${resumo.saldo >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="resumo-icon">{resumo.saldo >= 0 ? '✅' : '⚠️'}</div>
          <div className="resumo-content">
            <h3>Saldo</h3>
            <p className="resumo-valor">{formatarMoeda(resumo.saldo)}</p>
            <p className="resumo-subtitle">
              Economia: {formatarMoeda(economia)}
            </p>
          </div>
        </div>
      </div>


      <div className="grid grid-2">
        {/* Stats Card Simplified */}
        <div className="card stats-card">
          <h3>📊 Análise Rápida</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Economia Prevista</span>
              <span className={`stat-value-large ${economia >= 0 ? 'positive' : 'negative'}`}>
                {formatarMoeda(resumo.receitas - projecaoMensal)}
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-label">Transações</span>
              <span className="stat-value-large">{transacoes.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Status</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: Number(percentualGasto) > 100 ? 'red' : 'green' }}>
                {Number(percentualGasto) > 100 ? 'Orçamento Estourado' : 'Dentro do Orçamento'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header-action">
            <h3>⚡ Ações Rápidas</h3>
            <Link to="/transacoes" className="btn-primary btn-sm">
              + Nova Transação
            </Link>
          </div>
          <div className="quick-actions">
            <Link to="/transacoes?tipo=receita" className="quick-action-btn receita">
              <span className="quick-action-icon">💰</span>
              <span>Adicionar Receita</span>
            </Link>
            <Link to="/transacoes?tipo=despesa" className="quick-action-btn despesa">
              <span className="quick-action-icon">💸</span>
              <span>Adicionar Despesa</span>
            </Link>
            <Link to="/categorias" className="quick-action-btn">
              <span className="quick-action-icon">🏷️</span>
              <span>Gerenciar Categorias</span>
            </Link>
            <Link to="/metas" className="quick-action-btn">
              <span className="quick-action-icon">🎯</span>
              <span>Metas</span>
            </Link>
            <Link to="/bancos" className="quick-action-btn">
              <span className="quick-action-icon">🏦</span>
              <span>Bancos</span>
            </Link>
            <Link to="/gastos-recorrentes" className="quick-action-btn">
              <span className="quick-action-icon">🔄</span>
              <span>Gastos Recorrentes</span>
            </Link>
            {perfil.ganho_fixo_mensal === 0 && (
              <Link to="/perfil" className="quick-action-btn">
                <span className="quick-action-icon">⚙️</span>
                <span>Configurar Ganho Fixo</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Últimas Transações */}
      <div className="card">
        <div className="card-header-action">
          <h3>📋 Últimas Transações</h3>
          <Link to="/transacoes" className="btn-secondary btn-sm">
            Ver Todas
          </Link>
        </div>
        {transacoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Nenhuma transação encontrada para este período</p>
            <Link to="/transacoes" className="btn-primary">
              Adicionar Primeira Transação
            </Link>
          </div>
        ) : (
          <div className="transacoes-list">
            {transacoes.map((transacao) => (
              <div key={transacao.id} className="transacao-item">
                <div className="transacao-info">
                  <div
                    className="transacao-categoria"
                    style={{
                      backgroundColor: transacao.categoria_cor || '#6366f1',
                      boxShadow: `0 0 10px ${transacao.categoria_cor || '#6366f1'}40`
                    }}
                  >
                    {transacao.categoria_nome || 'Sem categoria'}
                  </div>
                  <div>
                    <p className="transacao-descricao">{transacao.descricao}</p>
                    <p className="transacao-data">{formatarData(transacao.data)}</p>
                  </div>
                </div>
                <div className={`transacao-valor ${transacao.tipo}`}>
                  {transacao.tipo === 'receita' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
