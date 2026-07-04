import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, X, Shield, Mail } from 'lucide-react'
import { changePasswordRequest, updateProfileRequest } from '../services/api'
import './pages/UsersManagement.css'

// Misma regla que el backend (ver commonSchemas.js): mínimo 8 caracteres, al menos
// una mayúscula y al menos un carácter especial.
function validarPasswordSegura(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-ZÁÉÍÓÚÑ]/.test(password)) return 'La contraseña debe tener al menos una letra mayúscula.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe tener al menos un carácter especial.'
  return ''
}

const ChangePasswordModal = ({ isOpen, onClose, profile, onProfileUpdated }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edición de correo de acceso
  const [correo, setCorreo] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // Limpiar campos al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess('')
      setEmailError('')
      setEmailSuccess('')
    } else {
      setCorreo(profile?.correo || '')
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  const nombreCompleto = profile ? `${profile.primer_nombre} ${profile.primer_apellido}` : 'Administrador'
  const nombreRol = profile?.rolRel?.nombre_rol || 'Administrador'
  const iniciales = profile
    ? (profile.primer_nombre[0] + profile.primer_apellido[0]).toUpperCase()
    : 'AD'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    const errorPassword = validarPasswordSegura(newPassword)
    if (errorPassword) {
      setError(errorPassword)
      return
    }

    const token = localStorage.getItem('auth-token')
    if (!token) {
      setError('No hay sesión activa. Por favor inicie sesión nuevamente.')
      return
    }

    setLoading(true)
    try {
      const data = await changePasswordRequest(currentPassword, newPassword, token)
      setSuccess(data.message || 'Contraseña actualizada con éxito.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onProfileUpdated?.()

      // Auto cerrar el modal después de 2 segundos de éxito
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err?.message || 'Error al cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')

    const token = localStorage.getItem('auth-token')
    if (!token) {
      setEmailError('No hay sesión activa. Por favor inicie sesión nuevamente.')
      return
    }

    setEmailLoading(true)
    try {
      await updateProfileRequest({ correo }, token)
      setEmailSuccess('Correo actualizado con éxito.')
      onProfileUpdated?.()
    } catch (err) {
      setEmailError(err?.message || 'Error al actualizar el correo.')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="modal-overlay-backdrop">
      <div className="modal-box-card" style={{ maxWidth: '500px' }}>
        <div className="modal-box-header">
          <h2>Mi Perfil</h2>
          <button className="close-x-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-box-body">
          {/* Información del Perfil (Solo vista) */}
          <div className="dossier-profile-header">
            <div className="dossier-avatar">{iniciales}</div>
            <div className="dossier-profile-meta">
              <h3>{nombreCompleto}</h3>
              <span className="dossier-sub">
                <Shield size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {nombreRol}
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '0 0 16px 0' }}>Correo de Acceso</h3>

          {emailError && (
            <div className="error-banner-group" style={{ marginBottom: '8px' }}>{emailError}</div>
          )}
          {emailSuccess && (
            <div className="review-banner-alert success" style={{ marginBottom: '8px' }}>
              <div className="review-banner-text">
                <strong>Correo actualizado</strong>
                <p>{emailSuccess}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} style={{ marginBottom: '20px' }}>
            <div className="input-box-field">
              <label htmlFor="profile-email">Correo electrónico</label>
              <div className="icon-input-container" style={{ position: 'relative' }}>
                <Mail size={15} className="field-icon-left" />
                <input
                  type="email"
                  id="profile-email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
              <p style={{ marginTop: '6px', fontSize: '11px', color: '#807471' }}>
                Solo puedes cambiar el correo una vez al mes.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn-terracota" disabled={emailLoading}>
                {emailLoading ? 'Guardando...' : 'Actualizar Correo'}
              </button>
            </div>
          </form>

          <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '0 0 16px 0' }}>Cambiar Contraseña</h3>

          {error && (
            <div className="error-banner-group" style={{ marginBottom: '8px' }}>{error}</div>
          )}
          {success && (
            <div className="review-banner-alert success" style={{ marginBottom: '8px' }}>
              <div className="review-banner-text">
                <strong>Contraseña actualizada</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} id="change-password-form">
            <div className="input-box-field">
              <label htmlFor="current-password">Contraseña Actual <span className="req-star">*</span></label>
              <div className="icon-input-container" style={{ position: 'relative' }}>
                <Lock size={15} className="field-icon-left" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  id="current-password"
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="grid-action-btn"
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', zIndex: 2 }}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-box-field">
              <label htmlFor="new-password">Nueva Contraseña <span className="req-star">*</span></label>
              <div className="icon-input-container" style={{ position: 'relative' }}>
                <Lock size={15} className="field-icon-left" />
                <input
                  type={showNew ? 'text' : 'password'}
                  id="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="grid-action-btn"
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', zIndex: 2 }}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ marginTop: '6px', fontSize: '11px', color: '#807471' }}>
                Mínimo 8 caracteres, con al menos una mayúscula y un carácter especial.
              </p>
            </div>

            <div className="input-box-field">
              <label htmlFor="confirm-password">Confirmar Nueva Contraseña <span className="req-star">*</span></label>
              <div className="icon-input-container" style={{ position: 'relative' }}>
                <Lock size={15} className="field-icon-left" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirm-password"
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="grid-action-btn"
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', zIndex: 2 }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-box-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="change-password-form" className="btn-terracota" disabled={loading}>
            {loading ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordModal
