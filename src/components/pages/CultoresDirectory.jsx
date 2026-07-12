import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'
import {
  Search,
  X,
  User,
  FolderOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react'
import './CultoresDirectory.css'
import { getCultoresAprobadosRequest, toggleActivoCultorRequest, getMunicipiosRequest, getParroquiasByMunicipioRequest, registrarFeDeVidaRequest, verificarPasswordRequest } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import ManualCultorForm from '../ManualCultorForm'
import EditCultorForm from '../EditCultorForm'

// Columnas de imagen reales en el modelo Cultores. Hoy siempre vendrán vacías
// (no hay Multer/upload conectado todavía), por eso cada una resuelve a un
// placeholder "Sin imagen" hasta que se conecte la subida de archivos.
const CAMPOS_IMAGEN = [
  { campo: 'foto_perfil', etiqueta: 'Foto de Perfil' },
]

const CultoresDirectory = () => {
  const { showToast } = useToast()
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

  // Modal de verificación de contraseña para cambio de estatus de vida
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingFeDeVida, setPendingFeDeVida] = useState(null)
  const [showFeDeVidaPassword, setShowFeDeVidaPassword] = useState(false)
  const [feDeVidaPasswordError, setFeDeVidaPasswordError] = useState('')
  const [feDeVidaLoading, setFeDeVidaLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
    setPendingFeDeVida({ cultor, nuevoEstatus })
    setPasswordInput('')
    setShowPasswordModal(true)
  }

  const confirmarCambioFeDeVida = async () => {
    if (!pendingFeDeVida) return
    const { cultor, nuevoEstatus } = pendingFeDeVida
    const token = localStorage.getItem('auth-token')
    setFeDeVidaPasswordError('')
    if (!passwordInput.trim()) {
      setFeDeVidaPasswordError('Debe ingresar su contraseña.')
      return
    }
    setFeDeVidaLoading(true)
    try {
      await verificarPasswordRequest(passwordInput, token)
    } catch {
      setFeDeVidaPasswordError('Contraseña incorrecta.')
      setFeDeVidaLoading(false)
      return
    }
    try {
      const nuevoRegistro = await registrarFeDeVidaRequest(cultor.id_cultor, nuevoEstatus, token)
      setCultores((prev) =>
        prev.map((c) =>
          c.id_cultor === cultor.id_cultor
            ? { ...c, fesDeVida: [...(c.fesDeVida || []), nuevoRegistro] }
            : c
        )
      )
      setShowPasswordModal(false)
      setPendingFeDeVida(null)
      setPasswordInput('')
      setFeDeVidaPasswordError('')
    } catch (err) {
      showToast({ titulo: 'Error', mensaje: err.message, tipo: 'error' })
    } finally {
      setFeDeVidaLoading(false)
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

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filtroCertificacion, filtroMunicipio, filtroParroquia])

  const totalPages = Math.ceil(cultoresFiltrados.length / itemsPerPage)
  const paginatedCultores = cultoresFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="cultores-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO' },
          { label: 'DIRECTORIO DE CULTORES', active: true },
        ]}
        title="Directorio de Cultores"
        description="Cultores aprobados e incorporados al patrimonio vivo del archivo regional."
        actionButton={
          <button className="ph-action-btn" onClick={() => setIsManualFormOpen(true)}>
            <Plus size={16} />
            <span>Ingreso Manual</span>
          </button>
        }
      />

      {/* 2. Barra de Filtros Premium */}
      <section className="filter-bar-glass">
        <div className="category-pills-glass">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'certificados', label: 'Certificados' },
            { id: 'no_certificados', label: 'No Certificados' },
          ].map((opcion) => (
            <button
              key={opcion.id}
              className={`pill-glass ${filtroCertificacion === opcion.id ? 'active' : ''}`}
              onClick={() => setFiltroCertificacion(opcion.id)}
            >
              {opcion.label}
            </button>
          ))}
        </div>

        <div className="filter-controls-glass">
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="glass-select"
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
            className="glass-select"
            disabled={!filtroMunicipio}
            aria-label="Filtrar por parroquia"
          >
            <option value="">Todas las parroquias</option>
            {parroquias.map((p) => (
              <option key={p.id_parroquia} value={p.id_parroquia}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="glass-search-wrapper">
          <Search className="glass-search-icon" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="glass-clear-btn"
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
                <th>FE DE VIDA</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-grid-state">
                      <p className="empty-grid-title">Cargando directorio...</p>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-grid-state">
                      <p className="empty-grid-title">No se pudo cargar el directorio</p>
                      <p className="empty-grid-desc">{loadError}</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCultores.length > 0 ? (
                paginatedCultores.map((cultor) => (
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
                          {cultor.foto_perfil
                            ? <img src={cultor.foto_perfil} alt={nombreCompleto(cultor)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                            : getInitials(cultor)}
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
                      {(() => {
                        const registro = feDeVidaActual(cultor)
                        const estatus = registro?.estatus_confirmado || ''
                        return (
                          <select
                            value={estatus}
                            onChange={(e) => handleCambiarFeDeVida(cultor, e.target.value)}
                            className={`fede-vida-select ${estatus || 'sin-registrar'}`}
                            aria-label="Estado de fe de vida"
                          >
                            {!estatus && <option value="" disabled>Sin Registrar</option>}
                            <option value="activo">Miembro Activo</option>
                            <option value="honorario">Miembro Honorario</option>
                          </select>
                        )
                      })()}
                    </td>
                    <td className="text-right">
                      <div className="action-icons-row">
                        <button
                          className="action-icon-btn"
                          title="Ver Expediente"
                          onClick={() => {
                            setCultorSeleccionado(cultor)
                            setIsViewModalOpen(true)
                          }}
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          className="action-icon-btn"
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
                  <td colSpan="6">
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

        {totalPages > 1 && (
          <div className="pagination-footer">
            <button className="page-item-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-number-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="page-item-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
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
                  {cultorSeleccionado.foto_perfil
                    ? <img src={cultorSeleccionado.foto_perfil} alt={nombreCompleto(cultorSeleccionado)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    : getInitials(cultorSeleccionado)}
                </div>
                <div className="dossier-profile-meta">
                  <h3>{nombreCompleto(cultorSeleccionado)}</h3>
                  <span className="dossier-sub">{cultorSeleccionado.cedula || 'Sin cédula registrada'}</span>
                </div>
                <div className="dossier-v-status">
                  <span className={`v-badge ${cultorSeleccionado.estatus || 'aprobado'}`}>{cultorSeleccionado.estatus?.toUpperCase() || '—'}</span>
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
                    {cultorSeleccionado.fecha_nacimiento
                      ? (() => { const [a, m, d] = cultorSeleccionado.fecha_nacimiento.split('T')[0].split('-'); return `${d}/${m}/${a}`; })()
                      : '—'}
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

              {/* Galería: foto_perfil / foto_certificacion más documentos legales */}
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
                  {Array.isArray(cultorSeleccionado.documentos) && cultorSeleccionado.documentos.filter(doc => doc.url_archivo).map(doc => (
                    <div key={doc.id_documento} className="dossier-image-thumb">
                      <a href={doc.url_archivo} target="_blank" rel="noopener noreferrer">
                        <img src={doc.url_archivo} alt={doc.nombre_archivo || 'Documento'} />
                      </a>
                      <span className="dossier-image-label">
                        {doc.tipo_documento === 'cedula' ? 'Cédula de Identidad' : 'Documentos de Soporte'}
                      </span>
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

      {/* 7. Modal de verificación de contraseña para cambiar estatus de vida */}
      {showPasswordModal && (
        <div className="custom-dialog-overlay" onClick={() => { setShowPasswordModal(false); setPendingFeDeVida(null); setPasswordInput(''); setFeDeVidaPasswordError('') }}>
          <div className="custom-dialog-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="custom-dialog-icon warning">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="custom-dialog-content">
              <h3 className="custom-dialog-title">Verificar contraseña</h3>
              <p className="custom-dialog-message" style={{ marginBottom: '16px' }}>
                Ingresa tu contraseña de administrador para confirmar el cambio de estatus de vida del cultor.
              </p>
              <div className="input-box-field" style={{ marginBottom: '0' }}>
                <label htmlFor="fedevida-admin-password">Contraseña</label>
                <div className="icon-input-container">
                  <input
                    type={showFeDeVidaPassword ? 'text' : 'password'}
                    id="fedevida-admin-password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setFeDeVidaPasswordError('') }}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter' && !feDeVidaLoading) confirmarCambioFeDeVida() }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowFeDeVidaPassword(prev => !prev)}
                    aria-label={showFeDeVidaPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8B5A2B', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    {showFeDeVidaPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {feDeVidaPasswordError && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{feDeVidaPasswordError}</p>
                )}
              </div>
            </div>
            <div className="custom-dialog-actions">
              <button className="custom-dialog-btn secondary" onClick={() => { setShowPasswordModal(false); setPendingFeDeVida(null); setPasswordInput(''); setFeDeVidaPasswordError('') }}>
                Cancelar
              </button>
              <button className="custom-dialog-btn primary" onClick={confirmarCambioFeDeVida} disabled={feDeVidaLoading}>
                {feDeVidaLoading ? 'Verificando...' : 'Confirmar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CultoresDirectory
