import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/pages/Dashboard'
import UsersManagement from './components/pages/UsersManagement'
import CultoresDirectory from './components/pages/CultoresDirectory'
import PreRegistration from './components/pages/PreRegistration'
import InventarioPatrimonial from './components/pages/InventarioPatrimonial'
import DifusionGaleria from './components/pages/DifusionGaleria'
import ReportesCatalogo from './components/pages/ReportesCatalogo'
import Login from './components/pages/Login'
import ForgotPassword from './components/pages/ForgotPassword'
import ResetPassword from './components/pages/ResetPassword'
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

  if (pathname === '/recuperar-password') {
    return <ResetPassword />
  }

  if (pathname === '/olvide-password') {
    return <ForgotPassword onBack={() => { window.location.href = '/' }} />
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} />
  }

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'usuarios' && <UsersManagement />}
      {currentView === 'cultores' && (
        <CultoresDirectory />
      )}
      {currentView === 'preregistro' && (
        <PreRegistration />
      )}
      {currentView === 'patrimonio' && (
        <InventarioPatrimonial />
      )}
      {currentView === 'difusion' && (
        <DifusionGaleria />
      )}
      {currentView === 'reportes' && (
        <ReportesCatalogo />
      )}
    </Layout>
  )
}

export default App
