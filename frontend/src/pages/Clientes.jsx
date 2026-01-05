import React from 'react'
import './Dashboard.css'

export default function Clientes() {
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>🤝 Gestão de Clientes</h1>
                    <p>Cadastre e gerencie seus clientes e empresas parceiras.</p>
                </div>
                <button className="btn-primary">
                    + Novo Cliente
                </button>
            </div>

            <div className="dashboard-cards">
                <div className="card">
                    <h3>Total de Clientes</h3>
                    <p className="card-value">0</p>
                </div>
                <div className="card">
                    <h3>Novos este Mês</h3>
                    <p className="card-value">0</p>
                </div>
            </div>

            <div className="recent-transactions card" style={{ marginTop: '20px' }}>
                <h3>Base de Clientes</h3>
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    Nenhum cliente cadastrado.
                </p>
            </div>
        </div>
    )
}
