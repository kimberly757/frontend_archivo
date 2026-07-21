import { useState } from 'react'
import { ArrowRight, Landmark } from 'lucide-react'
import './Login.css'
import { olvidePasswordRequest } from '../../services/api'
import { enviarRecuperacion } from '../../services/emailNotifications'

const ForgotPassword = ({ onBack }) => {
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setLoading(true)
    try {
      const data = await olvidePasswordRequest(correo)

      // Solo viene presente cuando el correo sí existe; el mensaje genérico se
      // muestra siempre, exista o no la cuenta, para no filtrar esa información.
      if (data.resetToken) {
        const resetLink = `${window.location.origin}/#/recuperar-password?token=${data.resetToken}`
        try {
          await enviarRecuperacion({ correo, nombre: data.nombre, resetLink })
        } catch {
          setError('No se pudo enviar el correo de recuperación. Contacta a soporte técnico.')
        }
      }

      setMensaje(data.message || 'Si el correo está registrado, recibirás un enlace de recuperación.')
    } catch (err) {
      setError(err?.message || 'Error al solicitar la recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-container">
      {/* Left Branding Panel */}
      <div className="login-brand-panel">
        <span className="brand-top-label">Ministerio de Cultura</span>

        <div className="brand-center-content">
          <div className="landmark-icon-container">
            <Landmark size={28} />
          </div>
          <h1 className="brand-title">Archivo Regional del Folklore</h1>
          <p className="brand-subtitle">y Patrimonio Cultural "Luis Felipe Ramón y Rivera"</p>
          <div className="brand-underline"></div>
        </div>

        <p className="brand-bottom-label">Sistema de Gestión y Control Patrimonial</p>
      </div>

      {/* Right Panel */}
      <div className="login-form-panel">
        <div className="login-card">
          <h2>Recuperar Contraseña</h2>
          <p className="login-card-desc">Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.</p>

          {error && <p className="login-error-text">{error}</p>}
          {mensaje && (
            <p style={{ color: '#005f00', backgroundColor: '#e2f5e2', padding: '10px', borderRadius: '5px', fontSize: '0.85rem', marginBottom: '15px' }}>
              {mensaje}
            </p>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Correo Institucional</label>
              <div className="input-wrapper">
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="usuario@archivo.gob"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              <span>{loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: '#1a365d', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        </div>

        <p className="login-copyright">
          © 2024 Archivo Regional de Folklore. Reservados todos los derechos.
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
