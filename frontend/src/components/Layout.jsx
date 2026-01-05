import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNavigation from './BottomNavigation'

import ChatWidget from './ChatWidget'
import './Layout.css'

export default function Layout() {
  const { user, logout, viewMode, setViewMode } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/dashboard" onClick={closeMenu}>
              <h1>💰 Financeiro</h1>
            </Link>
          </div>

          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? 'hamburger open' : 'hamburger'}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            {viewMode === 'pessoal' && (
              <>
                <Link
                  to="/dashboard"
                  className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  📊 Dashboard
                </Link>
                <Link
                  to="/transacoes"
                  className={isActive('/transacoes') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  💰 Transações
                </Link>
                <Link
                  to="/agenda"
                  className={isActive('/agenda') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  📅 Agenda
                </Link>

                <Link
                  to="/categorias"
                  className={isActive('/categorias') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🏷️ Categorias
                </Link>
                <Link
                  to="/metas"
                  className={isActive('/metas') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🎯 Metas
                </Link>
                <Link
                  to="/bancos"
                  className={isActive('/bancos') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🏦 Bancos
                </Link>
                <Link
                  to="/cartoes"
                  className={isActive('/cartoes') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  💳 Cartões
                </Link>
                <Link
                  to="/gastos-recorrentes"
                  className={isActive('/gastos-recorrentes') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🔄 Recorrentes
                </Link>
                <Link
                  to="/investimentos"
                  className={isActive('/investimentos') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  📈 Investimentos
                </Link>
                <Link
                  to="/calculadora"
                  className={isActive('/calculadora') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🧮 Calculadora
                </Link>
                <Link
                  to="/relatorios"
                  className={isActive('/relatorios') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  📈 Relatórios
                </Link>
                <Link
                  to="/perfil"
                  className={isActive('/perfil') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  👤 Perfil
                </Link>
              </>
            )}

            {/* Menu Empresarial */}
            {(user?.tipo_conta === 'empresarial' || user?.tipo_conta === 'hibrido') && (
              <>
                <div className="nav-divider" style={{ borderTop: '1px solid var(--border)', margin: '10px 0', opacity: 0.5 }}></div>
                <small style={{ paddingLeft: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                  Empresarial
                </small>

                <Link
                  to="/demandas"
                  className={isActive('/demandas') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  📑 Demandas
                </Link>

                <Link
                  to="/funcionarios"
                  className={isActive('/funcionarios') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  👥 Funcionários
                </Link>
                <Link
                  to="/clientes"
                  className={isActive('/clientes') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🤝 Clientes
                </Link>
                <Link
                  to="/estoque"
                  className={isActive('/estoque') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  📦 Estoque
                </Link>
                <Link
                  to="/servicos"
                  className={isActive('/servicos') ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  🛠️ Serviços
                </Link>
              </>
            )}
          </div>

          <div className="nav-user">
            <span className="nav-user-name">
              Olá, {user?.nome}
              {user?.tipo_conta === 'hibrido' ? (
                <button
                  onClick={() => setViewMode(viewMode === 'pessoal' ? 'empresarial' : 'pessoal')}
                  style={{
                    fontSize: '0.7rem',
                    background: viewMode === 'empresarial' ? 'var(--text)' : 'var(--primary)',
                    color: viewMode === 'empresarial' ? 'var(--bg-primary)' : 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    verticalAlign: 'middle',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  title="Clique para alternar o modo"
                >
                  {viewMode === 'empresarial' ? 'MODO EMPRESA' : 'MODO PESSOAL'}
                </button>
              ) : (
                <span style={{
                  fontSize: '0.7rem',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginLeft: '8px',
                  verticalAlign: 'middle'
                }}>
                  {user?.tipo_conta === 'empresarial' ? 'BIZ' : 'PESSOAL'}
                </span>
              )}
            </span>
            <button onClick={logout} className="btn-secondary btn-sm">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <BottomNavigation />
      <ChatWidget />
    </div>
  )
}
