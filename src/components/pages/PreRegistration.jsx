import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'
import {
  Search,
  X,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Building2,
  Check,
  MapPin,
  Warehouse,
  Wrench
} from 'lucide-react'
import './PreRegistration.css'
import { 
  getPostulacionesCultoresRequest, 
  actualizarEstatusCultorRequest, 
  getObrasAdminRequest, 
  updateObraEstatusRequest,
  getSalasRequest
} from '../../services/api'
import { enviarCredenciales } from '../../services/emailNotifications'

// Columnas de imagen reales en el modelo Cultores. Hoy siempre vendrán vacías
// (no hay Multer/upload conectado todavía), por eso cada una resuelve a un
// placeholder "Sin imagen" hasta que se conecte la subida de archivos.
const CAMPOS_IMAGEN = [
  { campo: 'foto_perfil', etiqueta: 'Foto de Perfil' },
]

const PreRegistration = () => {
  const [activeTab, setActiveTab] = useState('cultores') // 'cultores' | 'obras'

  // Postulaciones reales (estatus = 'pendiente'), traídas del backend
  const [registros, setRegistros] = useState([])
  const [obrasPendientes, setObrasPendientes] = useState([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Id del registro que tiene una acción (aprobar/rechazar) en curso, para deshabilitar sus botones
  const [procesandoId, setProcesandoId] = useState(null)
  const [actionError, setActionError] = useState('')

  // Respaldo si la aprobación fue exitosa en la BD pero EmailJS falló al notificar:
  // se muestran las credenciales aquí para que el admin las copie y las comunique manualmente.
  const [credencialesSinNotificar, setCredencialesSinNotificar] = useState(null)

  // Filtros: texto + píldora de certificación
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroCertificacion, setFiltroCertificacion] = useState('todos')

  // Modales de expediente
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
  
  const [isObraModalOpen, setIsObraModalOpen] = useState(false)
  const [obraSeleccionada, setObraSeleccionada] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Sala selection on approve
  const [salasList, setSalasList] = useState([])
  const [isSalaModalOpen, setIsSalaModalOpen] = useState(false)
  const [obraAprobando, setObraAprobando] = useState(null)
  const [salaSeleccionada, setSalaSeleccionada] = useState(null)

  // Si el token venció o es inválido, limpia la sesión guardada y recarga: App.jsx
  // detecta que ya no hay 'user-authenticated' y vuelve a mostrar el Login.
  const forzarRelogin = () => {
    localStorage.removeItem('user-authenticated')
    localStorage.removeItem('auth-token')
    window.location.reload()
  }

  const cargarPostulaciones = async () => {
    setIsLoading(true)
    setLoadError('')

    const token = localStorage.getItem('auth-token')
    if (!token) {
      setLoadError('No hay una sesión activa. Inicia sesión nuevamente.')
      setIsLoading(false)
      return
    }

    try {
      const data = await getPostulacionesCultoresRequest(token)
      setRegistros(data)
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

  const cargarObrasPendientes = async () => {
    setIsLoading(true)
    setLoadError('')

    const token = localStorage.getItem('auth-token')
    if (!token) {
      setLoadError('No hay una sesión activa. Inicia sesión nuevamente.')
      setIsLoading(false)
      return
    }

    try {
      const [data, salas] = await Promise.all([
        getObrasAdminRequest(token, 'pendiente'),
        getSalasRequest(token).catch(() => []),
      ])
      setObrasPendientes(data)
      setSalasList(salas)
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
    const tab = sessionStorage.getItem('prereg-tab')
    if (tab === 'obras') {
      setActiveTab('obras')
      sessionStorage.removeItem('prereg-tab')
    }
    cargarPostulaciones()
    cargarObrasPendientes()
  }, [])

  useEffect(() => {
    setSearchQuery('')
    if (activeTab === 'cultores') {
      cargarPostulaciones()
    } else {
      cargarObrasPendientes()
    }
  }, [activeTab])

  const nombreCompleto = (registro) =>
    [registro.primer_nombre, registro.segundo_nombre, registro.primer_apellido, registro.segundo_apellido]
      .filter(Boolean)
      .join(' ')

  const aplicarEstatusObra = async (idObra, estatus, extraData = {}) => {
    setActionError('')
    const token = localStorage.getItem('auth-token')
    if (!token) {
      setActionError('No hay una sesión activa. Inicia sesión nuevamente.')
      return
    }

    setProcesandoId(idObra)
    try {
      await updateObraEstatusRequest(idObra, estatus, token, extraData)
      setObrasPendientes((prev) => prev.filter((obra) => obra.id_obra !== idObra))

      if (obraSeleccionada?.id_obra === idObra) {
        setIsObraModalOpen(false)
        setObraSeleccionada(null)
      }
    } catch (error) {
      if (error.isAuthError) {
        setActionError(error.message)
        forzarRelogin()
        return
      }
      setActionError(error.message)
    } finally {
      setProcesandoId(null)
    }
  }

  const handleAprobarObra = (idObra) => {
    setObraAprobando(idObra)
    setSalaSeleccionada(salasList.length > 0 ? salasList[0].id_sala : null)
    setIsSalaModalOpen(true)
  }

  const confirmarAprobacionConSala = async () => {
    const idObra = obraAprobando
    if (!idObra) return
    const sala = salasList.find(s => s.id_sala === salaSeleccionada)
    setIsSalaModalOpen(false)
    setObraAprobando(null)
    await aplicarEstatusObra(idObra, 'aprobado', sala ? { ubicacion_actual: sala.nombre } : {})
  }

  const handleRechazarObra = (idObra) => aplicarEstatusObra(idObra, 'rechazado')

  // Saca el registro de la lista en memoria al recibir 200 OK, sin recargar la página
  const aplicarCambioDeEstatus = async (idCultor, estatus) => {
    setActionError('')

    const token = localStorage.getItem('auth-token')
    if (!token) {
      setActionError('No hay una sesión activa. Inicia sesión nuevamente.')
      return
    }

    setProcesandoId(idCultor)
    try {
      const respuesta = await actualizarEstatusCultorRequest(idCultor, estatus, token)
      setRegistros((prev) => prev.filter((registro) => registro.id_cultor !== idCultor))

      const eraElSeleccionado = registroSeleccionado?.id_cultor === idCultor
      if (eraElSeleccionado) {
        setIsViewModalOpen(false)
        setRegistroSeleccionado(null)
      }

      // Solo viene presente cuando se aprobó por primera vez y se creó un usuario nuevo.
      if (respuesta.credencialesNuevas) {
        const { correo, nombre, passwordTemporal } = respuesta.credencialesNuevas
        try {
          await enviarCredenciales({ correo, nombre, password: passwordTemporal, rol_usuario: 'Cultor' })
        } catch {
          // La BD ya quedó aprobada; el respaldo es mostrar la contraseña en pantalla
          // para que el admin la comunique manualmente, en vez de perderla en silencio.
          setCredencialesSinNotificar({ correo, nombre, passwordTemporal })
        }
      }
    } catch (error) {
      if (error.isAuthError) {
        setActionError(error.message)
        forzarRelogin()
        return
      }
      setActionError(error.message)
    } finally {
      setProcesandoId(null)
    }
  }

  const handleAprobar = (idCultor) => aplicarCambioDeEstatus(idCultor, 'aprobado')
  const handleRechazar = (idCultor) => aplicarCambioDeEstatus(idCultor, 'rechazado')

  const getInitials = (registro) => {
    const nombre = registro.primer_nombre || ''
    const apellido = registro.primer_apellido || ''
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '--'
  }

  // Filtrado combinado: texto (nombre/cédula) Y píldora de certificación (para cultores)
  const registrosFiltrados = registros.filter((registro) => {
    const term = searchQuery.toLowerCase()
    const coincideTexto =
      nombreCompleto(registro).toLowerCase().includes(term) ||
      (registro.cedula || '').toLowerCase().includes(term)

    const coincideCertificacion =
      filtroCertificacion === 'todos' ||
      (filtroCertificacion === 'certificados' && registro.esta_certificado) ||
      (filtroCertificacion === 'no_certificados' && !registro.esta_certificado)

    return coincideTexto && coincideCertificacion
  })

  // Filtrado simple por búsqueda para obras
  const obrasFiltradas = obrasPendientes.filter((obra) => {
    const term = searchQuery.toLowerCase()
    const autorNombre = obra.cultor ? `${obra.cultor.primer_nombre} ${obra.cultor.primer_apellido}` : ''
    return (
      (obra.titulo || '').toLowerCase().includes(term) ||
      (obra.codigo_qr_link || '').toLowerCase().includes(term) ||
      autorNombre.toLowerCase().includes(term)
    )
  })

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filtroCertificacion, activeTab])

  const totalPagesCultores = Math.ceil(registrosFiltrados.length / itemsPerPage)
  const paginatedRegistros = registrosFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPagesObras = Math.ceil(obrasFiltradas.length / itemsPerPage)
  const paginatedObras = obrasFiltradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="prereg-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO' },
          { label: 'SOLICITUDES DE REGISTRO', active: true },
        ]}
        title="Solicitudes de Registro"
        description="Postulaciones de cultores y obras recibidas desde la web pública, pendientes de validación."
      />

      {actionError && (
        <div className="error-banner-group" style={{ marginBottom: '16px' }}>
          {actionError}
        </div>
      )}

      {/* 2. Tabs de navegación entre Cultores y Obras */}
      <div className="tabs-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid var(--border-light)', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('cultores')}
          style={{
            padding: '8px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'cultores' ? 700 : 400,
            borderBottom: activeTab === 'cultores' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-2px',
            color: activeTab === 'cultores' ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          Cultores Pendientes
          {registros.length > 0 && (
            <span style={{ marginLeft: '8px', background: 'var(--primary)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '11px' }}>
              {registros.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('obras')}
          style={{
            padding: '8px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'obras' ? 700 : 400,
            borderBottom: activeTab === 'obras' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-2px',
            color: activeTab === 'obras' ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          Obras Pendientes
          {obrasPendientes.length > 0 && (
            <span style={{ marginLeft: '8px', background: '#d97706', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '11px' }}>
              {obrasPendientes.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Barra de búsqueda + filtros de certificación (solo para cultores) */}

      <section className="filter-bar-card">
        {activeTab === 'cultores' && (
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
        )}

        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'cultores' ? 'Buscar por nombre o cédula...' : 'Buscar por título, código o autor...'}
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

      {/* 4. Tabla de Postulaciones — condicional por pestaña activa */}
      {activeTab === 'cultores' ? (
        <div className="card cultores-list-card">
          <div className="table-responsive">
            <table className="cultores-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">CULTOR</th>
                  <th className="whitespace-nowrap">CÉDULA</th>
                  <th className="whitespace-nowrap">CORREO DE CONTACTO</th>
                  <th className="whitespace-nowrap">FECHA DE POSTULACIÓN</th>
                  <th className="text-right whitespace-nowrap">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5"><div className="empty-grid-state"><p className="empty-grid-title">Cargando...</p></div></td></tr>
                ) : loadError ? (
                  <tr><td colSpan="5"><div className="empty-grid-state"><p className="empty-grid-title">Error al cargar</p><p className="empty-grid-desc">{loadError}</p></div></td></tr>
                ) : paginatedRegistros.length > 0 ? (
                  paginatedRegistros.map((registro) => (
                    <tr key={registro.id_cultor}>
                      <td data-label="">
                        <div className="cultor-profile-cell clickable" onClick={() => { setRegistroSeleccionado(registro); setIsViewModalOpen(true) }}>
                          <div className="cultor-avatar-badge">{getInitials(registro)}</div>
                          <span className="cultor-display-name">{nombreCompleto(registro)}</span>
                        </div>
                      </td>
                      <td data-label="Cédula"><span className="cultor-subinfo">{registro.cedula || '—'}</span></td>
                      <td data-label="Correo"><span className="cultor-subinfo">{registro.correo_contacto || '—'}</span></td>
                      <td data-label="Postulación"><span className="cultor-subinfo">{registro.fecha_registro ? new Date(registro.fecha_registro).toLocaleDateString() : '—'}</span></td>
                      <td data-label="" className="text-right">
                        <div className="grid-actions-row">
                          <button className="grid-action-btn" title="Revisar Expediente" onClick={() => { setRegistroSeleccionado(registro); setIsViewModalOpen(true) }}><FolderOpen size={16} /></button>
                          <button className="btn-reject" disabled={procesandoId === registro.id_cultor} onClick={() => handleRechazar(registro.id_cultor)}>{procesandoId === registro.id_cultor ? '...' : 'Rechazar'}</button>
                          <button className="btn-approve" disabled={procesandoId === registro.id_cultor} onClick={() => handleAprobar(registro.id_cultor)}>{procesandoId === registro.id_cultor ? '...' : 'Aprobar'}</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5"><div className="empty-grid-state"><FolderOpen size={40} /><p className="empty-grid-title">No hay postulaciones pendientes</p><p className="empty-grid-desc">Todas las postulaciones han sido validadas.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPagesCultores > 1 && (
            <div className="pagination-footer">
              <button className="page-item-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPagesCultores }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-number-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button className="page-item-btn" disabled={currentPage === totalPagesCultores} onClick={() => setCurrentPage(p => Math.min(totalPagesCultores, p + 1))}><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      ) : (
        /* ===== PESTAÑA OBRAS PENDIENTES ===== */
        <div className="card cultores-list-card">
          <div className="table-responsive">
            <table className="cultores-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">OBRA</th>
                  <th className="whitespace-nowrap">CÓDIGO</th>
                  <th className="whitespace-nowrap">AUTOR</th>
                  <th className="whitespace-nowrap">FECHA DE POSTULACIÓN</th>
                  <th className="text-right whitespace-nowrap">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5"><div className="empty-grid-state"><p className="empty-grid-title">Cargando obras...</p></div></td></tr>
                ) : loadError ? (
                  <tr><td colSpan="5"><div className="empty-grid-state"><p className="empty-grid-title">Error al cargar</p><p className="empty-grid-desc">{loadError}</p></div></td></tr>
                ) : paginatedObras.length > 0 ? (
                  paginatedObras.map((obra) => {
                    const imagenUrl = obra.multimedia && obra.multimedia[0] ? obra.multimedia[0].url_archivo : null
                    const autorNombre = obra.cultor ? `${obra.cultor.primer_nombre} ${obra.cultor.primer_apellido}` : '—'
                    return (
                      <tr key={obra.id_obra}>
                        <td data-label="">
                          <div className="cultor-profile-cell clickable" onClick={() => { setObraSeleccionada(obra); setIsObraModalOpen(true) }}>
                            {imagenUrl ? (
                              <img src={imagenUrl} alt={obra.titulo} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            ) : (
                              <div className="cultor-avatar-badge" style={{ fontSize: '10px' }}><ImageIcon size={16} /></div>
                            )}
                            <span className="cultor-display-name" style={{ textTransform: 'capitalize' }}>{obra.titulo || '—'}</span>
                          </div>
                        </td>
                        <td data-label="Código"><span className="cultor-subinfo">{obra.codigo_qr_link || '—'}</span></td>
                        <td data-label="Autor"><span className="cultor-subinfo">{autorNombre}</span></td>
                        <td data-label="Postulación"><span className="cultor-subinfo">{obra.fecha_postulacion ? new Date(obra.fecha_postulacion).toLocaleDateString() : '—'}</span></td>
                        <td data-label="" className="text-right">
                          <div className="grid-actions-row">
                            <button className="grid-action-btn" title="Ver Detalle" onClick={() => { setObraSeleccionada(obra); setIsObraModalOpen(true) }}><FolderOpen size={16} /></button>
                            <button className="btn-reject" disabled={procesandoId === obra.id_obra} onClick={() => handleRechazarObra(obra.id_obra)}>{procesandoId === obra.id_obra ? '...' : 'Rechazar'}</button>
                            <button className="btn-approve" disabled={procesandoId === obra.id_obra} onClick={() => handleAprobarObra(obra.id_obra)}>{procesandoId === obra.id_obra ? '...' : 'Aprobar'}</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan="5"><div className="empty-grid-state"><FolderOpen size={40} /><p className="empty-grid-title">No hay obras pendientes</p><p className="empty-grid-desc">Todas las obras han sido revisadas.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPagesObras > 1 && (
            <div className="pagination-footer">
              <button className="page-item-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPagesObras }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-number-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button className="page-item-btn" disabled={currentPage === totalPagesObras} onClick={() => setCurrentPage(p => Math.min(totalPagesObras, p + 1))}><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* 4. Ver Expediente / Modal de Verificación */}
      {isViewModalOpen && registroSeleccionado && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card dossier-modal">
            <div className="modal-box-header">
              <h2>Expediente del Cultor (Revisión)</h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false)
                  setRegistroSeleccionado(null)
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
                  {getInitials(registroSeleccionado)}
                </div>
                <div className="dossier-profile-meta">
                  <h3>{nombreCompleto(registroSeleccionado)}</h3>
                  <span className="dossier-sub">{registroSeleccionado.cedula || 'Sin cédula registrada'}</span>
                </div>
                <div className="dossier-v-status">
                  <span className="v-badge pendiente">PENDIENTE</span>
                </div>
              </div>

              <div className="dossier-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Nombre Completo:</span>
                  <span className="dossier-value">{nombreCompleto(registroSeleccionado)}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Cédula de Identidad:</span>
                  <span className="dossier-value">{registroSeleccionado.cedula || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Fecha de Nacimiento:</span>
                  <span className="dossier-value">
                    {registroSeleccionado.fecha_nacimiento
                      ? (() => { const [a, m, d] = registroSeleccionado.fecha_nacimiento.split('T')[0].split('-'); return `${d}/${m}/${a}`; })()
                      : '—'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Teléfono de Contacto:</span>
                  <span className="dossier-value">{registroSeleccionado.telefono_contacto || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Correo de Contacto:</span>
                  <span className="dossier-value">{registroSeleccionado.correo_contacto || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Dirección de Residencia:</span>
                  <span className="dossier-value">{registroSeleccionado.direccion_residencia || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Género:</span>
                  <span className="dossier-value">{registroSeleccionado.genero || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Parroquia:</span>
                  <span className="dossier-value">{registroSeleccionado.parroquia?.nombre || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Estatus de Vida:</span>
                  <span className="dossier-value">{registroSeleccionado.estatus_vida || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Fecha de Postulación:</span>
                  <span className="dossier-value">
                    {registroSeleccionado.fecha_registro ? new Date(registroSeleccionado.fecha_registro).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Certificación:</span>
                  <span className="dossier-value">
                    {registroSeleccionado.esta_certificado ? (
                      <span style={{ color: 'var(--green-badge)', fontWeight: 700 }}>Artesano Certificado</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>No Certificado</span>
                    )}
                  </span>
                </div>
              </div>

              {registroSeleccionado.resumen_curricular && (
                <div className="dossier-field" style={{ marginTop: '16px' }}>
                  <span className="dossier-label">Resumen Curricular:</span>
                  <p className="dossier-value">{registroSeleccionado.resumen_curricular}</p>
                </div>
              )}

              {registroSeleccionado.trayectoria_documentada && (
                <div className="dossier-field" style={{ marginTop: '16px' }}>
                  <span className="dossier-label">Trayectoria Documentada:</span>
                  <p className="dossier-value">{registroSeleccionado.trayectoria_documentada}</p>
                </div>
              )}

              {/* Galería: foto_perfil / foto_certificacion más documentos legales */}
              <div className="dossier-field" style={{ marginTop: '16px' }}>
                <span className="dossier-label">Documentos e Imágenes:</span>
                <div className="dossier-image-gallery">
                  {CAMPOS_IMAGEN.map(({ campo, etiqueta }) => (
                    <div key={campo} className="dossier-image-thumb">
                      {registroSeleccionado[campo] ? (
                        <img src={registroSeleccionado[campo]} alt={etiqueta} />
                      ) : (
                        <div className="dossier-image-placeholder">
                          <ImageIcon size={20} />
                          <span style={{ marginTop: '4px' }}>Sin imagen</span>
                        </div>
                      )}
                      <span className="dossier-image-label">{etiqueta}</span>
                    </div>
                  ))}
                  {Array.isArray(registroSeleccionado.documentos) && registroSeleccionado.documentos.filter(doc => doc.url_archivo).map(doc => (
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
                <div className="review-banner-alert warning">
                  <div className="review-banner-text">
                    <strong>Revisión Administrativa Requerida</strong>
                    <p>Verifique que la información esté completa y verídica antes de incorporar al cultor al directorio público.</p>
                  </div>
                  <div className="review-actions-row">
                    <button
                      type="button"
                      className="btn-reject"
                      disabled={procesandoId === registroSeleccionado.id_cultor}
                      onClick={() => handleRechazar(registroSeleccionado.id_cultor)}
                    >
                      Rechazar Registro
                    </button>
                    <button
                      type="button"
                      className="btn-approve"
                      disabled={procesandoId === registroSeleccionado.id_cultor}
                      onClick={() => handleAprobar(registroSeleccionado.id_cultor)}
                    >
                      Aprobar Registro
                    </button>
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
                  setRegistroSeleccionado(null)
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal detalle de Obra Pendiente */}
      {isObraModalOpen && obraSeleccionada && (() => {
        const imgUrl = obraSeleccionada.multimedia && obraSeleccionada.multimedia[0] ? obraSeleccionada.multimedia[0].url_archivo : null
        const autorNombre = obraSeleccionada.cultor ? `${obraSeleccionada.cultor.primer_nombre} ${obraSeleccionada.cultor.primer_apellido}` : '—'
        return (
          <div className="modal-overlay-backdrop">
            <div className="modal-box-card dossier-modal">
              <div className="modal-box-header">
                <h2>Revisión de Obra</h2>
                <button onClick={() => { setIsObraModalOpen(false); setObraSeleccionada(null) }} className="close-x-btn" aria-label="Cerrar"><X size={18} /></button>
              </div>
              <div className="modal-box-body">
                {imgUrl && (
                  <img src={imgUrl} alt={obraSeleccionada.titulo} style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
                )}
                <div className="dossier-grid">
                  <div className="dossier-field"><span className="dossier-label">Título:</span><span className="dossier-value" style={{ textTransform: 'capitalize' }}>{obraSeleccionada.titulo || '—'}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Código:</span><span className="dossier-value">{obraSeleccionada.codigo_qr_link || '—'}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Autor:</span><span className="dossier-value">{autorNombre}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Tipo de Patrimonio:</span><span className="dossier-value">{obraSeleccionada.tipo_patrimonio || '—'}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Técnica:</span><span className="dossier-value">{obraSeleccionada.tecnica_utilizada || '—'}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Materiales:</span><span className="dossier-value">{obraSeleccionada.materiales_utilizados || '—'}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Año:</span><span className="dossier-value">{obraSeleccionada.anio_creacion || '—'}</span></div>
                  <div className="dossier-field"><span className="dossier-label">Fecha de Postulación:</span><span className="dossier-value">{obraSeleccionada.fecha_postulacion ? new Date(obraSeleccionada.fecha_postulacion).toLocaleDateString() : '—'}</span></div>
                </div>
                {obraSeleccionada.descripcion && (
                  <div className="dossier-field" style={{ marginTop: '12px' }}><span className="dossier-label">Descripción:</span><p className="dossier-value">{obraSeleccionada.descripcion}</p></div>
                )}
                {obraSeleccionada.significado_cultural && (
                  <div className="dossier-field" style={{ marginTop: '12px' }}><span className="dossier-label">Significado Cultural:</span><p className="dossier-value">{obraSeleccionada.significado_cultural}</p></div>
                )}
                <div className="administrative-review-panel">
                  <div className="review-banner-alert warning">
                    <div className="review-banner-text">
                      <strong>Revisión Administrativa</strong>
                      <p>Verifique los datos de la obra antes de incorporarla al inventario oficial.</p>
                    </div>
                    <div className="review-actions-row">
                      <button type="button" className="btn-reject" disabled={procesandoId === obraSeleccionada.id_obra} onClick={() => handleRechazarObra(obraSeleccionada.id_obra)}>Rechazar</button>
                      <button type="button" className="btn-approve" disabled={procesandoId === obraSeleccionada.id_obra} onClick={() => handleAprobarObra(obraSeleccionada.id_obra)}>Aprobar Obra</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-box-footer">
                <button type="button" className="btn-secondary" onClick={() => { setIsObraModalOpen(false); setObraSeleccionada(null) }}>Cerrar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 6. Respaldo: la aprobación quedó guardada en la BD, pero EmailJS no pudo notificar.
          Modal bloqueante para asegurar que el admin vea y copie la contraseña antes de cerrar. */}
      {credencialesSinNotificar && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card">
            <div className="modal-box-header">
              <h2>Cultor Aprobado — Falta Notificar</h2>
            </div>
            <div className="modal-box-body">
              <div className="error-banner-group" style={{ marginBottom: '16px' }}>
                El cultor fue aprobado y su cuenta ya existe, pero no se pudo enviar el correo
                con sus credenciales. Copia esta contraseña y comunícasela manualmente.
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Cultor:</span>
                <span className="dossier-value">{credencialesSinNotificar.nombre}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Correo:</span>
                <span className="dossier-value">{credencialesSinNotificar.correo}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Contraseña temporal:</span>
                <span className="dossier-value" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {credencialesSinNotificar.passwordTemporal}
                </span>
              </div>
            </div>
            <div className="modal-box-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigator.clipboard.writeText(credencialesSinNotificar.passwordTemporal)}
              >
                Copiar Contraseña
              </button>
              <button
                type="button"
                className="btn-approve"
                onClick={() => setCredencialesSinNotificar(null)}
              >
                Ya la comuniqué, cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de selección de sala al aprobar obra */}
      {isSalaModalOpen && (
        <div className="modal-overlay-backdrop" onClick={() => { setIsSalaModalOpen(false); setObraAprobando(null) }}>
          <div className="modal-box-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-box-header">
              <h2>Asignar a una Sala</h2>
              <button onClick={() => { setIsSalaModalOpen(false); setObraAprobando(null) }} className="close-x-btn" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <div className="modal-box-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Selecciona la sala o espacio donde se ubicará físicamente esta obra al ser aprobada.
              </p>
              {salasList.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No hay salas registradas. La obra se aprobará sin ubicación.</p>
              ) : (
                <div className="select-sala-grid">
                  {salasList.map(s => {
                    const tipoIcon = s.tipo === 'Exhibición' ? <MapPin size={16} /> : s.tipo === 'Almacén' ? <Warehouse size={16} /> : <Wrench size={16} />
                    return (
                      <div
                        key={s.id_sala}
                        className={`select-sala-item ${salaSeleccionada === s.id_sala ? 'selected' : ''}`}
                        onClick={() => setSalaSeleccionada(s.id_sala)}
                      >
                        <div className="select-sala-left">
                          <span className="select-sala-icon">{tipoIcon}</span>
                          <div className="select-sala-info">
                            <span className="select-sala-name">{s.nombre}</span>
                            <span className="select-sala-meta">{s.codigo} · {s.tipo}</span>
                          </div>
                        </div>
                        {salaSeleccionada === s.id_sala && <Check size={18} className="select-sala-check" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="modal-box-footer">
              <button type="button" className="btn-secondary" onClick={() => { setIsSalaModalOpen(false); setObraAprobando(null) }}>Cancelar</button>
              <button type="button" className="btn-approve" onClick={confirmarAprobacionConSala} disabled={salasList.length > 0 && !salaSeleccionada}>
                <Check size={16} />
                <span>Aprobar y Asignar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreRegistration
