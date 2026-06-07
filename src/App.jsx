import React, { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/pages/Dashboard'
import UsersManagement from './components/pages/UsersManagement'
import CultoresDirectory from './components/pages/CultoresDirectory'
import PreRegistration from './components/pages/PreRegistration'
import InventarioPatrimonial from './components/pages/InventarioPatrimonial'
import DifusionGaleria from './components/pages/DifusionGaleria'
import ReportesCatalogo from './components/pages/ReportesCatalogo'
import Login from './components/pages/Login'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('user-authenticated') === 'true'
  })
  const [currentView, setCurrentView] = useState('dashboard')

  // Lifted state of cultores
  const [cultores, setCultores] = useState([
    {
      id: 1,
      name: 'Juan R. Castañeda',
      cedula: 'V-7.481.902',
      technique: 'Talla en Madera',
      municipio: 'San Cristóbal',
      status: 'ACTIVO',
      supports: { cedula: true, resume: true, certification: false },
      obras: 18,
      verificationStatus: 'aprobado'
    },
    {
      id: 2,
      name: 'María Sosa',
      cedula: 'V-12.902.501',
      technique: 'Cerámica Tradicional',
      municipio: 'Lobatera',
      status: 'ACTIVO',
      supports: { cedula: true, resume: false, certification: true },
      obras: 24,
      verificationStatus: 'aprobado'
    },
    {
      id: 3,
      name: 'Eleazar Rojas',
      cedula: 'V-6.281.340',
      technique: 'Tejeduría',
      municipio: 'Capacho',
      status: 'RETIRADO',
      supports: { cedula: true, resume: true, certification: false },
      obras: 12,
      verificationStatus: 'pendiente'
    },
    {
      id: 4,
      name: 'Isabel de Rivera',
      cedula: 'V-4.102.589',
      technique: 'Cestería',
      municipio: 'San Cristóbal',
      status: 'FALLECIDO',
      supports: { cedula: true, resume: true, certification: true },
      obras: 32,
      verificationStatus: 'aprobado'
    }
  ])

  const handleLogin = () => {
    localStorage.setItem('user-authenticated', 'true')
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('user-authenticated')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} />
  }

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'usuarios' && <UsersManagement />}
      {currentView === 'cultores' && (
        <CultoresDirectory cultores={cultores} setCultores={setCultores} />
      )}
      {currentView === 'preregistro' && (
        <PreRegistration cultores={cultores} setCultores={setCultores} />
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
