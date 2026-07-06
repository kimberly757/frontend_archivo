import React, { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'
import {
  Search,
  Plus,
  User,
  Mail,
  Shield,
  Trash2,
  X,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import './UsersManagement.css'
import { getUsersRequest, createUserRequest, getRolesRequest, toggleActivoUserRequest } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { enviarCredenciales } from '../../services/emailNotifications'

const UsersManagement = () => {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Roles disponibles para el selector de "Crear Usuario" — excluye 'cultor' a
  // propósito: esa creación es exclusiva del flujo de Ingreso Manual (ManualCultorForm),
  // que además aprueba al cultor de inmediato y genera su cuenta de forma distinta.
  const [roles, setRoles] = useState([])

  // Filters state
  const [roleFilter, setRoleFilter] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRoleId, setNewUserRoleId] = useState('')
  const [newUserStatus, setNewUserStatus] = useState(true)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null)
  const [copied, setCopied] = useState(false)
  const [emailSendError, setEmailSendError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const rolesSeleccionables = roles.filter((rol) => rol.nombre_rol?.toLowerCase() !== 'cultor')

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setNewUserEmail('')
    setNewUserRoleId(String(rolesSeleccionables[0]?.id_rol || ''))
    setNewUserStatus(true)
    setFormError('')
    setCreatedUserCredentials(null)
    setCopied(false)
    setEmailSendError('')
  }

  // Load users and roles on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const [usersData, rolesData] = await Promise.all([
        getUsersRequest(token),
        getRolesRequest(token),
      ])
      setUsers(usersData)
      setRoles(rolesData)

      const seleccionables = rolesData.filter((rol) => rol.nombre_rol?.toLowerCase() !== 'cultor')
      const admin = seleccionables.find((rol) => rol.nombre_rol?.toLowerCase() === 'administrador')
      setNewUserRoleId(String((admin || seleccionables[0])?.id_rol || ''))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal submit
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim() || !newUserEmail.trim()) {
      setFormError('Por favor completa todos los campos obligatorios.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      setFormError('Por favor ingresa un correo electrónico válido.')
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      const token = localStorage.getItem('auth-token')
      const payload = {
        primer_nombre: firstName,
        primer_apellido: lastName,
        correo: newUserEmail,
        id_rol: parseInt(newUserRoleId),
        activo: newUserStatus
      }

      const newUser = await createUserRequest(payload, token)
      setUsers([newUser, ...users])

      // La contraseña siempre la genera el sistema (nunca se pide en este formulario).
      // Guardamos las credenciales para mostrárselas al administrador en el modal
      // y disparamos la plantilla de EmailJS hacia el correo del nuevo usuario.
      if (newUser.password_creada) {
        setCreatedUserCredentials({
          correo: newUser.correo,
          password: newUser.password_creada
        })

        const nombreCompleto = `${newUser.primer_nombre} ${newUser.primer_apellido}`
        const nombreRol = newUser.rolRel?.nombre_rol || 'usuario'
        const rolUsuario = nombreRol.charAt(0).toUpperCase() + nombreRol.slice(1)
        try {
          await enviarCredenciales({ correo: newUser.correo, nombre: nombreCompleto, password: newUser.password_creada, rol_usuario: rolUsuario })
        } catch {
          // La cuenta ya quedó creada en la base de datos; si solo falla el correo,
          // las credenciales siguen visibles en el modal para copiarlas manualmente.
          setEmailSendError('El usuario se creó correctamente, pero no se pudo enviar el correo de notificación. Copia la contraseña manualmente.')
        }
      } else {
        resetForm()
        setIsModalOpen(false)
      }
    } catch (error) {
      setFormError(error.message || 'Error al crear usuario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered users
  const filteredUsers = users.filter(user => {
    const roleName = user.rolRel?.nombre_rol?.toLowerCase() || 'desconocido'
    const matchesRole = roleFilter === 'todos' || roleName === roleFilter
    const fullName = `${user.primer_nombre} ${user.primer_apellido}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          user.correo.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  useEffect(() => { setCurrentPage(1) }, [searchQuery, roleFilter])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Get initials for profile badge
  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase()
    }
    return 'US'
  }

  return (
    <div className="users-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO' },
          { label: 'GESTIÓN DE USUARIOS', active: true },
        ]}
        title="Gestión de Usuarios"
        actionButton={
          <button className="ph-action-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Crear Usuario</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <section className="filter-controls-card">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${roleFilter === 'todos' ? 'active' : ''}`}
            onClick={() => setRoleFilter('todos')}
          >
            Todos
          </button>
          <button 
            className={`filter-tab ${roleFilter === 'administrador' ? 'active' : ''}`}
            onClick={() => setRoleFilter('administrador')}
          >
            Administradores
          </button>
          <button 
            className={`filter-tab ${roleFilter === 'cultor' ? 'active' : ''}`}
            onClick={() => setRoleFilter('cultor')}
          >
            Cultores
          </button>
        </div>

        <div className="search-box-wrapper">
          <Search className="search-box-icon" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Limpiar búsqueda">
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {/* Users List Card */}
      <div className="card users-list-card">
        <div className="users-card-header">
          <h3>Usuarios Registrados ({filteredUsers.length})</h3>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p>Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">USUARIO</th>
                  <th className="whitespace-nowrap">CORREO ELECTRÓNICO</th>
                  <th className="whitespace-nowrap">ROL DE ACCESO</th>
                  <th className="whitespace-nowrap">ESTATUS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id_usuario}>
                    <td>
                      <div className="user-profile-cell">
                        <div className={`user-initials-badge ${
                          user.rolRel?.nombre_rol?.toLowerCase() === 'administrador' ? 'role-admin-badge' : 
                          user.rolRel?.nombre_rol?.toLowerCase() === 'cultor' ? 'role-cultor-badge' : 'role-investigador-badge'
                        }`}>
                          {getInitials(user.primer_nombre, user.primer_apellido)}
                        </div>
                        <span className="user-display-name">{user.primer_nombre} {user.primer_apellido}</span>
                      </div>
                    </td>
                    <td className="user-email-cell">{user.correo}</td>
                    <td>
                      <span className={`role-tag ${user.rolRel?.nombre_rol?.toLowerCase()}`}>
                        {user.rolRel?.nombre_rol || 'Sin rol'}
                      </span>
                    </td>
                    <td>
                      <div className="toggle-wrapper">
                        <button
                          className={`toggle-btn ${user.activo ? 'on' : 'off'}`}
                          onClick={async () => {
                            const token = localStorage.getItem('auth-token')
                            try {
                              const { activo } = await toggleActivoUserRequest(user.id_usuario, token)
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id_usuario === user.id_usuario
                                    ? { ...u, activo }
                                    : u
                                )
                              )
                            } catch (err) {
                              showToast({ titulo: 'Error', mensaje: err.message, tipo: 'error' })
                            }
                          }}
                          aria-label={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          <span className="toggle-track">
                            <span className="toggle-dot" />
                          </span>
                        </button>
                        <span className={`toggle-label ${user.activo ? 'active' : 'inactive'}`}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <p className="empty-title">No se encontraron usuarios</p>
            <p className="empty-description">Intenta cambiar el término de búsqueda o selecciona otra categoría.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-footer">
            <button className="page-item-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-number-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="page-item-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Creation Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Crear Nuevo Usuario</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => {
                  resetForm()
                  setIsModalOpen(false)
                }} 
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {createdUserCredentials ? (
              <div className="modal-body success-credentials-body">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: '#e6f4ea', color: '#137333', marginBottom: '12px' }}>
                    <UserCheck size={32} />
                  </div>
                  <h3 style={{ margin: 0, color: '#202124', fontSize: '18px', fontWeight: '600' }}>¡Usuario creado exitosamente!</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#5f6368', fontSize: '14px' }}>
                    {emailSendError
                      ? <>No se pudo notificar por correo a <strong>{createdUserCredentials.correo}</strong>.</>
                      : <>Se ha enviado un correo de bienvenida a <strong>{createdUserCredentials.correo}</strong>.</>}
                  </p>
                </div>

                {emailSendError && (
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#a82c14', backgroundColor: '#fce8e6', padding: '10px', borderRadius: '6px' }}>
                    {emailSendError}
                  </p>
                )}

                <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Credenciales de acceso
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#5f6368', display: 'block' }}>Usuario (Correo):</span>
                      <strong style={{ fontSize: '14px', color: '#202124' }}>{createdUserCredentials.correo}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid #f1f3f4', paddingTop: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#5f6368', display: 'block' }}>Contraseña temporal:</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
                        <code style={{ fontSize: '15px', color: '#c53813', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px', backgroundColor: '#fce8e6', padding: '4px 8px', borderRadius: '4px' }}>
                          {createdUserCredentials.password}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdUserCredentials.password)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copied ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: '#a82c14', display: 'flex', gap: '4px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                  <span>⚠️</span>
                  <span>Por favor, copia esta contraseña ahora. No se volverá a mostrar en la interfaz por motivos de seguridad.</span>
                </p>

                <div className="modal-footer" style={{ borderTop: 'none', padding: '20px 0 0 0' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      resetForm()
                      setIsModalOpen(false)
                    }}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUserSubmit}>
                <div className="modal-body">
                  {formError && <div className="form-error-banner">{formError}</div>}
                  
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label htmlFor="first-name">Primer Nombre <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <User size={16} className="input-icon" />
                        <input 
                          type="text" 
                          id="first-name" 
                          placeholder="Ej. Juan"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="last-name">Primer Apellido <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <User size={16} className="input-icon" />
                        <input 
                          type="text" 
                          id="last-name" 
                          placeholder="Ej. Castañeda"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group">
                      <label htmlFor="user-email">Correo Electrónico <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <Mail size={16} className="input-icon" />
                        <input
                          type="email"
                          id="user-email"
                          placeholder="Ej. correo@folklore.org"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          required
                        />
                      </div>
                      <p style={{ marginTop: '6px', fontSize: '11px', color: '#807471' }}>
                        La contraseña la genera el sistema automáticamente; se mostrará al finalizar.
                      </p>
                    </div>
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group">
                      <label htmlFor="user-role">Tipo de Usuario (Rol) <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <Shield size={16} className="input-icon" />
                        <select id="user-role" value="administrador" disabled>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>
                      <p style={{ marginTop: '6px', fontSize: '11px', color: '#807471' }}>
                        Los cultores se registran desde "Ingreso Manual" en Directorio de Cultores, no aquí.
                      </p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="user-status">Estatus Inicial</label>
                      <div className="input-with-icon">
                        <UserCheck size={16} className="input-icon" />
                        <select 
                          id="user-status"
                          value={newUserStatus.toString()}
                          onChange={(e) => setNewUserStatus(e.target.value === 'true')}
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      resetForm()
                      setIsModalOpen(false)
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersManagement
