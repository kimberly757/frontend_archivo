import { useState } from 'react'
import { Lock, Eye, EyeOff, ArrowRight, Landmark } from 'lucide-react'
import './Login.css'
import { resetPasswordRequest } from '../../services/api'

// Vista "neutral": no sabe ni decide nada sobre roles (Administrador/Cultor) — solo
// confirma el cambio de contraseña y devuelve a la raíz, donde el Login real maneja
// la sesión y cualquier redirección por rol.
const ResetPassword = () => {
  const token = new URLSearchParams(window.location.hash.split('?')[1] || '').get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const volverAlInicio = () => {
    window.location.href = '/'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!token) {
      setError('El enlace de recuperación no es válido. Solicita uno nuevo.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const data = await resetPasswordRequest(token, password)
      setSuccessMessage(data.message || 'Contraseña restablecida con éxito. Redirigiendo al inicio de sesión...')
      setTimeout(volverAlInicio, 3000)
    } catch (err) {
      setError(err?.message || 'Error al restablecer contraseña')
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

      {/* Right Reset Panel */}
      <div className="login-form-panel">
        <div className="login-card">
          <h2>Restablecer Contraseña</h2>
          <p className="login-card-desc">Ingresa tu nueva contraseña para acceder al sistema.</p>

          {error && <p className="login-error-text">{error}</p>}
          {successMessage && <p style={{ color: '#005f00', backgroundColor: '#e2f5e2', padding: '10px', borderRadius: '5px', fontSize: '0.85rem', marginBottom: '15px' }}>{successMessage}</p>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Nueva Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirmar Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              <span>{loading ? 'Guardando...' : 'Guardar Contraseña'}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={volverAlInicio}
                style={{ background: 'none', border: 'none', color: '#1a365d', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Volver al inicio de sesión
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

export default ResetPassword
