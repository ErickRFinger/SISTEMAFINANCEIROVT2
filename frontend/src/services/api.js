import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos
})

// Garantir que a URL termine com /api se for uma URL completa (produção)
// Isso evita erros se o usuário esquecer de colocar /api na variável de ambiente
if (api.defaults.baseURL.startsWith('http')) {
  let url = api.defaults.baseURL;
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/api')) {
    api.defaults.baseURL = `${url}/api`;
  }
}

// Função auxiliar para extrair mensagem de erro de forma segura
function extractErrorMessage(data, defaultMessage = 'Erro desconhecido') {
  if (!data) return defaultMessage

  // Se já é uma string, retorna
  if (typeof data === 'string') return data

  // Se tem propriedade error
  if (data.error) {
    if (typeof data.error === 'string') return data.error
    if (data.error.message) return data.error.message
    return JSON.stringify(data.error)
  }

  // Se tem array de errors
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const firstError = data.errors[0]
    if (typeof firstError === 'string') return firstError
    if (firstError.msg) return firstError.msg
    if (firstError.message) return firstError.message
    return JSON.stringify(firstError)
  }

  // Se tem message
  if (data.message) {
    if (typeof data.message === 'string') return data.message
    return JSON.stringify(data.message)
  }

  // Último recurso: stringify do objeto
  try {
    return JSON.stringify(data)
  } catch {
    return defaultMessage
  }
}

// Interceptor de requisição - adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Garantir que a URL está correta
    const fullUrl = config.baseURL + config.url
    console.log('📤 Requisição:', config.method?.toUpperCase(), fullUrl, config.params || '')
    console.log('   BaseURL:', config.baseURL, '| URL:', config.url, '| Full:', fullUrl)
    return config
  },
  (error) => {
    console.error('❌ Erro no interceptor de requisição:', error)
    return Promise.reject(error)
  }
)

// Interceptor de resposta - tratamento de erros e logs
api.interceptors.response.use(
  (response) => {
    console.log('📥 Resposta:', response.config.url, response.data)
    return response
  },
  (error) => {
    const url = error.config?.url || 'URL desconhecida'
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN'

    if (error.response) {
      // Erro do servidor
      const status = error.response.status
      const data = error.response.data

      console.error(`❌ Erro ${status} na requisição ${method} ${url}:`, data)

      if (status === 401) {
        // Token inválido - limpar e redirecionar
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'))
      } else if (status === 404) {
        // Rota não encontrada
        const errorMsg = extractErrorMessage(data, `Rota não encontrada: ${url}`)
        console.error(`🔍 Rota não encontrada: ${method} ${url}`)
        return Promise.reject(new Error(errorMsg))
      } else if (status >= 500) {
        // Erro do servidor
        const errorMsg = extractErrorMessage(data, 'Erro interno do servidor')
        return Promise.reject(new Error(errorMsg))
      } else {
        // Outros erros (400, 403, etc)
        const errorMsg = extractErrorMessage(data, `Erro ${status}: Requisição inválida`)
        return Promise.reject(new Error(errorMsg))
      }
    } else if (error.request) {
      // Erro de conexão
      console.error('❌ Sem resposta do servidor:', url)
      return Promise.reject(new Error('Não foi possível conectar ao servidor. Verifique se o servidor está rodando.'))
    } else {
      // Outro erro
      console.error('❌ Erro na configuração da requisição:', error.message)
      return Promise.reject(error)
    }
  }
)

export default api

