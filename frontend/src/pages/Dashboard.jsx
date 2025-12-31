import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import './Dashboard.css'

export default function Dashboard() {
  const [resumo, setResumo] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0
  })
  const [transacoes, setTransacoes] = useState([])
  const [totalGuardado, setTotalGuardado] = useState(0)
  const [perfil, setPerfil] = useState({ ganho_fixo_mensal: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hoje = new Date()
  const [mesAno, setMesAno] = useState({
    mes: String(hoje.getMonth() + 1).padStart(2, '0'),
    ano: String(hoje.getFullYear())
  })

  const carregarDados = useCallback(async () => {
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
        console.log('📊 Resumo recebido:', resumoData)
      } catch (error) {
        console.error('❌ Erro ao carregar resumo:', error)
        setError('Erro ao carregar resumo financeiro')
      }

      // Carregar transações
      try {
        const transacoesRes = await api.get('/transacoes', { params: { ...mesAno } })
        transacoesData = Array.isArray(transacoesRes.data) ? transacoesRes.data : []
        console.log('💳 Transações recebidas:', transacoesData.length)
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
        console.log('👤 Perfil recebido:', perfilData)
      } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error)
        // Perfil não é crítico, continuar sem ele
        if (error.response?.status === 401) {
          // Token inválido - será tratado pelo interceptor
          throw error
        }
      }

      // Garantir que resumo sempre tenha valores numéricos
      const resumoFormatado = {
        receitas: Number(resumoData.receitas) || 0,
        despesas: Number(resumoData.despesas) || 0,
        saldo: Number(resumoData.saldo) || 0
      }

      // Limitar transações a 10
      const transacoesLimitadas = transacoesData.slice(0, 10)

      console.log('✅ Dados processados:', {
        resumo: resumoFormatado,
        transacoes: transacoesLimitadas.length,
        perfil: perfilData
      })

      setResumo(resumoFormatado)
      setTransacoes(transacoesLimitadas)
      setPerfil(perfilData)

      // Carregar bancos para calcular total guardado
      try {
        const bancosRes = await api.get('/bancos')
        const moveisBancos = bancosRes.data || []
        const total = moveisBancos.reduce((acc, banco) => acc + (Number(banco.saldo_atual) || 0), 0)
        setTotalGuardado(total)
      } catch (error) {
        console.error('❌ Erro ao carregar bancos:', error)
      }

    } catch (error) {
      console.error('❌ Erro crítico ao carregar dados:', error)

      // Se for erro de autenticação, não mostrar erro genérico
      if (error.response?.status === 401) {
        console.log('🔐 Token inválido, redirecionando para login...')
        // O interceptor já vai redirecionar
        return
      }

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

  return (
    <div className="container">
      <div className="dashboard-header-container">
        <div>
          <h2>📊 Dashboard Financeiro</h2>
          <p className="dashboard-subtitle">Visão geral das suas finanças</p>
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

      {/* Total Guardado (Patrimônio) */}
      <div className="card total-guardado-card">
        <div className="total-guardado-header">
          <div className="total-guardado-icon">🏦</div>
          <div>
            <h3>TOTAL GUARDADO</h3>
            <p className="total-guardado-subtitle">Soma de todos os seus bancos</p>
          </div>
        </div>
        <p className="total-guardado-valor">{formatarMoeda(totalGuardado)}</p>
      </div>

      {/* Ganho Fixo */}
      {perfil.ganho_fixo_mensal > 0 && (
        <div className="card ganho-fixo-card">
          <div className="ganho-fixo-header">
            <div>
              <h3>💰 Ganho Fixo Mensal</h3>
              <p className="ganho-fixo-valor">{formatarMoeda(perfil.ganho_fixo_mensal)}</p>
            </div>
            <Link to="/perfil" className="btn-secondary btn-sm">
              Configurar
            </Link>
          </div>
          <div className="ganho-fixo-stats">
            <div className="stat-item">
              <span className="stat-label">Receitas do Mês</span>
              <span className="stat-value">{formatarMoeda(resumo.receitas)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Diferença</span>
              <span className={`stat-value ${resumo.receitas >= perfil.ganho_fixo_mensal ? 'positive' : 'negative'}`}>
                {resumo.receitas >= perfil.ganho_fixo_mensal ? '+' : ''}
                {formatarMoeda(resumo.receitas - perfil.ganho_fixo_mensal)}
              </span>
            </div>
          </div>
        </div>
      )}

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
              {percentualGasto}% do total
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
        <div className="card stats-card">
          <h3>📊 Estatísticas do Mês</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Projeção Mensal</span>
              <span className="stat-value-large">{formatarMoeda(projecaoMensal)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Economia Prevista</span>
              <span className={`stat-value-large ${economia >= 0 ? 'positive' : 'negative'}`}>
                {formatarMoeda(resumo.receitas - projecaoMensal)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">% Gasto</span>
              <span className={`stat-value-large ${Number(percentualGasto) > 80 ? 'negative' : Number(percentualGasto) > 60 ? 'warning' : 'positive'}`}>
                {percentualGasto}%
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Transações</span>
              <span className="stat-value-large">{transacoes.length}</span>
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
