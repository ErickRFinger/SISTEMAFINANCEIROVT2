import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import ChatWidget from './ChatWidget'
import './Layout.css'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <div className="layout">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Header (Hamburger) */}
        <header className="mobile-header">
          <button
            className="hamburger-btn"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            ☰
          </button>
          <span className="mobile-brand">Financeiro Premium</span>
        </header>

        <div className="content-padder">
          <Outlet />
        </div>
      </main>

      <ChatWidget />
    </div>
  )
}
