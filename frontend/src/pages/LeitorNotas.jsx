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
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>

      {/* HEADER SIMPLIFICADO */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>📄 Novo Comprovante</h2>
        <p style={{ color: '#666' }}>Tire uma foto ou anexe um arquivo para extrair os dados automaticamente.</p>
      </div>

      {/* ÁREA DE MENSAGENS */}
      {mensagem.text && (
        <div className={`message-box ${mensagem.type}`} style={{
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          backgroundColor: mensagem.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: mensagem.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${mensagem.type === 'error' ? '#f87171' : '#86efac'}`
        }}>
          {mensagem.text}
        </div>
      )}

      <div className="grid" style={{ display: 'grid', gap: '20px' }}>

        {/* CARD DE UPLOAD */}
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>

          {!preview ? (
            <div
              onClick={() => fileInputRef.current.click()}
              style={{
                border: '3px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>Toque para adicionar</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Suporta JPG, PNG e WEBP</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <img
                src={preview}
                alt="Comprovante"
                style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'contain', background: '#f1f5f9' }}
              />
              <button
                onClick={() => setPreview(null)}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                  padding: '8px 12px', borderRadius: '20px', cursor: 'pointer'
                }}
              >
                Trocar Imagem
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* BOTÃO DE AÇÃO PRINCIPAL */}
          {preview && !resultado && (
            <button
              onClick={processarImagem}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '16px',
                background: loading ? '#94a3b8' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              {loading ? '🔍 Lendo Comprovante...' : '✨ Ler Comprovante com IA'}
            </button>
          )}
        </div>

        {/* CARD DE RESULTADO (SÓ APARECE DEPOIS) */}
        {resultado && (
          <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #2563eb' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>✅ Informações Identificadas</h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div className="info-group">
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Onde gastou/recebeu?</label>
                <div style={{ fontSize: '18px', fontWeight: '500', color: '#0f172a' }}>{resultado.descricao}</div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="info-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Valor</label>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                    {formatarMoeda(resultado.valor)}
                  </div>
                </div>

                <div className="info-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Data</label>
                  <div style={{ fontSize: '18px', color: '#0f172a' }}>
                    {resultado.data ? new Date(resultado.data).toLocaleDateString('pt-BR') : 'Hoje'}
                  </div>
                </div>
              </div>

              <div className="info-group">
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Categoria Sugerida</label>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '15px',
                  fontWeight: '500'
                }}>
                  {resultado.categoria_sugerida || 'Geral'}
                </div>
              </div>

              <hr style={{ borderColor: '#e2e8f0', margin: '10px 0' }} />

              <button
                onClick={salvarTransacao}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)'
                }}
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

