import React from 'react';
import { Link } from 'react-router-dom';

export default function Relatorios() {
    return (
        <div className="container">
            <div className="card">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
                    <h2>Relatórios Detalhados</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Esta funcionalidade está em desenvolvimento. <br />
                        Em breve você terá gráficos detalhados sobre suas finanças aqui.
                    </p>
                    <Link to="/dashboard" className="btn-primary">
                        Voltar para Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
