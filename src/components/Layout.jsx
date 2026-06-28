import React, { useState, useEffect } from 'react'
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
  X,
  Lock
} from 'lucide-react'
import './Layout.css'
import adminAvatar from '../assets/admin_avatar.png'
import ChangePasswordModal from './ChangePasswordModal'

const Layout = ({ children, currentView, onViewChange, onLogout }) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
            data-label="Pre-registro"
          >
            <FileText className="nav-icon" size={20} />
            <span>Pre-registro</span>
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
            data-label="Difusión y Galería"
          >
            <ImageIcon className="nav-icon" size={20} />
            <span>Difusión y Galería</span>
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
        </nav>

        <div className="sidebar-footer">
          <div
            className="profile-badge"
            data-label="Administrador (Sede Principal)"
            title="Administrador"
          >
            <div className="profile-initials">AD</div>
            <div className="profile-info">
              <span className="profile-name">Administrador</span>
              <span className="profile-location">SEDE PRINCIPAL</span>
            </div>
          </div>
          <button
            className="sidebar-changepw-btn"
            onClick={() => setIsProfileModalOpen(true)}
            title="Cambiar contraseña"
            data-label="Cambiar contraseña"
          >
            <Lock size={16} />
            <span>Cambiar Contraseña</span>
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
            <button className="icon-btn" aria-label="Notificaciones">
              <Bell size={18} />
              <span className="notif-dot"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-body">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      <ChangePasswordModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  )
}

export default Layout
