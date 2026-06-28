import { useState } from 'react'
import {
  Eye,
  EyeOff,
  ArrowRight,
  Landmark
} from 'lucide-react'
import './Login.css'
import { loginRequest } from '../../services/api'

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('usuario@archivo.gob')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginRequest(email, password)
      onLoginSuccess(data)
    } catch (err) {
      setError(err?.message || 'Usuario o contraseña inválidos')
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
          <h1 className="brand-title">Archivo Regional de Folklore</h1>
          <p className="brand-subtitle">Patrimonio Cultural Luis Felipe Ramón y Rivera</p>
          <div className="brand-underline"></div>
        </div>

        <p className="brand-bottom-label">Sistema de Gestión y Control Patrimonial</p>
      </div>

      {/* Right Login Panel */}
      <div className="login-form-panel">
        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          <p className="login-card-desc">Accede al panel administrativo para la gestión de bienes culturales.</p>

          {error && <p className="login-error-text">{error}</p>}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Group */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo Institucional</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@archivo.gob"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Group */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <input
                  id="password"
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

            {/* Form Helpers */}
            <div className="form-helper-row">
              <div
                className="remember-me-container"
                onClick={() => setRememberMe(prev => !prev)}
              >
                <div className={`remember-me-checkbox ${rememberMe ? 'checked' : ''}`}></div>
                <span>Recordarme</span>
              </div>
              <a
                href="/olvide-password"
                className="forgot-password-link"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>

            {/* Action Button */}
            <button type="submit" className="btn-login" disabled={loading}>
              <span>{loading ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Bottom support text */}
          <p className="access-problems-text">
            ¿Problemas de acceso?
            <a
              href="#soporte-tecnico"
              className="support-link"
              onClick={(e) => {
                e.preventDefault()
                alert('Soporte Técnico: soporte@archivo.gob.ve')
              }}
            >
              Contactar Soporte Técnico
            </a>
          </p>
        </div>

        {/* Small Copyright Footer */}
        <p className="login-copyright">
          © 2024 Archivo Regional de Folklore. Reservados todos los derechos.
        </p>

        {/* Créditos del equipo de desarrollo */}
        <p className="login-credits">
          Realizado por: Estudiantes de la UNEFA de la carrera Ing. de Sistemas
          <br />
          Julieth Andrade, Kimberly Cegarra, Yilbert Torres, Maria Escalante, Lizmar Cruz
        </p>
      </div>
    </div>
  )
}

export default Login
