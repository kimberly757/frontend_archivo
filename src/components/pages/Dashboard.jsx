import React, { useEffect, useState, useCallback } from 'react'
import PageHeader from '../PageHeader'
import {
  Download,
  ChevronDown,
  BookOpen,
  MapPin,
  Users,
  ClipboardList
} from 'lucide-react'
import './Dashboard.css'
import { getDashboardResumenRequest, getPendientesRequest } from '../../services/api'

const AVATAR_BG_CLASSES = ['bg-dark', 'bg-orange']

const CHART_COLORS = ['#B4533C', '#A87F32', '#5D4037', '#707C55', '#a8493f', '#c9a227']

function obtenerIniciales(nombreCompleto) {
  if (!nombreCompleto) return '--'
  const partes = nombreCompleto.trim().split(/\s+/)
  const iniciales = partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() || '')
  return iniciales.join('') || '--'
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return 'Sin fecha'
  const fecha = new Date(fechaISO)
  const ahora = new Date()
  const hora = fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })

  const esMismoDia = fecha.toDateString() === ahora.toDateString()
  if (esMismoDia) return `Hoy, ${hora}`

  const ayer = new Date(ahora)
  ayer.setDate(ahora.getDate() - 1)
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`

  return `${fecha.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })}, ${hora}`
}

function SkeletonAccionItem() {
  return (
    <div className="accion-item skeleton">
      <div className="accion-left">
        <div className="skeleton-circle" />
        <div className="skeleton-line" />
      </div>
      <div className="skeleton-btn" />
    </div>
  )
}

const Dashboard = ({ onNavigate }) => {
  const [resumen, setResumen] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendientes, setPendientes] = useState(null)
  const [pendientesLoading, setPendientesLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('auth-token')
      const data = await getDashboardResumenRequest(token)
      setResumen(data)
    } catch (err) {
      console.error('Error al cargar el resumen del dashboard:', err)
      setError(err.message || 'No se pudo cargar el resumen del dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPendientes = useCallback(async () => {
    setPendientesLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const data = await getPendientesRequest(token)
      setPendientes(data)
    } catch (err) {
      console.error('Error al cargar pendientes:', err)
    } finally {
      setPendientesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchPendientes()
  }, [fetchData, fetchPendientes])

  // Exporta el resumen estadístico ya cargado en pantalla a un archivo CSV descargable.
  const handleExportarReporte = () => {
    if (!resumen) return

    const filas = [
      ['Reporte del Archivo Regional de Folklore'],
      ['Fecha de generación', new Date().toLocaleDateString('es-VE')],
      [],
      ['Estadística', 'Valor'],
      ['Cultores registrados', resumen.cultores.total],
      ['Obras catalogadas', resumen.obras.total],
      ['Municipios con cobertura', `${resumen.territorio.municipiosCubiertos}/${resumen.territorio.totalMunicipios}`],
      [],
      ['Distribución por Disciplina Artística'],
      ['Categoría', 'Cantidad', 'Porcentaje'],
      ...resumen.distribucionCategorias.map((c) => [c.nombre, c.cantidad, `${c.porcentaje}%`]),
    ]

    const csv = filas
      .map((fila) => fila.map((celda) => `"${String(celda ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `reporte-archivo-folklore-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dashboard-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO' },
          { label: 'PANEL DE CONTROL', active: true },
        ]}
        title="Resumen Estadístico Consolidado"
        actionButton={
          <button className="ph-action-btn" onClick={handleExportarReporte} disabled={!resumen}>
            <Download size={16} />
            <span>Exportar Reporte</span>
          </button>
        }
      />

      {isLoading && <p>Cargando...</p>}
      {!isLoading && error && <p>{error}</p>}

      {!isLoading && !error && resumen && (
        <>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}
            aria-label="Estadísticas rápidas"
          >
            <div
              className="stat-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#B4533C',
                    color: '#fff',
                    boxShadow: '0 8px 16px -6px rgba(180,83,60,0.30)'
                  }}
                >
                  <Users size={18} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#5D4037',
                    letterSpacing: '0.3px',
                    lineHeight: 1.3
                  }}
                >
                  CULTORES REGISTRADOS
                </span>
              </div>
              <span
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#5D4037',
                  letterSpacing: '-1.5px',
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {resumen.cultores.total.toLocaleString('es-VE')}
              </span>
            </div>

            <div
              className="stat-card gold"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#A87F32',
                    color: '#fff',
                    boxShadow: '0 8px 16px -6px rgba(168,127,50,0.30)'
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#5D4037',
                    letterSpacing: '0.3px',
                    lineHeight: 1.3
                  }}
                >
                  OBRAS CATALOGADAS
                </span>
              </div>
              <span
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#5D4037',
                  letterSpacing: '-1.5px',
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {resumen.obras.total.toLocaleString('es-VE')}
              </span>
            </div>

            <div
              className="stat-card clay"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#5D4037',
                    color: '#fff',
                    boxShadow: '0 8px 16px -6px rgba(93,64,55,0.30)'
                  }}
                >
                  <MapPin size={18} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#5D4037',
                    letterSpacing: '0.3px',
                    lineHeight: 1.3
                  }}
                >
                  MUNICIPIOS CON COBERTURA
                </span>
              </div>
              <span
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#5D4037',
                  letterSpacing: '-1.5px',
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {resumen.territorio.municipiosCubiertos}/{resumen.territorio.totalMunicipios}
              </span>
            </div>
          </section>

          <div
            className="dashboard-grid-2col"
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div
                className="card-panel"
                style={{
                  marginBottom: '1.5rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#5D4037',
                      margin: 0,
                      letterSpacing: '-0.3px'
                    }}
                  >
                    Distribución por Disciplina Artística
                  </h3>
                  <button
                    style={{
                      backgroundColor: '#f5f4f0',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#5D4037',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <span>Este Año</span>
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        gap: 'clamp(12px, 3vw, 36px)',
                        height: 180,
                        padding: '8px 0',
                        flexWrap: 'wrap'
                      }}
                    >
                    {resumen.distribucionCategorias.length === 0 && (
                      <p>Aún no hay obras catalogadas.</p>
                    )}
                    {resumen.distribucionCategorias.filter(c => c.cantidad > 0).map((categoria, index) => {
                      const color = CHART_COLORS[index % CHART_COLORS.length]
                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: '0 1 90px',
                            maxWidth: '110px',
                            height: '100%'
                          }}
                          key={categoria.nombre}
                        >
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 900,
                              marginBottom: '8px',
                              letterSpacing: '-0.3px',
                              color
                            }}
                          >
                            {categoria.cantidad}
                          </span>
                          <div
                            className="bar-track"
                            style={{
                              width: 76,
                              borderRadius: 16,
                              boxShadow: 'inset 0 2px 4px rgba(40,27,24,0.05)'
                            }}
                          >
                            <div
                              className="bar-fill"
                              style={{
                                height: `${Math.max(categoria.porcentaje, categoria.cantidad > 0 ? 6 : 2)}%`,
                                backgroundColor: color,
                                borderRadius: 16
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#807471',
                              marginTop: '12px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {categoria.nombre.toUpperCase()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="card-panel">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#5D4037',
                      margin: 0,
                      letterSpacing: '-0.3px'
                    }}
                  >
                    Recientes Incorporaciones
                  </h3>
                  <a
                    href="#catalogo"
                    onClick={(e) => { e.preventDefault(); onNavigate?.('reportes'); }}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#B4533C',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Ver catálogo completo
                  </a>
                </div>
                <div>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                      textAlign: 'left'
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#807471',
                            letterSpacing: '1px',
                            padding: '14px 8px',
                            borderBottom: '1.5px solid #ece9e4',
                            textTransform: 'uppercase'
                          }}
                        >
                          CULTOR / OBRA
                        </th>
                        <th
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#807471',
                            letterSpacing: '1px',
                            padding: '14px 8px',
                            borderBottom: '1.5px solid #ece9e4',
                            textTransform: 'uppercase'
                          }}
                        >
                          REGIÓN
                        </th>
                        <th
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#807471',
                            letterSpacing: '1px',
                            padding: '14px 8px',
                            borderBottom: '1.5px solid #ece9e4',
                            textTransform: 'uppercase'
                          }}
                        >
                          FECHA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.recientes.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              padding: '16px 8px',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#5D4037',
                              borderBottom: '1px solid #f3f1ee'
                            }}
                          >
                            Aún no hay incorporaciones registradas.
                          </td>
                        </tr>
                      )}
                      {resumen.recientes.map((item, index) => (
                        <tr
                          key={item.id_obra}
                          className="table-row"
                        >
                          <td
                            style={{
                              padding: '16px 8px',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#5D4037',
                              borderBottom: '1px solid #f3f1ee'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                              }}
                            >
                              <div
                                className={`cell-initials ${AVATAR_BG_CLASSES[index % AVATAR_BG_CLASSES.length]}`}
                              >
                                {obtenerIniciales(item.cultorNombre)}
                              </div>
                              <span>
                                {item.cultorNombre ? `${item.cultorNombre} - "${item.titulo}"` : item.titulo}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '16px 8px',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#5D4037',
                              borderBottom: '1px solid #f3f1ee'
                            }}
                          >
                            {item.region || 'Sin región'}
                          </td>
                          <td
                            style={{
                              padding: '16px 8px',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#807471',
                              borderBottom: '1px solid #f3f1ee'
                            }}
                          >
                            {formatearFecha(item.fecha)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div className="card-panel acciones-card">
                <div className="acciones-header">
                  <ClipboardList size={16} />
                  <span>Acciones Requeridas</span>
                </div>
                <div className="acciones-list">
                  {pendientesLoading ? (
                    <>
                      <SkeletonAccionItem />
                      <SkeletonAccionItem />
                    </>
                  ) : (
                    <>
                      <div className="accion-item">
                        <div className="accion-left">
                          <span className={`accion-number ${(pendientes?.cultoresPendientes ?? 0) > 0 ? 'has-items' : ''}`}>
                            {pendientes?.cultoresPendientes ?? 0}
                          </span>
                          <span className="accion-desc">Solicitudes de cultores por verificar</span>
                        </div>
                        <button className="accion-btn" onClick={() => onNavigate?.('preregistro')}>
                          Revisar
                        </button>
                      </div>
                      <div className="accion-item">
                        <div className="accion-left">
                          <span className={`accion-number ${(pendientes?.obrasPendientes ?? 0) > 0 ? 'has-items' : ''}`}>
                            {pendientes?.obrasPendientes ?? 0}
                          </span>
                          <span className="accion-desc">Obras pendientes de catalogación</span>
                        </div>
                        <button className="accion-btn" onClick={() => { sessionStorage.setItem('prereg-tab', 'obras'); onNavigate?.('preregistro') }}>
                          Revisar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
