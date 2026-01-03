import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNavigation.css';

export default function BottomNavigation() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="bottom-nav">
            <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                <div className="nav-icon">📊</div>
                <span>Dash</span>
            </Link>

            <Link to="/transacoes" className={`nav-item ${isActive('/transacoes') ? 'active' : ''}`}>
                <div className="nav-icon">💰</div>
                <span>Transações</span>
            </Link>

            <Link to="/transacoes?action=new" className="nav-item fab-container">
                <div className="fab-button">
                    +
                </div>
            </Link>

            <Link to="/relatorios" className={`nav-item ${isActive('/relatorios') ? 'active' : ''}`}>
                <div className="nav-icon">📈</div>
                <span>Relatórios</span>
            </Link>

            <Link to="/perfil" className={`nav-item ${isActive('/perfil') ? 'active' : ''}`}>
                <div className="nav-icon">👤</div>
                <span>Perfil</span>
            </Link>
        </div>
    );
}
