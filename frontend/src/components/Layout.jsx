import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
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
              <h1>💰 Financeiro <small style={{ fontSize: '0.6rem', opacity: 0.7 }}>v2.1</small></h1>
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
              to="/leitor"
              className={isActive('/leitor') ? 'nav-link active special-link' : 'nav-link special-link'}
              onClick={closeMenu}
              style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                borderRadius: '0.5rem',
                margin: '0 0.5rem'
              }}
            >
              📷 Comprovante
            </Link>
            <Link
              to="/perfil"
              className={isActive('/perfil') ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              👤 Perfil
            </Link>
          </div>

          <div className="nav-user">
            <span className="nav-user-name">Olá, {user?.nome}</span>
            <button onClick={logout} className="btn-secondary btn-sm">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
