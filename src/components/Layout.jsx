import React, { useState } from 'react'
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
  LogOut
} from 'lucide-react'
import './Layout.css'
import adminAvatar from '../assets/admin_avatar.png'

const Layout = ({ children, currentView, onViewChange, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Toggle Button */}
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
            onClick={() => onViewChange('dashboard')}
            className={`nav-item nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            data-label="Dashboard"
          >
            <LayoutDashboard className="nav-icon" size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onViewChange('usuarios')}
            className={`nav-item nav-btn ${currentView === 'usuarios' ? 'active' : ''}`}
            data-label="Gestión de Usuarios"
          >
            <UserCheck className="nav-icon" size={20} />
            <span>Gestión de Usuarios</span>
          </button>
          <button
            onClick={() => onViewChange('cultores')}
            className={`nav-item nav-btn ${currentView === 'cultores' ? 'active' : ''}`}
            data-label="Directorio de Cultores"
          >
            <Users className="nav-icon" size={20} />
            <span>Directorio de Cultores</span>
          </button>
          <button
            onClick={() => onViewChange('preregistro')}
            className={`nav-item nav-btn ${currentView === 'preregistro' ? 'active' : ''}`}
            data-label="Pre-registro"
          >
            <FileText className="nav-icon" size={20} />
            <span>Pre-registro</span>
          </button>
          <button
            onClick={() => onViewChange('patrimonio')}
            className={`nav-item nav-btn ${currentView === 'patrimonio' ? 'active' : ''}`}
            data-label="Inventario Patrimonial"
          >
            <Landmark className="nav-icon" size={20} />
            <span>Inventario Patrimonial</span>
          </button>
          <button
            onClick={() => onViewChange('difusion')}
            className={`nav-item nav-btn ${currentView === 'difusion' ? 'active' : ''}`}
            data-label="Difusión y Galería"
          >
            <ImageIcon className="nav-icon" size={20} />
            <span>Difusión y Galería</span>
          </button>
          <button
            onClick={() => onViewChange('reportes')}
            className={`nav-item nav-btn ${currentView === 'reportes' ? 'active' : ''}`}
            data-label="Reportes y Catálogo"
          >
            <FileText className="nav-icon" size={20} />
            <span>Reportes y Catálogo</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-badge" data-label="Administrador (Sede Principal)">
            <div className="profile-initials">AD</div>
            <div className="profile-info">
              <span className="profile-name">Administrador</span>
              <span className="profile-location">SEDE PRINCIPAL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
            <button className="icon-btn" aria-label="Calendario">
              <Calendar size={18} />
            </button>
            <button className="icon-btn" aria-label="Notificaciones">
              <Bell size={18} />
              <span className="notif-dot"></span>
            </button>
            <div className="admin-profile">
              <span className="admin-role">Admin</span>
              <img src={adminAvatar} alt="Admin avatar" className="avatar-img" />
            </div>
            <button 
              className="icon-btn" 
              aria-label="Cerrar sesión" 
              onClick={onLogout}
              title="Cerrar sesión"
              style={{ color: '#bf360c', borderColor: 'rgba(191, 54, 12, 0.15)', backgroundColor: 'var(--orange-bg-light)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
