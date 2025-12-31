import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro capturado:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1>⚠️ Algo deu errado</h1>
          <p style={{ color: '#ef4444', margin: '1rem 0' }}>{this.state.error?.message || 'Erro desconhecido'}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}
          >
            Recarregar Página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

