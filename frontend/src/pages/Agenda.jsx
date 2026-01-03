import { useState, useEffect } from 'react'
import api from '../services/api'
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
    isToday, parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './Agenda.css'

export default function Agenda() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState({})
    const [selectedDay, setSelectedDay] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        carregarEventos()
    }, [currentDate])

    const carregarEventos = async () => {
        try {
            setLoading(true)
            const mes = String(currentDate.getMonth() + 1).padStart(2, '0')
            const ano = String(currentDate.getFullYear())

            // 1. Carregar Transações do Mês (Realizadas)
            const transacoesRes = await api.get('/transacoes', { params: { mes, ano } })

            // 2. Carregar Recorrentes (Projeção) - Simulando endpoint ou filtrando
            // Idealmente o backend projeteria, mas vamos usar o endpoint de transacoes por enquanto
            // e depois podemos adicionar uma lógica para "Puxar" os gastos recorrentes ativos

            const mappedEvents = {}

            transacoesRes.data.forEach(t => {
                const dateKey = t.data.split('T')[0]
                if (!mappedEvents[dateKey]) mappedEvents[dateKey] = []
                mappedEvents[dateKey].push({
                    id: t.id,
                    tipo: t.tipo,
                    descricao: t.descricao,
                    valor: t.valor,
                    status: 'realizado'
                })
            })

            setEvents(mappedEvents)
        } catch (error) {
            console.error('Erro ao carregar agenda:', error)
        } finally {
            setLoading(false)
        }
    }

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const dateFormat = "d"
        const rows = []
        let days = []
        let day = startDate
        let formattedDate = ""

        // Header dos dias
        const daysHeader = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="calendar-header-day">{d}</div>
        ))

        // Dias Grid
        const dayCells = eachDayOfInterval({ start: startDate, end: endDate }).map(dayItem => {
            const dateKey = format(dayItem, 'yyyy-MM-dd')
            const dayEvents = events[dateKey] || []
            const isCurrentMonth = isSameMonth(dayItem, monthStart)

            return (
                <div
                    key={dateKey}
                    className={`calendar-day ${!isCurrentMonth ? 'disabled' : ''} ${isToday(dayItem) ? 'today' : ''}`}
                    onClick={() => setSelectedDay({ date: dayItem, events: dayEvents })}
                    style={{ opacity: isCurrentMonth ? 1 : 0.3 }}
                >
                    <span className="day-number">{format(dayItem, dateFormat)}</span>
                    <div className="day-indicators">
                        {dayEvents.map((ev, i) => (
                            <div key={i} className={`indicator ${ev.tipo === 'receita' ? 'income' : 'expense'}`} />
                        ))}
                    </div>
                </div>
            )
        })

        return (
            <>
                <div className="calendar-grid" style={{ marginBottom: '1rem' }}>
                    {daysHeader}
                </div>
                <div className="calendar-grid" style={{ marginTop: 0 }}>
                    {dayCells}
                </div>
            </>
        )
    }

    return (
        <div className="container">
            <div className="page-header">
                <div>
                    <h2>📅 Agenda Financeira</h2>
                    <p className="page-subtitle">Visualize seus pagamentos e recebimentos</p>
                </div>
                <div className="month-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={prevMonth} className="btn-secondary btn-sm">◀</button>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button onClick={nextMonth} className="btn-secondary btn-sm">▶</button>
                </div>
            </div>

            <div className="card">
                {loading ? <div className="loading">Carregando calendário...</div> : renderCalendar()}
            </div>

            {/* MODAL DETAILS */}
            {selectedDay && (
                <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{format(selectedDay.date, "d 'de' MMMM", { locale: ptBR })}</h3>

                        {selectedDay.events.length === 0 ? (
                            <p style={{ opacity: 0.6, fontStyle: 'italic', padding: '1rem' }}>Nenhum lançamento neste dia.</p>
                        ) : (
                            <div className="day-details-list">
                                {selectedDay.events.map((ev, idx) => (
                                    <div key={idx} className={`detail-item ${ev.tipo}`}>
                                        <div>
                                            <strong style={{ display: 'block' }}>{ev.descricao}</strong>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                {ev.status === 'realizado' ? '✅ Pago' : '⏳ Pendente'}
                                            </span>
                                        </div>
                                        <span className={ev.tipo === 'receita' ? 'text-green' : 'text-red'} style={{ fontWeight: 'bold' }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ev.valor)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                            <button onClick={() => setSelectedDay(null)} className="btn-primary full-width">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
