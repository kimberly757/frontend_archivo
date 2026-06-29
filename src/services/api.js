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

// Lista de parroquias filtradas por municipio
export async function getParroquiasByMunicipioRequest(idMunicipio) {
  try {
    const response = await axios.get(`${API_URL}/parroquias/municipio/${idMunicipio}`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener las parroquias filtradas'
    throw new Error(errorMsg, { cause: error })
  }
}

// Lista de oficios
export async function getOficiosRequest() {
  try {
    const response = await axios.get(`${API_URL}/oficios`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener los oficios'
    throw new Error(errorMsg, { cause: error })
  }
}

// Lista de municipios
export async function getMunicipiosRequest() {
  try {
    const response = await axios.get(`${API_URL}/municipios`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener los municipios'
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

// ==========================================
// OBRAS E INVENTARIO
// ==========================================

// Obtener todas las obras del inventario (Administrativo)
export async function getObrasAdminRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/obras`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener el inventario de obras'
    throw new Error(errorMsg, { cause: error })
  }
}

// Actualizar campo destacado_galeria de una obra
export async function updateObraDestacadoRequest(idObra, destacado, token) {
  exigirToken(token)
  try {
    const response = await axios.patch(`${API_URL}/obras/${idObra}/destacado`, {
      destacado_galeria: destacado
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar destacado_galeria'
    throw new Error(errorMsg, { cause: error })
  }
}

// ==========================================
// CONFIGURACIÓN WEB
// ==========================================

export async function getConfiguracionWebRequest() {
  try {
    const response = await axios.get(`${API_URL}/configuracion-web`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener la configuración web'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function updateConfiguracionWebRequest(data, token) {
  exigirToken(token)
  try {
    const response = await axios.put(`${API_URL}/configuracion-web`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar la configuración web'
    throw new Error(errorMsg, { cause: error })
  }
}

// ==========================================
// EXPOSICIONES
// ==========================================

export async function getExposicionesAdminRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/exposiciones`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener exposiciones'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function createExposicionAdminRequest(data, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/exposiciones`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al crear exposición'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function updateExposicionAdminRequest(id_exposicion, data, token) {
  exigirToken(token)
  try {
    const response = await axios.put(`${API_URL}/exposiciones/${id_exposicion}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar exposición'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function deleteExposicionAdminRequest(id_exposicion, token) {
  exigirToken(token)
  try {
    const response = await axios.delete(`${API_URL}/exposiciones/${id_exposicion}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al eliminar exposición'
    throw new Error(errorMsg, { cause: error })
  }
}

// ==========================================
// EXPOSICION_OBRAS (Vínculos)
// ==========================================

export async function getObrasPorExposicionRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/exposicion_obras`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener vínculos de obras'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function linkObraExposicionRequest(id_exposicion, id_obra, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/exposicion_obras`, { id_exposicion, id_obra }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al vincular obra'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function unlinkObraExposicionRequest(id_exposicion, id_obra, token) {
  exigirToken(token)
  try {
    const response = await axios.delete(`${API_URL}/exposicion_obras/${id_exposicion}/${id_obra}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al desvincular obra'
    throw new Error(errorMsg, { cause: error })
  }
}
