import React, { useEffect, useState } from 'react'
import {
  Download,
  ChevronDown,
  BookOpen,
  MapPin,
  Users
} from 'lucide-react'
import './Dashboard.css'
import { getDashboardResumenRequest } from '../../services/api'

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

const Dashboard = () => {
  const [resumen, setResumen] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
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
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}
      >
        <div>
          <nav
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '1.2px',
              marginBottom: '10px',
              textTransform: 'uppercase',
              color: '#a39996',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>ARCHIVO</span>
            <span style={{ color: '#d4cfcc' }}>&gt;</span>
            <span style={{ color: '#B4533C' }}>DASHBOARD</span>
          </nav>
          <h1
            className="dash-title"
            style={{
              fontWeight: 800,
              color: '#5D4037',
              letterSpacing: '-0.7px',
              lineHeight: 1.25,
              margin: 0
            }}
          >
            Resumen Estadístico Consolidado
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: '12px',
              backgroundColor: '#fff',
              color: '#5D4037',
              boxShadow: '0 2px 8px rgba(93,64,55,0.06)',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={16} />
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      {isLoading && <p>Cargando...</p>}
      {!isLoading && error && <p>{error}</p>}

      {!isLoading && !error && resumen && (
        <>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}
            aria-label="Estadísticas rápidas"
          >
            <div
              className="stat-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#B4533C',
                    color: '#fff',
                    boxShadow: '0 8px 16px -6px rgba(180,83,60,0.30)'
                  }}
                >
                  <Users size={22} />
                </div>
                <span
                  style={{
                    fontSize: '13px',
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
                  fontSize: '48px',
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
                gap: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#A87F32',
                    color: '#fff',
                    boxShadow: '0 8px 16px -6px rgba(168,127,50,0.30)'
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <span
                  style={{
                    fontSize: '13px',
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
                  fontSize: '48px',
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
                gap: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#5D4037',
                    color: '#fff',
                    boxShadow: '0 8px 16px -6px rgba(93,64,55,0.30)'
                  }}
                >
                  <MapPin size={22} />
                </div>
                <span
                  style={{
                    fontSize: '13px',
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
                  fontSize: '48px',
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
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '28px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div
                className="card-panel"
                style={{
                  marginBottom: '28px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '17px',
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
                      gap: 'clamp(16px, 4vw, 48px)',
                      height: 240,
                      padding: '10px 0',
                      flexWrap: 'wrap'
                    }}
                  >
                    {resumen.distribucionCategorias.length === 0 && (
                      <p>Aún no hay obras catalogadas.</p>
                    )}
                    {resumen.distribucionCategorias.map((categoria, index) => {
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
                    marginBottom: '20px'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '17px',
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
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#B4533C',
                      textDecoration: 'none'
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
              {resumen.piezaDestacada && (
                <div
                  className="card-panel"
                  style={{
                    overflow: 'hidden'
                  }}
                >
                  {resumen.piezaDestacada.imagenUrl && (
                    <div
                      className="featured-img-wrapper"
                      style={{ height: 160, width: '100%' }}
                    >
                      <img
                        src={resumen.piezaDestacada.imagenUrl}
                        alt={resumen.piezaDestacada.titulo}
                        className="featured-img"
                      />
                    </div>
                  )}
                  <div style={{ padding: '24px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#B4533C',
                        letterSpacing: '1px',
                        display: 'block',
                        marginBottom: '6px'
                      }}
                    >
                      PIEZA DESTACADA
                    </span>
                    <h4
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#5D4037',
                        margin: 0,
                        letterSpacing: '-0.3px'
                      }}
                    >
                      {resumen.piezaDestacada.titulo}
                    </h4>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Dashboard
