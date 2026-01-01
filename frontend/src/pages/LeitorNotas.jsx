import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './LeitorNotas.css'

export default function LeitorNotas() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [mensagem, setMensagem] = useState({ type: '', text: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMensagem({ type: 'error', text: 'Selecione apenas arquivos de imagem.' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setMensagem({ type: 'error', text: 'Imagem muito grande (Max 10MB).' })
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)

      // Resetar estados anteriores
      setResultado(null)
      setMensagem({ type: '', text: '' })
    }
  }

  // Apenas extrai os dados, NÃO salva no banco ainda
  const processarImagem = async () => {
    if (!selectedFile) return

    setLoading(true)
    setMensagem({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('imagem', selectedFile)

      console.log('📤 Enviando imagem para processamento...')
      // Usa rota de preview que apenas extrai dados
      const response = await api.post('/ocr/processar-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 segundos de timeout para IA
      })

      if (response.data && response.data.success) {
        setResultado(response.data.resultado)
        setMensagem({ type: 'success', text: 'Dados extraídos! Revise e confirme abaixo.' })
      } else {
        throw new Error(response.data?.error || 'Falha ao processar imagem')
      }

    } catch (error) {
      console.error('❌ Erro de processamento:', error)
      const errorMsg = error.response?.data?.detalhes || error.message || 'Erro de conexão com servidor'
      setMensagem({ type: 'error', text: `Erro: ${errorMsg}` })
    } finally {
      setLoading(false)
    }
  }

  // Salva a transação no banco
  const salvarTransacao = async () => {
    if (!resultado) return

    setLoading(true)
    try {
      await api.post('/transacoes', {
        descricao: resultado.descricao || 'Despesa não identificada',
        valor: resultado.valor || 0,
        tipo: resultado.tipo || 'despesa',
        data: resultado.data || new Date().toISOString().split('T')[0],
        categoria: resultado.categoria_sugerida || 'Outros'
      })

      setMensagem({ type: 'success', text: 'Transação salva com sucesso!' })
      setTimeout(() => navigate('/transacoes'), 1500)

    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMensagem({ type: 'error', text: 'Erro ao salvar transação no banco de dados.' })
    } finally {
      setLoading(false)
    }
  }

  const formatarMoeda = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="container" style={{ maxWidth: '800px' }}>

      <div className="page-header center">
        <div>
          <h2>📄 Novo Comprovante</h2>
          <p className="page-subtitle">Tire uma foto ou anexe um arquivo para extrair os dados automaticamente.</p>
        </div>
      </div>

      {mensagem.text && (
        <div className={`message-box ${mensagem.type} glass-alert`}>
          {mensagem.text}
        </div>
      )}

      <div className="grid">

        {/* CARD DE UPLOAD */}
        <div className="card upload-card">

          {!preview ? (
            <div
              className="upload-area"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="upload-icon">📸</div>
              <h3 className="upload-title">Toque para adicionar</h3>
              <p className="upload-hint">Suporta JPG, PNG e WEBP</p>
            </div>
          ) : (
            <div className="preview-container">
              <img
                src={preview}
                alt="Comprovante"
                className="preview-image"
              />
              <button
                onClick={() => setPreview(null)}
                className="btn-icon-overlay"
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            capture="environment" // Mobile camera support
            style={{ display: 'none' }}
          />

          {/* BOTÃO DE AÇÃO PRINCIPAL */}
          {preview && !resultado && (
            <button
              onClick={processarImagem}
              disabled={loading}
              className="btn-primary full-width"
            >
              {loading ? '🔍 Lendo Comprovante...' : '✨ Ler Comprovante com IA'}
            </button>
          )}
        </div>

        {/* CARD DE RESULTADO (SÓ APARECE DEPOIS) */}
        {resultado && (
          <div className="card result-card">
            <h3>✅ Informações Identificadas</h3>

            <div className="info-grid">
              <div className="info-group full">
                <label>Onde gastou/recebeu?</label>
                <div className="info-value">{resultado.descricao}</div>
              </div>

              <div className="info-row">
                <div className="info-group">
                  <label>Valor</label>
                  <div className="info-value highlight-success">
                    {formatarMoeda(resultado.valor)}
                  </div>
                </div>

                <div className="info-group">
                  <label>Data</label>
                  <div className="info-value">
                    {resultado.data ? new Date(resultado.data).toLocaleDateString('pt-BR') : 'Hoje'}
                  </div>
                </div>
              </div>

              <div className="info-group">
                <label>Categoria Sugerida</label>
                <div className="categoria-badge">
                  {resultado.categoria_sugerida || 'Geral'}
                </div>
              </div>

              <hr className="divider" />

              <button
                onClick={salvarTransacao}
                disabled={loading}
                className="btn-success full-width"
              >
                {loading ? '💾 Salvando...' : '💾 Confirmar e Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

