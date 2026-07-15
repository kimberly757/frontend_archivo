import { useState, useEffect } from 'react'
import {
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react'
import './Login.css'
import logoM from '../../assets/LogoM.png'
import { loginRequest, getConfiguracionWebRequest } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const equipoDesarrollo = [
  'Julieth Andrade',
  'Kimberly Cegarra',
  'Yilbert Torres',
  'Maria Escalante',
  'Lizmar Cruz',
]

const Login = ({ onLoginSuccess }) => {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [configWeb, setConfigWeb] = useState(null)

  useEffect(() => {
    getConfiguracionWebRequest()
      .then(data => {
        if (data) setConfigWeb(data)
      })
      .catch(err => console.error('Error al cargar config de login:', err))
  }, [])

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
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full bg-[#ede9e1] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      {/* Left Branding Panel — ocupa toda la fila en móvil como cabecera, columna izquierda en desktop */}
      <div 
        className="relative flex flex-col justify-between p-6 sm:p-12 text-white overflow-hidden bg-cover bg-center min-h-[180px] md:min-h-0"
        style={configWeb?.login_imagen ? { backgroundImage: `url(${configWeb.login_imagen})` } : { background: '#1b100e url(\'../../assets/login2.png\') no-repeat center center / cover' }}
      >
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 100% 0%, rgba(180, 83, 60, 0.25) 0%, rgba(27, 16, 14, 0.3) 70%), radial-gradient(circle at 80% 50%, rgba(245, 158, 11, 0.15) 0%, rgba(27, 16, 14, 0.35) 60%), linear-gradient(rgba(27, 16, 14, 0.1), rgba(27, 16, 14, 0.2))'
        }} />
        <span className="relative z-10 text-[11px] font-bold tracking-[1.5px] text-white/45 uppercase">
          Ministerio de Cultura
        </span>

        <div className="relative z-10 flex flex-col items-start max-w-[520px]">
          <div className="w-20 h-20 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center mb-6 text-white overflow-hidden p-1">
            <img src={logoM} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[32px] sm:text-[38px] font-bold leading-[1.15] tracking-[-0.8px] text-white mb-3">
            Inicio de Sesión
          </h1>
          <p className="text-xl text-white/85 font-normal m-0 leading-[1.4]">
            Panel Administrativo del Archivo Regional de Cultura y Folklore "Luis Felipe Ramón y Rivera"
          </p>
          <div className="w-16 h-1 bg-[#bf360c] rounded mt-6" />
        </div>

        <p className="relative z-10 text-[10px] font-bold tracking-[2.5px] text-white/50 uppercase m-0">
          Sistema de Gestión y Control Patrimonial
        </p>

        <div className="relative z-10 mt-4">
          <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-white/80 m-0">
            Realizado por
          </p>
          <p className="text-[11px] italic text-white/65 m-0 mt-1 mb-2">
            Estudiantes De la UNEFA - Carrera Ing. De Sistemas
          </p>
          <ul className="m-0 flex flex-col gap-1 p-0 list-none">
            {equipoDesarrollo.map((nombre) => (
              <li key={nombre} className="text-[12.5px] font-medium text-white/90">
                {nombre}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex flex-col min-h-0 overflow-y-auto bg-gradient-to-r from-[rgba(138,54,34,0.35)] to-[#ede9e1]">
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 w-full px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 lg:pt-12">
          <div className="w-full max-w-md bg-white/55 backdrop-blur-md rounded-2xl shadow-[0px_30px_60px_-15px_rgba(0,0,0,0.08),0px_0px_0px_1px_rgba(0,0,0,0.03)] p-5 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#8A3622] to-[#612112]" />
          <h2 className="text-[32px] sm:text-[32px] font-extrabold text-[#281b18] tracking-[-0.5px] m-0 mb-3">
            Iniciar Sesión
          </h2>
          <p className="text-[14.5px] text-[#807471] leading-[1.5] m-0 mb-9">
            Accede al panel administrativo para la gestión de bienes culturales.
          </p>

          {error && <p className="login-error-text">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
            <div className="flex flex-col mb-5">
              <label className="text-[12px] font-semibold text-[#5c4c47] mb-2" htmlFor="email">Correo Institucional</label>
              <div className="flex items-center bg-white border border-[#e0ddd8] rounded-xl px-4 h-[52px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] focus-within:border-[#B4533C] focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.01),0_0_0_3px_rgba(180,83,60,0.1)]">
                <input
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="usuario@archivo.gob"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-none outline-none bg-transparent flex-1 h-full text-[14px] text-[#281b18] font-inherit placeholder:text-[#a39996]"
                />
              </div>
            </div>

            <div className="flex flex-col mb-5">
              <label className="text-[12px] font-semibold text-[#5c4c47] mb-2" htmlFor="password">Contraseña</label>
              <div className="flex items-center bg-white border border-[#e0ddd8] rounded-xl px-4 h-[52px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] focus-within:border-[#B4533C] focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.01),0_0_0_3px_rgba(180,83,60,0.1)]">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-none outline-none bg-transparent flex-1 h-full text-[14px] text-[#281b18] font-inherit placeholder:text-[#a39996]"
                />
                <button
                  type="button"
                  className="bg-none border-none cursor-pointer text-[#a39996] ml-3 p-0 flex items-center justify-center hover:text-[#5c4c47]"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 mb-7 text-[13px]">
              <div
                className="flex items-center gap-2 text-[#5c4c47] cursor-pointer select-none"
                onClick={() => setRememberMe(prev => !prev)}
              >
                <div className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-[#B4533C] border-[#B4533C]' : 'bg-white border-[#ebeae6]'}`}>
                  {rememberMe && <div className="w-[6px] h-[6px] rounded-full bg-white" />}
                </div>
                <span>Recordarme</span>
              </div>
              <a
                href="/#/olvide-password"
                onClick={(e) => { e.preventDefault(); window.location.hash = '/olvide-password' }}
                className="text-[#B4533C] font-bold no-underline hover:text-[#a02d0a]"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>

            <button type="submit" disabled={loading} className="bg-gradient-to-r from-[#8A3622] to-[#612112] text-white border-none rounded-xl h-14 text-[15.5px] font-extrabold tracking-[0.5px] cursor-pointer flex items-center justify-center gap-3 shadow-[0_8px_20px_-4px_rgba(138,54,34,0.35)] transition-all duration-300 hover:shadow-[0_12px_24px_-6px_rgba(138,54,34,0.45)] hover:-translate-y-0.5 active:translate-y-0 mt-3 mb-4">
              <span>{loading ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="text-center text-[13px] text-[#807471] mt-8 leading-[1.5]">
            ¿Problemas de acceso?
            <a
              href="#soporte-tecnico"
              className="text-[#B4533C] font-bold no-underline block mt-1 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                showToast({ titulo: 'Soporte Técnico', mensaje: 'soporte@archivo.gob.ve', tipo: 'info' })
              }}
            >
              Contactar Soporte Técnico
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 px-4 sm:px-8 lg:px-12 pb-6 sm:pb-8 lg:pb-12 shrink-0">
        <p className="text-[11px] text-[rgba(40,27,24,0.4)] m-0 text-center break-words max-w-full">
          © 2024 Archivo Regional de Folklore. Reservados todos los derechos.
        </p>
      </div>
      </div>
    </div>
  )
}

export default Login
