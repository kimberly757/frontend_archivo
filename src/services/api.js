import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function loginRequest(correo, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      correo,
      password,
      // Este panel solo autentica cuentas que no sean de cultor (ver authController.login).
      portal: 'admin',
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar sesión'
    throw new Error(errorMsg)
  }
}

export async function verificarPasswordRequest(password, token) {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-password`, { password }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Contraseña incorrecta'
    throw new Error(errorMsg)
  }
}

export async function getProfileRequest(token) {
  try {
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener el perfil'
    throw new Error(errorMsg)
  }
}

export async function updateProfileRequest(data, token) {
  try {
    const response = await axios.put(`${API_URL}/auth/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar el perfil'
    throw new Error(errorMsg)
  }
}

export async function getNotificacionesRequest(token) {
  try {
    const response = await axios.get(`${API_URL}/notificaciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener notificaciones'
    throw new Error(errorMsg)
  }
}

export async function marcarNotificacionesLeidasRequest(token) {
  try {
    const response = await axios.put(`${API_URL}/notificaciones/marcar-leidas`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al marcar notificaciones'
    throw new Error(errorMsg)
  }
}

export async function marcarNotificacionLeidaRequest(id, token) {
  try {
    const response = await axios.patch(`${API_URL}/notificaciones/${id}/leer`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al marcar la notificación'
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

export async function toggleActivoUserRequest(idUsuario, token) {
  exigirToken(token)
  try {
    const response = await axios.patch(`${API_URL}/usuarios/${idUsuario}/toggle-activo`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al cambiar estado del usuario'
    throw new Error(errorMsg, { cause: error })
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

// Obtener un cultor por ID (Administrativo)
export async function getCultorByIdRequest(idCultor, token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/cultores/${idCultor}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener el cultor'
    throw new Error(errorMsg, { cause: error })
  }
}

// Actualizar un cultor existente (Administrativo)
export async function updateCultorRequest(idCultor, data, token) {
  exigirToken(token)
  try {
    const response = await axios.put(`${API_URL}/cultores/${idCultor}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar el cultor'
    throw new Error(errorMsg, { cause: error })
  }
}

// Valida mediante OCR que la imagen sea una Cédula de Identidad venezolana, SIN crear
// ningún registro. Ruta pública (sin auth) — se usa antes de crear el cultor.
export async function validarCedulaRequest(archivo) {
  try {
    const formData = new FormData()
    formData.append('archivo', archivo)

    const response = await axios.post(`${API_URL}/documentos_cultor/validar-cedula`, formData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const errorMsg = data?.error || 'La imagen no corresponde a una Cédula de Identidad válida.'
    const err = new Error(errorMsg, { cause: error })
    err.detalles = data?.detalles || []
    err.ocrData = data
    throw err
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

// Sube múltiples documentos de soporte a Cloudinary y los asocia al id_cultor.
export async function subirDocumentosSoporteRequest(idCultor, archivos, token) {
  exigirToken(token)
  try {
    const formData = new FormData()
    archivos.forEach(file => formData.append('archivos', file))
    formData.append('id_cultor', idCultor)

    const response = await axios.post(`${API_URL}/documentos_cultor/subir-soporte`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al subir documentos de soporte'
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

// Obtener todas las categorías de obras
export async function getCategoriasRequest() {
  try {
    const response = await axios.get(`${API_URL}/categorias_obra`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener las categorías'
    throw new Error(errorMsg, { cause: error })
  }
}

// Crear una nueva categoría de obra (Administrativo)
export async function createCategoriaRequest(nombre_categoria, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/categorias_obra`, { nombre_categoria }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al crear la categoría'
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

// Activar o desactivar el usuario vinculado a un cultor (toggle activo)
export async function toggleActivoCultorRequest(idCultor, token) {
  exigirToken(token)
  try {
    const response = await axios.patch(`${API_URL}/cultores/${idCultor}/activar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al cambiar estado del cultor'
    throw new Error(errorMsg, { cause: error })
  }
}

// Registra un nuevo control de fe de vida para un cultor (miembro activo/honorario).
// Cada llamada crea un registro nuevo; el directorio muestra el más reciente por fecha_control.
export async function registrarFeDeVidaRequest(idCultor, estatusConfirmado, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/fe_de_vida`, {
      id_cultor: idCultor,
      estatus_confirmado: estatusConfirmado,
      fecha_control: new Date().toISOString().slice(0, 10),
      metodo_verificacion: 'Registro manual (admin)',
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al registrar la fe de vida'
    throw new Error(errorMsg, { cause: error })
  }
}

// ==========================================
// OBRAS E INVENTARIO
// ==========================================

// Obtener todas las obras del inventario (Administrativo)
export async function getObrasAdminRequest(token, estatus = null) {
  exigirToken(token)
  try {
    const url = estatus ? `${API_URL}/obras?estatus=${estatus}` : `${API_URL}/obras`
    const response = await axios.get(url, {
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

// Actualizar estatus de una obra (aprobar/rechazar) (Administrativo)
export async function updateObraEstatusRequest(idObra, estatus, token, extraData = {}) {
  exigirToken(token)
  try {
    const response = await axios.patch(`${API_URL}/obras/${idObra}/estatus`, { estatus, ...extraData }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar estatus de la obra'
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

// Crear una obra nueva (Administrativo)
export async function createObraRequest(data, token) {
  exigirToken(token)
  try {
    const headers = { Authorization: `Bearer ${token}` }
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }
    const response = await axios.post(`${API_URL}/obras`, data, { headers })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al crear la obra'
    throw new Error(errorMsg, { cause: error })
  }
}

// Actualizar una obra existente (Administrativo)
export async function updateObraRequest(idObra, data, token) {
  exigirToken(token)
  try {
    const headers = { Authorization: `Bearer ${token}` }
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }
    const response = await axios.put(`${API_URL}/obras/${idObra}`, data, { headers })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar la obra'
    throw new Error(errorMsg, { cause: error })
  }
}

// Eliminar una obra (Administrativo - Eliminación Lógica)
export async function deleteObraRequest(idObra, token) {
  exigirToken(token)
  try {
    const response = await axios.delete(`${API_URL}/obras/${idObra}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al eliminar la obra'
    throw new Error(errorMsg, { cause: error })
  }
}

// Eliminar una obra previa verificación de contraseña del administrador
export async function deleteObraWithPasswordRequest(idObra, password, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/obras/${idObra}/delete`, { password }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al eliminar la obra'
    throw new Error(errorMsg, { cause: error })
  }
}

// ==========================================
// DASHBOARD
// ==========================================

// Resumen estadístico consolidado del panel administrativo (solo Administrador)
export async function getDashboardResumenRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/dashboard/resumen`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener el resumen del dashboard'
    throw new Error(errorMsg, { cause: error })
  }
}

// Conteo de tareas pendientes para el widget "Acciones Requeridas" del dashboard
export async function getPendientesRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/dashboard/pendientes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener pendientes'
    throw new Error(errorMsg, { cause: error })
  }
}

// KPIs y gráficos del módulo Reportes y Catálogo (solo Administrador)
export async function getReportesResumenRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/dashboard/reportes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener el resumen de reportes'
    throw new Error(errorMsg, { cause: error })
  }
}

// Descarga genérica de archivos protegidos (PDF/CSV) generados por el backend.
// Como es un endpoint autenticado, no se puede usar un <a href> plano: se pide el
// archivo como blob con el token en el header y se dispara la descarga por JS.
async function descargarArchivoRequest(path, token, nombreArchivoPorDefecto) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    })
    const contentDisposition = response.headers['content-disposition']
    const match = contentDisposition && contentDisposition.match(/filename="(.+)"/)
    const nombreArchivo = match ? match[1] : nombreArchivoPorDefecto

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al descargar el archivo'
    throw new Error(errorMsg, { cause: error })
  }
}

export function exportarCultoresPdfRequest(token) {
  return descargarArchivoRequest('/dashboard/exportar/cultores-pdf', token, 'reporte_cultores_registrados.pdf')
}

export function exportarCultoresExcelRequest(token) {
  return descargarArchivoRequest('/dashboard/exportar/cultores-excel', token, 'reporte_cultores_registrados.xlsx')
}

export function exportarObrasCsvRequest(token) {
  return descargarArchivoRequest('/dashboard/exportar/obras-csv', token, 'inventario_obras.xlsx')
}

export function exportarObrasPorMunicipioExcelRequest(token) {
  return descargarArchivoRequest('/dashboard/exportar/obras-por-municipio-excel', token, 'patrimonio_por_municipio.xlsx')
}

export function exportarCatalogoConsolidadoRequest(token) {
  return descargarArchivoRequest('/dashboard/exportar/catalogo-consolidado-pdf', token, 'catalogo_consolidado_archivo.pdf')
}

export function exportarFichaCultorRequest(idCultor, token) {
  return descargarArchivoRequest(`/dashboard/exportar/ficha-cultor/${idCultor}`, token, `ficha_cultor_${idCultor}.pdf`)
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
    const headers = { Authorization: `Bearer ${token}` }
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }
    const response = await axios.put(`${API_URL}/configuracion-web`, data, { headers })
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
// EFEMÉRIDES
// ==========================================

export async function getEfemeridesAdminRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/efemerides`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al obtener efemérides'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function createEfemerideRequest(data, token) {
  exigirToken(token)
  try {
    const headers = { Authorization: `Bearer ${token}` }
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }
    const response = await axios.post(`${API_URL}/efemerides`, data, { headers })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al crear la efeméride'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function updateEfemerideRequest(id_efemeride, data, token) {
  exigirToken(token)
  try {
    const headers = { Authorization: `Bearer ${token}` }
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }
    const response = await axios.put(`${API_URL}/efemerides/${id_efemeride}`, data, { headers })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar la efeméride'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function deleteEfemerideRequest(id_efemeride, token) {
  exigirToken(token)
  try {
    const response = await axios.delete(`${API_URL}/efemerides/${id_efemeride}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al eliminar la efeméride'
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

// Subir un archivo multimedia (imagen/documento) de una obra
export async function getSalasRequest(token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/salas`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al obtener las salas'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function getSalaByIdRequest(id, token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/salas/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al obtener la sala'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function createSalaRequest(data, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/salas`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al crear la sala'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function updateSalaRequest(id, data, token) {
  exigirToken(token)
  try {
    const response = await axios.put(`${API_URL}/salas/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al actualizar la sala'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function cambiarEstadoSalaRequest(id, data, token) {
  exigirToken(token)
  try {
    const response = await axios.patch(`${API_URL}/salas/${id}/estado`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al cambiar estado de la sala'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function deleteSalaRequest(id, token) {
  exigirToken(token)
  try {
    const response = await axios.delete(`${API_URL}/salas/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al eliminar la sala'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function getObrasPorSalaRequest(id, token) {
  exigirToken(token)
  try {
    const response = await axios.get(`${API_URL}/salas/${id}/obras`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || 'Error al obtener las obras de la sala'
    throw new Error(errorMsg, { cause: error })
  }
}

export async function uploadMultimediaRequest(formData, token) {
  exigirToken(token)
  try {
    const response = await axios.post(`${API_URL}/multimedia/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw crearErrorDeSesion('Tu sesión expiró o no es válida. Inicia sesión nuevamente.')
    }
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al subir el archivo multimedia'
    throw new Error(errorMsg, { cause: error })
  }
}
