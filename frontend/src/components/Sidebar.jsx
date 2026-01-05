import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

export default function Sidebar({ isOpen, toggleMenu }) {
    const { user, logout, viewMode, setViewMode } = useAuth()
    const location = useLocation()

    const isActive = (path) => {
        return location.pathname === path
    }

    // Links Pessoais
    const personalLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/transacoes', label: 'Transações', icon: '💰' },
        { path: '/agenda', label: 'Agenda', icon: '📅' },
        { path: '/categorias', label: 'Categorias', icon: '🏷️' },
        { path: '/metas', label: 'Metas', icon: '🎯' },
        { path: '/bancos', label: 'Bancos', icon: '🏦' },
        { path: '/cartoes', label: 'Cartões', icon: '💳' },
        { path: '/gastos-recorrentes', label: 'Recorrentes', icon: '🔄' },
        { path: '/investimentos', label: 'Investimentos', icon: '📈' },
        { path: '/calculadora', label: 'Calculadora', icon: '🧮' },
        { path: '/relatorios', label: 'Relatórios', icon: '📑' },
        { path: '/perfil', label: 'Perfil', icon: '👤' },
    ]

    // Links Empresariais
    const businessLinks = [
        { path: '/dashboard', label: 'Business Dash', icon: '🏢' },
        { path: '/demandas', label: 'Demandas', icon: '📑' },
        { path: '/funcionarios', label: 'Funcionários', icon: '👥' },
        { path: '/clientes', label: 'Clientes', icon: '🤝' },
        { path: '/estoque', label: 'Estoque', icon: '📦' },
        { path: '/servicos', label: 'Serviços', icon: '🛠️' },
    ]

    const links = viewMode === 'empresarial' ? businessLinks : personalLinks

    return (
        <>
            {/* Overlay para Mobile */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={toggleMenu}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="brand-logo">
                        {viewMode === 'empresarial' ? '🚀 Business' : '💰 Financeiro'}
                    </h1>
                    <button className="close-btn-mobile" onClick={toggleMenu}>
                        ✕
                    </button>
                </div>

                {/* User Info & Mode Switch */}
                <div className="user-section">
                    <div className="user-avatar">
                        {user?.nome?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.nome?.split(' ')[0]}</span>

                        {user?.tipo_conta === 'hibrido' && (
                            <button
                                className={`mode-switch ${viewMode}`}
                                onClick={() => setViewMode(viewMode === 'pessoal' ? 'empresarial' : 'pessoal')}
                            >
                                {viewMode === 'pessoal' ? 'Mudar para Empresa' : 'Mudar para Pessoal'}
                            </button>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group-title">
                        {viewMode === 'empresarial' ? 'GESTÃO EMPRESARIAL' : 'GESTÃO PESSOAL'}
                    </div>

                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-item ${isActive(link.path) ? 'active' : ''}`}
                            onClick={toggleMenu} // Fecha menu no mobile ao clicar
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span className="nav-label">{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-btn">
                        🚪 Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    )
}
