
import { useState, useRef, useEffect, Suspense, lazy } from 'react'
import api from '../services/api'
import './ChatWidget.css'

// Lazy load markdown to avoid initial bundle bloat (safe pattern via Suspense fallback is not needed here if imported normally, but sticking to previous working impl - actually lets use direct import for simplicity)
import ReactMarkdown from 'react-markdown'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, text: "Olá! Sou o Cérebro 🧠. Pergunte sobre suas finanças!", sender: 'ai' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { id: Date.now(), text: input, sender: 'user' }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await api.post('/chat', { message: userMsg.text })
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: res.data.reply,
                sender: 'ai',
                timestamp: new Date()
            }])
        } catch (error) {
            console.error('Erro no Chat:', error)
            const errorMsg = error.response?.data?.error || error.response?.data?.details || "Erro ao conectar com o Cérebro. Verifique a conexão."

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: `⚠️ **Erro**: ${errorMsg}`,
                sender: 'ai',
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="chat-widget-container">
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div className="chat-avatar">🧠</div>
                        <div>
                            <h3>Cérebro IA</h3>
                            <p>Assistente Financeiro V5.0</p>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.sender}`}>
                                {msg.sender === 'ai' ? (
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="message ai">
                                <div className="typing-indicator">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input
                            className="chat-input"
                            placeholder="Pergunte algo..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="chat-send" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}

            <button className={`chat-fab ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    )
}
