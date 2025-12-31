import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify')
      if (response.data && response.data.valid) {
        setUser(response.data.user)
      } else {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, senha) => {
    try {
      if (!email || !senha) {
        return {
          success: false,
          error: 'Email e senha são obrigatórios'
        }
      }

      const response = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        senha: senha 
      })

      if (!response.data || !response.data.token) {
        return {
          success: false,
          error: 'Resposta inválida do servidor'
        }
      }

      const { token, user } = response.data
      
      if (!token || !user) {
        return {
          success: false,
          error: 'Dados de autenticação inválidos'
        }
      }

      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      
      let errorMessage = 'Erro ao fazer login'
      
      if (error.response) {
        // Erro do servidor - usar a mensagem já processada pelo interceptor
        errorMessage = error.message || 'Erro ao fazer login'
      } else if (error.request) {
        // Erro de conexão
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      } else {
        // Outro erro
        errorMessage = error.message || errorMessage
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const register = async (nome, email, senha) => {
    try {
      if (!nome || !email || !senha) {
        return {
          success: false,
          error: 'Todos os campos são obrigatórios'
        }
      }

      const response = await api.post('/auth/register', { 
        nome: nome.trim(), 
        email: email.trim().toLowerCase(), 
        senha 
      })

      if (!response.data || !response.data.token) {
        return {
          success: false,
          error: 'Resposta inválida do servidor'
        }
      }

      const { token, user } = response.data
      
      if (!token || !user) {
        return {
          success: false,
          error: 'Dados de registro inválidos'
        }
      }

      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Erro no registro:', error)
      
      let errorMessage = 'Erro ao registrar'
      
      if (error.response) {
        // Erro do servidor - usar a mensagem já processada pelo interceptor
        errorMessage = error.message || 'Erro ao registrar'
      } else if (error.request) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      } else {
        errorMessage = error.message || errorMessage
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

