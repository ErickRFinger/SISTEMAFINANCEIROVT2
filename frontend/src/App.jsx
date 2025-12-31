import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Transacoes from './pages/Transacoes'
import Categorias from './pages/Categorias'
import Perfil from './pages/Perfil'
import LeitorNotas from './pages/LeitorNotas'
import Metas from './pages/Metas'
import Bancos from './pages/Bancos'
import GastosRecorrentes from './pages/GastosRecorrentes'
import Investimentos from './pages/Investimentos'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return user ? <Navigate to="/dashboard" /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transacoes" element={<Transacoes />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="leitor" element={<LeitorNotas />} />
        <Route path="metas" element={<Metas />} />
        <Route path="bancos" element={<Bancos />} />
        <Route path="gastos-recorrentes" element={<GastosRecorrentes />} />
        <Route path="investimentos" element={<Investimentos />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App

