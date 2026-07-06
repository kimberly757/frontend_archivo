import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Bell,
  LayoutDashboard,
  UserCheck,
  Users,
  Landmark,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Lock as LockIcon,
  Settings,
  X,
  AlertTriangle
} from 'lucide-react'
import './Layout.css'
import adminAvatar from '../assets/admin_avatar.png'
import ChangePasswordModal from './ChangePasswordModal'
import { getProfileRequest, getNotificacionesRequest, marcarNotificacionesLeidasRequest, marcarNotificacionLeidaRequest, getObrasAdminRequest } from '../services/api'

const Layout = ({ children, currentView, onViewChange, onLogout }) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Perfil real del usuario logueado (nombre, rol, correo, si su contraseña sigue
  // siendo la temporal generada por el sistema), traído de /auth/profile.
  const [profile, setProfile] = useState(null)
  const [notificaciones, setNotificaciones] = useState([])
  const [notifAbiertas, setNotifAbiertas] = useState(false)
  const notifRef = useRef(null)

  // Contador inmediato de obras pendientes de aprobación, para el badge del sidebar.
  const [obrasPendientesCount, setObrasPendientesCount] = useState(0)

  const cargarObrasPendientes = () => {
    const token = localStorage.getItem('auth-token')
    if (!token) return
    getObrasAdminRequest(token, 'pendiente')
      .then((obras) => setObrasPendientesCount(Array.isArray(obras) ? obras.length : 0))
      .catch(() => {})
  }

  const cargarPerfil = () => {
    const token = localStorage.getItem('auth-token')
    if (!token) return
    getProfileRequest(token).then(setProfile).catch(() => {})
  }

  const cargarNotificaciones = () => {
    const token = localStorage.getItem('auth-token')
    if (!token) return
    getNotificacionesRequest(token).then(setNotificaciones).catch(() => {})
  }

  useEffect(() => {
    cargarPerfil()
    cargarNotificaciones()
    cargarObrasPendientes()
  }, [])

  // Refresca el contador cada vez que se cambia de vista (ej. tras aprobar/rechazar
  // una obra en Inventario Patrimonial, al volver aquí el badge ya se actualiza).
  useEffect(() => {
    cargarObrasPendientes()
  }, [currentView])

  // Cerrar el dropdown de notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifAbiertas(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleNotificaciones = () => {
    const nuevoEstado = !notifAbiertas
    setNotifAbiertas(nuevoEstado)
    if (nuevoEstado) {
      cargarNotificaciones()
    }
  }

  const marcarLeidas = () => {
    const token = localStorage.getItem('auth-token')
    if (!token) return
    marcarNotificacionesLeidasRequest(token)
      .then(() => setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true }))))
      .catch(() => {})
  }

  const handleNotificacionClick = (n) => {
    setNotifAbiertas(false)
    const token = localStorage.getItem('auth-token')
    if (!n.leida && token) {
      marcarNotificacionLeidaRequest(n.id_notificacion, token)
        .then(() => setNotificaciones((prev) => prev.map((notif) => notif.id_notificacion === n.id_notificacion ? { ...notif, leida: true } : notif)))
        .catch(() => {})
    }
    // Navegar según el tipo de notificación
    const tituloLower = (n.titulo || '').toLowerCase()
    if (tituloLower.includes('obra')) {
      handleViewChange('patrimonio')
    } else if (tituloLower.includes('contrase') || tituloLower.includes('usuario') || tituloLower.includes('cuenta')) {
      handleViewChange('usuarios')
    } else {
      handleViewChange('dashboard')
    }
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const getInitials = (nombre, apellido) => {
    if (nombre && apellido) return (nombre[0] + apellido[0]).toUpperCase()
    return 'AD'
  }

  const nombreCompleto = profile ? `${profile.primer_nombre} ${profile.primer_apellido}` : 'Administrador'
  const nombreRol = profile?.rolRel?.nombre_rol || 'Administrador'

  // Cerrar sidebar móvil al cambiar de vista
  const handleViewChange = (view) => {
    onViewChange(view)
    setIsMobileOpen(false)
  }

  // Cerrar sidebar móvil con tecla Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="dashboard-container">

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Botón cerrar (solo móvil) */}
        <button
          className="sidebar-close-btn"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>

        {/* Toggle Button (solo desktop) */}
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        <div className="sidebar-header">
          <div className="sidebar-logo-text">
            <h2>Archivo de Folklore</h2>
            <span className="subtitle">REGIÓN TÁCHIRA</span>
          </div>
          <div className="sidebar-emblem" title="Archivo de Folklore">AF</div>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => handleViewChange('dashboard')}
            className={`nav-item nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            data-label="Dashboard"
          >
            <LayoutDashboard className="nav-icon" size={20} />
            <span>Dashboard</span>
          </button>

          <span className="nav-section-label">Manejo Web</span>
          <button
            onClick={() => handleViewChange('preregistro')}
            className={`nav-item nav-btn ${currentView === 'preregistro' ? 'active' : ''}`}
            data-label="Solicitudes de Registro"
          >
            <FileText className="nav-icon" size={20} />
            <span>Solicitudes de Registro</span>
          </button>
          <button
            onClick={() => handleViewChange('cultores')}
            className={`nav-item nav-btn ${currentView === 'cultores' ? 'active' : ''}`}
            data-label="Directorio de Cultores"
          >
            <Users className="nav-icon" size={20} />
            <span>Directorio de Cultores</span>
          </button>
          <button
            onClick={() => handleViewChange('patrimonio')}
            className={`nav-item nav-btn ${currentView === 'patrimonio' ? 'active' : ''}`}
            data-label="Inventario Patrimonial"
          >
            <Landmark className="nav-icon" size={20} />
            <span>Inventario Patrimonial</span>
          </button>
          <button
            onClick={() => handleViewChange('difusion')}
            className={`nav-item nav-btn ${currentView === 'difusion' ? 'active' : ''}`}
            data-label="Configuración del Portal"
          >
            <Settings className="nav-icon" size={20} />
            <span>Configuración del Portal</span>
          </button>

          <span className="nav-section-label">Manejo Administrativo</span>
          <button
            onClick={() => handleViewChange('usuarios')}
            className={`nav-item nav-btn ${currentView === 'usuarios' ? 'active' : ''}`}
            data-label="Gestión de Usuarios"
          >
            <UserCheck className="nav-icon" size={20} />
            <span>Gestión de Usuarios</span>
          </button>
          <button
            onClick={() => handleViewChange('reportes')}
            className={`nav-item nav-btn ${currentView === 'reportes' ? 'active' : ''}`}
            data-label="Reportes y Catálogo"
          >
            <FileText className="nav-icon" size={20} />
            <span>Reportes y Catálogo</span>
          </button>

          <span className="nav-section-label">Ayuda</span>
          <button
            onClick={() => handleViewChange('manual')}
            className={`nav-item nav-btn ${currentView === 'manual' ? 'active' : ''}`}
            data-label="Manual de Uso"
          >
            <FileText className="nav-icon" size={20} />
            <span>Manual de Uso</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div
            className="profile-badge"
            data-label={`${nombreCompleto} (${nombreRol})`}
            title={nombreCompleto}
          >
            <div className="profile-initials">{getInitials(profile?.primer_nombre, profile?.primer_apellido)}</div>
            <div className="profile-info">
              <span className="profile-name">{nombreCompleto}</span>
              <span className="profile-location">{nombreRol.toUpperCase()}</span>
            </div>
          </div>
          <button
            className="sidebar-changepw-btn"
            onClick={() => setIsProfileModalOpen(true)}
            title="Mi Perfil"
            data-label="Mi Perfil"
          >
            <LockIcon size={16} />
            <span>Mi Perfil</span>
          </button>
          <button
            className="sidebar-logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            data-label="Cerrar sesión"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="topbar">
          {/* Botón hamburguesa (solo móvil) */}
          <button
            className="hamburger-btn"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
            <button className="icon-btn" aria-label="Calendario">
              <Calendar size={18} />
            </button>
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="icon-btn" aria-label="Notificaciones" onClick={toggleNotificaciones}>
                <Bell size={18} />
                {noLeidas > 0 && <span className="notif-dot"></span>}
                {obrasPendientesCount > 0 && (
                  <span className="notif-badge" title={`${obrasPendientesCount} obra(s) pendiente(s) de aprobación`}>
                    {obrasPendientesCount}
                  </span>
                )}
              </button>
              {notifAbiertas && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '320px',
                    maxHeight: '380px', overflowY: 'auto', background: 'var(--card-bg, #fff)',
                    border: '1px solid var(--border-color, #e0e0e0)', borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50,
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color, #eee)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Notificaciones</span>
                    {noLeidas > 0 && (
                      <button onClick={marcarLeidas} style={{ fontSize: '11px', color: 'var(--primary-color, #c53813)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  {notificaciones.length > 0 || obrasPendientesCount > 0 ? (
                    <>
                      {obrasPendientesCount > 0 && (
                        <div
                          onClick={() => { setNotifAbiertas(false); handleViewChange('preregistro') }}
                          style={{ padding: '10px 16px', borderBottom: '1px solid #f1f1f1', cursor: 'pointer', background: 'rgba(197,56,19,0.06)' }}
                        >
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#202124' }}>{obrasPendientesCount} obra(s) pendiente(s) de aprobación</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#5f6368' }}>Haz clic para revisar</p>
                        </div>
                      )}
                      {notificaciones.map((n) => (
                      <div key={n.id_notificacion} onClick={() => handleNotificacionClick(n)} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f1f1', cursor: 'pointer', background: n.leida ? 'transparent' : 'rgba(197,56,19,0.06)' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#202124' }}>{n.titulo}</p>
                        {n.mensaje && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#5f6368' }}>{n.mensaje}</p>}
                      </div>
                    ))}
                    </>
                  ) : (
                    <div style={{ padding: '16px', fontSize: '12px', color: '#807471', textAlign: 'center' }}>Sin notificaciones</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Aviso de contraseña temporal: se mantiene hasta que el usuario la cambie */}
        {profile?.password_temporal && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', margin: '0 24px 16px',
              padding: '12px 16px', background: '#fde8d7', border: '1px solid #e8a561',
              borderRadius: '10px', color: '#7a4a12', fontSize: '13px',
            }}
          >
            <AlertTriangle size={18} />
            <span style={{ flex: 1 }}>Tu cuenta usa una contraseña temporal generada por el sistema. Cámbiala para proteger tu acceso.</span>
            <button
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px', height: 'auto' }}
              onClick={() => setIsProfileModalOpen(true)}
            >
              Cambiar ahora
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="content-body">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      <ChangePasswordModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdated={cargarPerfil}
      />
    </div>
  )
}

export default Layout
