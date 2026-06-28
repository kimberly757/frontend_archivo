import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function loginRequest(correo, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      correo,
      password,
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar sesión'
    throw new Error(errorMsg)
  }
}

export async function forgotPasswordRequest(correo) {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { correo })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al solicitar recuperación'
    throw new Error(errorMsg)
  }
}

// Flujo real de recuperación: token persistido en BD + enlace enviado por EmailJS
// desde el frontend (ver ForgotPassword.jsx).
export async function olvidePasswordRequest(correo) {
  try {
    const response = await axios.post(`${API_URL}/auth/olvide-password`, { correo })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al solicitar recuperación'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function resetPasswordRequest(token, newPassword) {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al restablecer contraseña'
    throw new Error(errorMsg)
  }
}

export async function changePasswordRequest(currentPassword, newPassword, token) {
  try {
    const response = await axios.post(`${API_URL}/auth/change-password`, 
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al cambiar contraseña'
    throw new Error(errorMsg)
  }
}

export async function getUsersRequest(token) {
  try {
    const response = await axios.get(`${API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener usuarios'
    throw new Error(errorMsg)
  }
}

export async function getRolesRequest(token) {
  try {
    const response = await axios.get(`${API_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener roles'
    throw new Error(errorMsg)
  }
}

export async function createUserRequest(data, token) {
  try {
    const response = await axios.post(`${API_URL}/usuarios`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al crear usuario'
    throw new Error(errorMsg)
  }
}

// Lanza un error marcado como "de sesión" cuando no hay token o el backend lo rechazó
// (401/403). El componente que llama puede revisar `error.isAuthError` para decidir
// si debe forzar el regreso al Login en vez de solo mostrar un mensaje genérico.
function crearErrorDeSesion(mensaje) {
  const error = new Error(mensaje)
  error.isAuthError = true
  return error
}

function exigirToken(token) {
  if (!token) {
    throw crearErrorDeSesion('No hay una sesión activa. Inicia sesión nuevamente.')
  }
}

// Postulaciones de cultores pendientes de revisión (Manejo Web)
export async function getPostulacionesCultoresRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/cultores`, {
      params: { estatus: 'pendiente' },
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener las postulaciones de cultores'
    throw new Error(errorMsg, { cause: error })
  }
}

// Cultores ya aprobados, para el Directorio (Manejo Web)
export async function getCultoresAprobadosRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/cultores`, {
      params: { estatus: 'aprobado' },
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener el directorio de cultores'
    throw new Error(errorMsg, { cause: error })
  }
}

// Ingreso manual de un cultor desde el panel admin: ruta protegida y exclusiva de
// administradores. A diferencia de la postulación pública, el cultor queda APROBADO
// de inmediato y la respuesta incluye `credencialesNuevas` (correo, nombre,
// passwordTemporal) para disparar el correo de bienvenida desde el componente.
export async function ingresoManualCultorRequest(data, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/cultores/ingreso-manual`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al registrar el cultor'
    throw new Error(errorMsg, { cause: error })
  }
}

// Sube la foto/documento de cédula a Cloudinary (vía backend) y la asocia al id_cultor
// recién creado. No fijamos Content-Type a mano: el navegador debe generar el boundary
// del multipart automáticamente al detectar que el body es un FormData.
export async function subirCedulaCultorRequest(idCultor, archivo, token) {
  exigirToken(token)
  try {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('id_cultor', idCultor)

    const response = await axios.post(`${API_URL}/documentos_cultor/cedula`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al subir el documento de cédula'
    throw new Error(errorMsg, { cause: error })
  }
}

// Lista de parroquias para poblar el <select> de id_parroquia. Ruta pública (sin auth).
export async function getParroquiasRequest() {
  try {
    const response = await axios.get(`${API_URL}/parroquias`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener las parroquias'
    throw new Error(errorMsg, { cause: error })
  }
}

// Aprobar o rechazar la postulación de un cultor
export async function actualizarEstatusCultorRequest(idCultor, estatus, token) {
  exigirToken(token)
  try {
    const response = await axios.patch(
      `${API_URL}/cultores/${idCultor}/estatus`,
      { estatus },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar el estatus de la postulación'
    throw new Error(errorMsg, { cause: error })
  }
}
