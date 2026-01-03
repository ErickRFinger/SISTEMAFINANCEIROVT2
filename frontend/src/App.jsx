import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transacoes = lazy(() => import('./pages/Transacoes'))
const Categorias = lazy(() => import('./pages/Categorias'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Metas = lazy(() => import('./pages/Metas'))
const Bancos = lazy(() => import('./pages/Bancos'))
const GastosRecorrentes = lazy(() => import('./pages/GastosRecorrentes'))
const Investimentos = lazy(() => import('./pages/Investimentos'))
const Calculadora = lazy(() => import('./pages/Calculadora'))
const Cartoes = lazy(() => import('./pages/Cartoes'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Layout = lazy(() => import('./components/Layout'))

// Componente de carregamento
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Carregando sistema...</p>
  </div>
)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return user ? <Navigate to="/dashboard" /> : children
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
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
          <Route path="metas" element={<Metas />} />
          <Route path="bancos" element={<Bancos />} />
          <Route path="gastos-recorrentes" element={<GastosRecorrentes />} />
          <Route path="cartoes" element={<Cartoes />} />
          <Route path="investimentos" element={<Investimentos />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="calculadora" element={<Calculadora />} />
          <Route path="agenda" element={<Agenda />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  React.useEffect(() => {
    console.log('App V5.0 Optimized Loaded')
    document.title = "FINANCEIRO V5.0"
  }, [])

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
