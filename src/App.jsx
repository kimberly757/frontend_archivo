import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/pages/Dashboard'
import UsersManagement from './components/pages/UsersManagement'
import CultoresDirectory from './components/pages/CultoresDirectory'
import PreRegistration from './components/pages/PreRegistration'
import InventarioPatrimonial from './components/pages/InventarioPatrimonial'
import ConfiguracionPortal from './components/pages/ConfiguracionPortal'
import ReportesCatalogo from './components/pages/ReportesCatalogo'
import ManualAdmin from './components/pages/ManualAdmin'
import Login from './components/pages/Login'
import ForgotPassword from './components/pages/ForgotPassword'
import ResetPassword from './components/pages/ResetPassword'
import { ToastProvider } from './context/ToastContext'
import Toast from './components/Toast'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('user-authenticated') === 'true'
  })
  const [currentView, setCurrentView] = useState('dashboard')

  const handleLogin = (data) => {
    localStorage.setItem('user-authenticated', 'true')
    if (data?.token) {
      localStorage.setItem('auth-token', data.token)
    }
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('user-authenticated')
    localStorage.removeItem('auth-token')
    setIsAuthenticated(false)
  }

  // Sin router: "rutas" resueltas manualmente por pathname, mismo enfoque que ya
  // usaba este archivo para leer ?token= en la URL. Cada navegación entre estas
  // vistas es una recarga completa (<a href>, window.location.href), no SPA.
  const pathname = window.location.pathname

  return (
    <ToastProvider>
      {pathname === '/recuperar-password' ? (
        <ResetPassword />
      ) : pathname === '/olvide-password' ? (
        <ForgotPassword onBack={() => { window.location.href = '/' }} />
      ) : !isAuthenticated ? (
        <Login onLoginSuccess={handleLogin} />
      ) : (
        <Layout currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout}>
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
          {currentView === 'usuarios' && <UsersManagement />}
          {currentView === 'cultores' && <CultoresDirectory />}
          {currentView === 'preregistro' && <PreRegistration />}
          {currentView === 'patrimonio' && <InventarioPatrimonial />}
          {currentView === 'difusion' && <ConfiguracionPortal />}
          {currentView === 'reportes' && <ReportesCatalogo />}
          {currentView === 'manual' && <ManualAdmin />}
        </Layout>
      )}
      <Toast />
    </ToastProvider>
  )
}

export default App
