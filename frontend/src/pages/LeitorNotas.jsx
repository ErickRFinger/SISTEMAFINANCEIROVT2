import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './LeitorNotas.css'

export default function LeitorNotas() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [progresso, setProgresso] = useState(0)
  const [mensagem, setMensagem] = useState({ type: '', text: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMensagem({ type: 'error', text: 'Por favor, selecione uma imagem' })
        return
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMensagem({ type: 'error', text: 'A imagem deve ter no máximo 10MB' })
        return
      }

      setSelectedFile(file)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      setResultado(null)
      setMensagem({ type: '', text: '' })
    }
  }

  const processarImagem = async (criarTransacao = true) => {
    if (!selectedFile) {
      setMensagem({ type: 'error', text: 'Por favor, selecione uma imagem primeiro' })
      return
    }

    setLoading(true)
    setProgresso(0)
    setMensagem({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('imagem', selectedFile)

      // Simular progresso (OCR pode demorar)
      const progressInterval = setInterval(() => {
        setProgresso(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const endpoint = criarTransacao ? '/ocr/processar' : '/ocr/processar-preview'
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setProgresso(percentCompleted)
        }
      })

      clearInterval(progressInterval)
      setProgresso(100)

      if (response.data.success) {
        setResultado(response.data.resultado)

        if (response.data.transacao) {
          setMensagem({
            type: 'success',
            text: response.data.mensagem || 'Transação criada com sucesso!'
          })

          // Disparar evento para atualizar dashboard
          window.dispatchEvent(new CustomEvent('transacaoCriada'))

          // Redirecionar para transações após 2 segundos
          setTimeout(() => {
            navigate('/transacoes')
          }, 2000)
        } else {
          setMensagem({
            type: 'warning',
            text: response.data.mensagem || 'Imagem processada. Revise os dados antes de criar a transação.'
          })
        }
      }
    } catch (error) {
      console.error('Erro ao processar:', error)
      const errorMsg = error.response?.data?.error || 'Erro ao processar imagem'
      const errorDetails = error.response?.data?.detalhes

      setMensagem({
        type: 'error',
        text: errorDetails ? `${errorMsg}: ${errorDetails}` : `${errorMsg}. Tente novamente.`
      })
    } finally {
      setLoading(false)
      setProgresso(0)
    }
  }

  const criarTransacaoManual = async () => {
    if (!resultado || !resultado.valor) {
      setMensagem({ type: 'error', text: 'Não há dados suficientes para criar a transação' })
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/transacoes', {
        descricao: resultado.descricao,
        valor: resultado.valor,
        tipo: resultado.tipo,
        data: new Date().toISOString().split('T')[0]
      })

      setMensagem({ type: 'success', text: 'Transação criada com sucesso!' })

      // Disparar evento para atualizar dashboard
      window.dispatchEvent(new CustomEvent('transacaoCriada'))

      setTimeout(() => {
        navigate('/transacoes')
      }, 1500)
    } catch (error) {
      setMensagem({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao criar transação'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>📸 Leitor de Notas Fiscais</h2>
          <p className="page-subtitle">
            Tire uma foto ou anexe uma imagem da nota fiscal/comprovante para criar a transação automaticamente
          </p>
        </div>
      </div>

      {mensagem.text && (
        <div className={mensagem.type === 'success' ? 'success' : mensagem.type === 'warning' ? 'warning' : 'error'}>
          {mensagem.text}
        </div>
      )}

      <div className="grid grid-2">
        {/* Upload e Preview */}
        <div className="card">
          <h3>📷 Enviar Imagem</h3>
          <p className="card-description">
            Selecione uma foto de nota fiscal, cupom fiscal ou comprovante de pagamento
          </p>

          <div className="upload-area">
            {/* Input para Câmera (Mobile First) */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              capture="environment"
              className="file-input"
              id="camera-input"
            />

            {/* Input para Galeria */}
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="file-input"
              id="gallery-input"
            />

            <div className="upload-placeholder">
              {!preview ? (
                <>
                  <div className="upload-icon">📸</div>
                  <p>Adicione um comprovante</p>

                  <div className="upload-buttons-container">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn-upload-option camera"
                    >
                      <span>📷</span>
                      Tirar Foto
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="btn-upload-option gallery"
                    >
                      <span>🖼️</span>
                      Galeria
                    </button>
                  </div>

                  <span className="upload-hint">Formatos: JPG, PNG, GIF (máx. 10MB)</span>
                </>
              ) : (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <div className="preview-actions">
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="btn-remove-preview"
                    >
                      ❌ Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="progress-text">
                {progresso < 50 ? 'Enviando imagem...' :
                  progresso < 90 ? 'Processando texto...' :
                    'Finalizando...'}
              </p>
            </div>
          )}

          <div className="upload-actions">
            <button
              onClick={() => processarImagem(false)}
              className="btn-secondary"
              disabled={!preview || loading}
            >
              🔍 Apenas Processar
            </button>
            <button
              onClick={() => processarImagem(true)}
              className="btn-primary"
              disabled={!preview || loading}
            >
              {loading ? '⏳ Processando...' : '✨ Processar e Criar Transação'}
            </button>
          </div>
        </div>

        {/* Resultado */}
        <div className="card">
          <h3>📋 Resultado do Processamento</h3>

          {!resultado ? (
            <div className="empty-result">
              <div className="empty-icon">🔍</div>
              <p>Nenhuma imagem processada ainda</p>
              <span className="empty-hint">
                Envie uma imagem para ver os dados extraídos aqui
              </span>
            </div>
          ) : (
            <div className="resultado-container">
              <div className="resultado-item">
                <label>Valor Identificado</label>
                <div className={`resultado-valor ${resultado.valor ? 'found' : 'not-found'}`}>
                  {resultado.valor ? formatarMoeda(resultado.valor) : 'Não identificado'}
                </div>
              </div>

              <div className="resultado-item">
                <label>Descrição</label>
                <div className="resultado-descricao">
                  {resultado.descricao || 'Não identificada'}
                </div>
              </div>

              <div className="resultado-item">
                <label>Tipo</label>
                <div className={`resultado-tipo ${resultado.tipo}`}>
                  {resultado.tipo === 'receita' ? '💰 Receita' : '💸 Despesa'}
                </div>
              </div>

              <div className="resultado-item">
                <label>Confiança</label>
                <div className="resultado-confianca">
                  <div className="confianca-bar">
                    <div
                      className="confianca-fill"
                      style={{ width: `${resultado.confianca * 100}%` }}
                    />
                  </div>
                  <span>{Math.round(resultado.confianca * 100)}%</span>
                </div>
              </div>

              {resultado.texto && (
                <div className="resultado-item">
                  <label>Texto Extraído</label>
                  <div className="resultado-texto">
                    <pre>{resultado.texto.substring(0, 500)}</pre>
                  </div>
                </div>
              )}

              {resultado.valor && !mensagem.text.includes('criada') && (
                <button
                  onClick={criarTransacaoManual}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  ✅ Criar Transação com Estes Dados
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dicas */}
      <div className="card tips-card">
        <h3>💡 Dicas para Melhor Resultado</h3>
        <ul className="tips-list">
          <li>
            <strong>Qualidade da Imagem:</strong> Use fotos bem iluminadas e nítidas
          </li>
          <li>
            <strong>Posicionamento:</strong> Certifique-se de que o texto está legível e na horizontal
          </li>
          <li>
            <strong>Valores:</strong> O sistema identifica valores em R$ automaticamente
          </li>
          <li>
            <strong>Revisão:</strong> Sempre revise os dados extraídos antes de criar a transação
          </li>
          <li>
            <strong>Tipos Suportados:</strong> Notas fiscais, cupons fiscais, comprovantes de pagamento</li>
        </ul>
      </div>
    </div>
  )
}

