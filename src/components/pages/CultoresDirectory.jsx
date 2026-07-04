import { useState, useEffect } from 'react'
import {
  Search,
  X,
  User,
  FolderOpen,
  Plus,
  Image as ImageIcon
} from 'lucide-react'
import './CultoresDirectory.css'
import { getCultoresAprobadosRequest, toggleActivoCultorRequest, getMunicipiosRequest, getParroquiasByMunicipioRequest, registrarFeDeVidaRequest } from '../../services/api'
import ManualCultorForm from '../ManualCultorForm'
import EditCultorForm from '../EditCultorForm'

// Columnas de imagen reales en el modelo Cultores. Hoy siempre vendrán vacías
// (no hay Multer/upload conectado todavía), por eso cada una resuelve a un
// placeholder "Sin imagen" hasta que se conecte la subida de archivos.
const CAMPOS_IMAGEN = [
  { campo: 'foto_perfil', etiqueta: 'Foto de Perfil' },
  { campo: 'foto_certificacion', etiqueta: 'Certificación Fe de Vida' },
]

const CultoresDirectory = () => {
  // Cultores reales (estatus = 'aprobado'), traídos del backend
  const [cultores, setCultores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Filtros: texto + píldora de certificación + ubicación (municipio/parroquia encadenados)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroCertificacion, setFiltroCertificacion] = useState('todos')
  const [municipios, setMunicipios] = useState([])
  const [parroquias, setParroquias] = useState([])
  const [filtroMunicipio, setFiltroMunicipio] = useState('')
  const [filtroParroquia, setFiltroParroquia] = useState('')

  // Modal de expediente
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [cultorSeleccionado, setCultorSeleccionado] = useState(null)

  // Modal de ingreso manual (mismo formulario de la web pública, adaptado)
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)

  // Modal de edición de expediente
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [cultorAEditar, setCultorAEditar] = useState(null)

  // Si el token venció o es inválido, limpia la sesión guardada y recarga: App.jsx
  // detecta que ya no hay 'user-authenticated' y vuelve a mostrar el Login.
  const forzarRelogin = () => {
    localStorage.removeItem('user-authenticated')
    localStorage.removeItem('auth-token')
    window.location.reload()
  }

  const cargarCultores = async () => {
    setIsLoading(true)
    setLoadError('')

    const token = localStorage.getItem('auth-token')
    if (!token) {
      setLoadError('No hay una sesión activa. Inicia sesión nuevamente.')
      setIsLoading(false)
      return
    }

    try {
      const data = await getCultoresAprobadosRequest(token)
      setCultores(data)
    } catch (error) {
      if (error.isAuthError) {
        setLoadError(error.message)
        forzarRelogin()
        return
      }
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarCultores()
    getMunicipiosRequest().then(setMunicipios).catch(() => setMunicipios([]))
  }, [])

  // Encadenado: al cambiar el municipio, se recargan sus parroquias y se limpia
  // la parroquia seleccionada previamente (podría no pertenecer al nuevo municipio).
  useEffect(() => {
    setFiltroParroquia('')
    if (!filtroMunicipio) {
      setParroquias([])
      return
    }
    getParroquiasByMunicipioRequest(filtroMunicipio).then(setParroquias).catch(() => setParroquias([]))
  }, [filtroMunicipio])

  const nombreCompleto = (cultor) =>
    [cultor.primer_nombre, cultor.segundo_nombre, cultor.primer_apellido, cultor.segundo_apellido]
      .filter(Boolean)
      .join(' ')

  const getInitials = (cultor) => {
    const nombre = cultor.primer_nombre || ''
    const apellido = cultor.primer_apellido || ''
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '--'
  }

  // Registro de fe de vida más reciente de un cultor, o null si nunca se le ha
  // registrado uno. Se ordena por id_fe_vida (autoincremental) y no por fecha_control:
  // dos registros creados el mismo día tienen la misma fecha, así que ordenar solo por
  // fecha dejaba "atascado" el primero del día en vez del último elegido.
  const feDeVidaActual = (cultor) => {
    const registros = cultor.fesDeVida || []
    if (registros.length === 0) return null
    return [...registros].sort((a, b) => (b.id_fe_vida || 0) - (a.id_fe_vida || 0))[0]
  }

  const handleCambiarFeDeVida = async (cultor, nuevoEstatus) => {
    if (!nuevoEstatus) return
    const token = localStorage.getItem('auth-token')
    try {
      const nuevoRegistro = await registrarFeDeVidaRequest(cultor.id_cultor, nuevoEstatus, token)
      setCultores((prev) =>
        prev.map((c) =>
          c.id_cultor === cultor.id_cultor
            ? { ...c, fesDeVida: [...(c.fesDeVida || []), nuevoRegistro] }
            : c
        )
      )
    } catch (err) {
      alert(err.message)
    }
  }

  // Filtrado combinado: texto (nombre/cédula) Y píldora de certificación Y ubicación
  const cultoresFiltrados = cultores.filter((cultor) => {
    const term = searchQuery.toLowerCase()
    const coincideTexto =
      nombreCompleto(cultor).toLowerCase().includes(term) ||
      (cultor.cedula || '').toLowerCase().includes(term)

    const coincideCertificacion =
      filtroCertificacion === 'todos' ||
      (filtroCertificacion === 'certificados' && cultor.esta_certificado) ||
      (filtroCertificacion === 'no_certificados' && !cultor.esta_certificado)

    const coincideMunicipio =
      !filtroMunicipio || String(cultor.parroquia?.municipio?.id_municipio) === String(filtroMunicipio)

    const coincideParroquia =
      !filtroParroquia || String(cultor.id_parroquia) === String(filtroParroquia)

    return coincideTexto && coincideCertificacion && coincideMunicipio && coincideParroquia
  })

  return (
    <div className="cultores-module-container">
      {/* 1. Cabecera de la Sección */}
      <header className="page-header">
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO</span>
            <span className="separator">&gt;</span>
            <span className="current">DIRECTORIO DE CULTORES</span>
          </nav>
          <h1>Directorio de Cultores</h1>
          <p className="cultor-subinfo text-light" style={{ fontSize: '14px', marginTop: '4px' }}>
            Cultores aprobados e incorporados al patrimonio vivo del archivo regional.
          </p>
        </div>

        <button className="btn-terracota" onClick={() => setIsManualFormOpen(true)}>
          <Plus size={16} />
          <span>Ingreso Manual</span>
        </button>
      </header>

      {/* 2. Barra unificada: píldoras de filtro (izquierda) + búsqueda (derecha) */}
      <section className="filter-bar-card">
        <div className="category-pills">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'certificados', label: 'Certificados' },
            { id: 'no_certificados', label: 'No Certificados' },
          ].map((opcion) => (
            <button
              key={opcion.id}
              className={`category-pill ${filtroCertificacion === opcion.id ? 'active' : ''}`}
              onClick={() => setFiltroCertificacion(opcion.id)}
            >
              {opcion.label}
            </button>
          ))}
        </div>

        <div className="selectors-wrapper">
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="filter-dropdown-select"
            aria-label="Filtrar por municipio"
          >
            <option value="">Todos los municipios</option>
            {municipios.map((m) => (
              <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>
            ))}
          </select>
          <select
            value={filtroParroquia}
            onChange={(e) => setFiltroParroquia(e.target.value)}
            className="filter-dropdown-select"
            disabled={!filtroMunicipio}
            aria-label="Filtrar por parroquia"
          >
            <option value="">Todas las parroquias</option>
            {parroquias.map((p) => (
              <option key={p.id_parroquia} value={p.id_parroquia}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-icon-btn"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {/* 3. Tabla Interactiva (Data Grid) */}
      <div className="card cultores-list-card">
        <div className="table-responsive">
          <table className="cultores-table">
            <thead>
              <tr>
                <th>CULTOR</th>
                <th>CÉDULA</th>
                <th>CORREO DE CONTACTO</th>
                <th>TELÉFONO</th>
                <th>ESTADO</th>
                <th>FE DE VIDA</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-grid-state">
                      <p className="empty-grid-title">Cargando directorio...</p>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-grid-state">
                      <p className="empty-grid-title">No se pudo cargar el directorio</p>
                      <p className="empty-grid-desc">{loadError}</p>
                    </div>
                  </td>
                </tr>
              ) : cultoresFiltrados.length > 0 ? (
                cultoresFiltrados.map((cultor) => (
                  <tr key={cultor.id_cultor}>
                    <td>
                      <div
                        className="cultor-profile-cell clickable"
                        onClick={() => {
                          setCultorSeleccionado(cultor)
                          setIsViewModalOpen(true)
                        }}
                      >
                        <div className="cultor-avatar-badge">
                          {getInitials(cultor)}
                        </div>
                        <span className="cultor-display-name">
                          {nombreCompleto(cultor)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cultor-subinfo">{cultor.cedula || '—'}</span>
                    </td>
                    <td>
                      <span className="cultor-subinfo">{cultor.correo_contacto || '—'}</span>
                    </td>
                    <td>
                      <span className="cultor-subinfo">{cultor.telefono_contacto || '—'}</span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${cultor.usuario?.activo ? 'active' : 'inactive'}`}
                        onClick={async () => {
                          const token = localStorage.getItem('auth-token')
                          try {
                            const { activo } = await toggleActivoCultorRequest(cultor.id_cultor, token)
                            setCultores((prev) =>
                              prev.map((c) =>
                                c.id_cultor === cultor.id_cultor
                                  ? { ...c, usuario: { ...c.usuario, activo } }
                                  : c
                              )
                            )
                          } catch (err) {
                            alert(err.message)
                          }
                        }}
                        title={cultor.usuario?.activo ? 'Desactivar cultor' : 'Activar cultor'}
                      >
                        <span className="status-dot" />
                        <span>{cultor.usuario?.activo ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>
                    <td>
                      {(() => {
                        const registro = feDeVidaActual(cultor)
                        const estatus = registro?.estatus_confirmado || ''
                        const etiquetas = { activo: 'Miembro Activo', honorario: 'Miembro Honorario' }
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span
                              className={`v-badge ${estatus === 'activo' ? 'aprobado' : ''}`}
                              style={!estatus ? { color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border-color)' } : estatus === 'honorario' ? { background: '#f4e3b2', color: '#7a5c00', border: 'none' } : undefined}
                            >
                              {etiquetas[estatus] || 'Sin Registrar'}
                            </span>
                            {/* Select controlado por el estatus actual: siempre editable, incluso
                                después de haber elegido una opción (antes quedaba fijo en "Registrar..."
                                y parecía bloqueado para volver a cambiarlo). */}
                            <select
                              value={estatus}
                              onChange={(e) => handleCambiarFeDeVida(cultor, e.target.value)}
                              className="filter-dropdown-select"
                              style={{ fontSize: '11px', padding: '4px 6px' }}
                              aria-label="Modificar fe de vida"
                            >
                              {!estatus && <option value="" disabled>Registrar...</option>}
                              <option value="activo">Miembro Activo</option>
                              <option value="honorario">Miembro Honorario</option>
                            </select>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="text-right">
                      <div className="grid-actions-row">
                        <button
                          className="grid-action-btn"
                          title="Ver Expediente"
                          onClick={() => {
                            setCultorSeleccionado(cultor)
                            setIsViewModalOpen(true)
                          }}
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          className="grid-action-btn"
                          title="Editar Expediente"
                          onClick={() => {
                            setCultorAEditar(cultor)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-grid-state">
                      <User size={40} />
                      <p className="empty-grid-title">No se encontraron cultores</p>
                      <p className="empty-grid-desc">Intenta cambiar el término de búsqueda o el filtro.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Ver Expediente */}
      {isViewModalOpen && cultorSeleccionado && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card dossier-modal">
            <div className="modal-box-header">
              <h2>Expediente del Cultor</h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false)
                  setCultorSeleccionado(null)
                }}
                className="close-x-btn"
                aria-label="Cerrar expediente"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-box-body">
              <div className="dossier-profile-header">
                <div className="dossier-avatar">
                  {getInitials(cultorSeleccionado)}
                </div>
                <div className="dossier-profile-meta">
                  <h3>{nombreCompleto(cultorSeleccionado)}</h3>
                  <span className="dossier-sub">{cultorSeleccionado.cedula || 'Sin cédula registrada'}</span>
                </div>
                <div className="dossier-v-status">
                  <span className="v-badge aprobado">APROBADO</span>
                </div>
              </div>

              <div className="dossier-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Nombre Completo:</span>
                  <span className="dossier-value">{nombreCompleto(cultorSeleccionado)}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Cédula de Identidad:</span>
                  <span className="dossier-value">{cultorSeleccionado.cedula || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Fecha de Nacimiento:</span>
                  <span className="dossier-value">
                    {cultorSeleccionado.fecha_nacimiento ? new Date(cultorSeleccionado.fecha_nacimiento).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Teléfono de Contacto:</span>
                  <span className="dossier-value">{cultorSeleccionado.telefono_contacto || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Correo de Contacto:</span>
                  <span className="dossier-value">{cultorSeleccionado.correo_contacto || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Dirección de Residencia:</span>
                  <span className="dossier-value">{cultorSeleccionado.direccion_residencia || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Género:</span>
                  <span className="dossier-value">{cultorSeleccionado.genero || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Parroquia:</span>
                  <span className="dossier-value">{cultorSeleccionado.parroquia?.nombre || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Municipio:</span>
                  <span className="dossier-value">{cultorSeleccionado.parroquia?.municipio?.nombre || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Estatus de Vida:</span>
                  <span className="dossier-value">{cultorSeleccionado.estatus_vida || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Fecha de Registro:</span>
                  <span className="dossier-value">
                    {cultorSeleccionado.fecha_registro ? new Date(cultorSeleccionado.fecha_registro).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Fe de Vida:</span>
                  <span className="dossier-value">
                    {(() => {
                      const registro = feDeVidaActual(cultorSeleccionado)
                      const etiquetas = { activo: 'Miembro Activo', honorario: 'Miembro Honorario' }
                      return etiquetas[registro?.estatus_confirmado] || 'Sin Registrar'
                    })()}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Certificación:</span>
                  <span className="dossier-value">
                    {cultorSeleccionado.esta_certificado ? (
                      <span style={{ color: 'var(--green-badge)', fontWeight: 700 }}>Artesano Certificado</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>No Certificado</span>
                    )}
                  </span>
                </div>
              </div>

              {cultorSeleccionado.resumen_curricular && (
                <div className="dossier-field" style={{ marginTop: '16px' }}>
                  <span className="dossier-label">Resumen Curricular:</span>
                  <p className="dossier-value">{cultorSeleccionado.resumen_curricular}</p>
                </div>
              )}

              {cultorSeleccionado.trayectoria_documentada && (
                <div className="dossier-field" style={{ marginTop: '16px' }}>
                  <span className="dossier-label">Trayectoria Documentada:</span>
                  <p className="dossier-value">{cultorSeleccionado.trayectoria_documentada}</p>
                </div>
              )}

              {/* Galería: foto_perfil / foto_certificacion son las únicas columnas de
                  imagen que existen hoy en el modelo. Sin Multer conectado, casi siempre
                  estarán vacías — por eso cada miniatura cae al placeholder "Sin imagen". */}
              <div className="dossier-field" style={{ marginTop: '16px' }}>
                <span className="dossier-label">Documentos e Imágenes:</span>
                <div className="dossier-image-gallery">
                  {CAMPOS_IMAGEN.map(({ campo, etiqueta }) => (
                    <div key={campo} className="dossier-image-thumb">
                      {cultorSeleccionado[campo] ? (
                        <img src={cultorSeleccionado[campo]} alt={etiqueta} />
                      ) : (
                        <div className="dossier-image-placeholder">
                          <ImageIcon size={20} />
                          <span style={{ marginTop: '4px' }}>Sin imagen</span>
                        </div>
                      )}
                      <span className="dossier-image-label">{etiqueta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="administrative-review-panel">
                <div className="review-banner-alert success">
                  <div className="review-banner-text">
                    <strong>Expediente Verificado ✓</strong>
                    <p>Este cultor cumple con las normativas patrimoniales y se encuentra activo en el registro oficial del patrimonio vivo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-box-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setCultorSeleccionado(null)
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Ingreso Manual: mismo formulario de la web pública, adaptado para el admin */}
      <ManualCultorForm
        isOpen={isManualFormOpen}
        onClose={() => setIsManualFormOpen(false)}
      />

      {/* 6. Editar Expediente */}
      <EditCultorForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setCultorAEditar(null)
        }}
        cultor={cultorAEditar}
        onSuccess={cargarCultores}
      />
    </div>
  )
}

export default CultoresDirectory
