import React, { useState, useEffect } from 'react'
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
  Lock
} from 'lucide-react'
import './UsersManagement.css'
import { getUsersRequest, createUserRequest } from '../../services/api'

const UsersManagement = () => {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [roleFilter, setRoleFilter] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newUserRoleId, setNewUserRoleId] = useState('4')
  const [newUserStatus, setNewUserStatus] = useState(true)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load users and roles on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const usersData = await getUsersRequest(token)
      setUsers(usersData)
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
      const token = localStorage.getItem('token')
      const payload = {
        primer_nombre: firstName,
        primer_apellido: lastName,
        correo: newUserEmail,
        id_rol: parseInt(newUserRoleId),
        activo: newUserStatus
      }

      if (newPassword.trim()) {
        payload.password = newPassword.trim()
      }
      
      const newUser = await createUserRequest(payload, token)
      setUsers([newUser, ...users])
      
      // Reset form and close modal
      setFirstName('')
      setLastName('')
      setNewUserEmail('')
      setNewPassword('')
      setNewUserRoleId('4')
      setNewUserStatus(true)
      setIsModalOpen(false)
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

  // Get initials for profile badge
  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase()
    }
    return 'US'
  }

  return (
    <div className="users-module-container">
      {/* Header and Action */}
      <div className="page-header">
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO</span>
            <span className="separator">&gt;</span>
            <span className="current">GESTIÓN DE USUARIOS</span>
          </nav>
          <h1>Gestión de Usuarios</h1>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Crear Usuario</span>
        </button>
      </div>

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
                  <th>USUARIO</th>
                  <th>CORREO ELECTRÓNICO</th>
                  <th>ROL DE ACCESO</th>
                  <th>ESTATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
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
                      <span className={`status-badge ${user.activo ? 'activo' : 'inactivo'}`}>
                        <span className="status-dot"></span>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
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
      </div>

      {/* Creation Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Crear Nuevo Usuario</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)} aria-label="Cerrar modal">
                <X size={20} />
              </button>
            </div>

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
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-password">Contraseña <span style={{color: '#807471', fontWeight: 'normal'}}>(Opcional)</span></label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input 
                        type="text" 
                        id="user-password" 
                        placeholder="Dejar vacío para aleatoria"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Tipo de Usuario (Rol) <span className="required">*</span></label>
                    <div className="filter-tabs" style={{ marginTop: '4px' }}>
                      <button 
                        type="button"
                        className={`filter-tab ${newUserRoleId === '1' ? 'active' : ''}`}
                        onClick={() => setNewUserRoleId('1')}
                        style={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
                      >
                        <Shield size={16} /> Administrador
                      </button>
                      <button 
                        type="button"
                        className={`filter-tab ${newUserRoleId === '4' ? 'active' : ''}`}
                        onClick={() => setNewUserRoleId('4')}
                        style={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
                      >
                        <User size={16} /> Cultor
                      </button>
                    </div>
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
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersManagement
