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
