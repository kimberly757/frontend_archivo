import emailjs from '@emailjs/browser'

// Credenciales reales de EmailJS, ahora en .env (antes vivían hardcodeadas aquí mismo
// con estos mismos valores — nunca fueron placeholders genéricos). Mover a variables
// de entorno evita que un futuro cambio en este archivo las pise por accidente.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const TEMPLATE_CREDENCIALES = import.meta.env.VITE_EMAILJS_TEMPLATE_CREDENCIALES
const TEMPLATE_RECUPERACION = import.meta.env.VITE_EMAILJS_TEMPLATE_RECUPERACION

// Credenciales de acceso: usada tanto al aprobar un cultor como al crear un usuario
// desde el admin. Variables de plantilla: {{to_email}}, {{nombre_usuario}}, {{password}}, {{rol_usuario}}
export function enviarCredenciales({ correo, nombre, password, rol_usuario }) {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_CREDENCIALES,
    { to_email: correo, nombre_usuario: nombre, password, rol_usuario },
    PUBLIC_KEY
  )
}

// Recuperación de contraseña con enlace real (token persistido en BD por el backend).
// Variables de plantilla: {{to_email}}, {{nombre_usuario}}, {{reset_link}}
export function enviarRecuperacion({ correo, nombre, resetLink }) {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_RECUPERACION,
    { to_email: correo, nombre_usuario: nombre, reset_link: resetLink },
    PUBLIC_KEY
  )
}
