import { useState, useEffect } from 'react'
import {
  Search,
  X,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react'
import './PreRegistration.css'
import { getPostulacionesCultoresRequest, actualizarEstatusCultorRequest } from '../../services/api'
import { enviarCredenciales } from '../../services/emailNotifications'

// Columnas de imagen reales en el modelo Cultores. Hoy siempre vendrán vacías
// (no hay Multer/upload conectado todavía), por eso cada una resuelve a un
// placeholder "Sin imagen" hasta que se conecte la subida de archivos.
const CAMPOS_IMAGEN = [
  { campo: 'foto_perfil', etiqueta: 'Foto de Perfil' },
  { campo: 'foto_certificacion', etiqueta: 'Certificación Fe de Vida' },
]

const PreRegistration = () => {
  // Postulaciones reales (estatus = 'pendiente'), traídas del backend
  const [registros, setRegistros] = useState([])
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

  // Modal de expediente
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

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

  useEffect(() => {
    cargarPostulaciones()
  }, [])

  const nombreCompleto = (registro) =>
    [registro.primer_nombre, registro.segundo_nombre, registro.primer_apellido, registro.segundo_apellido]
      .filter(Boolean)
      .join(' ')

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

  // Filtrado combinado: texto (nombre/cédula) Y píldora de certificación
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

  return (
    <div className="prereg-module-container">
      {/* 1. Cabecera de la Sección */}
      <header className="page-header">
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO</span>
            <span className="separator">&gt;</span>
            <span className="current">PRE-REGISTRO</span>
          </nav>
          <h1>Pre-registro de Cultores</h1>
          <p className="cultor-subinfo text-light" style={{ fontSize: '14px', marginTop: '4px' }}>
            Postulaciones recibidas desde la web pública, pendientes de validación administrativa.
          </p>
        </div>
      </header>

      {actionError && (
        <div className="error-banner-group" style={{ marginBottom: '16px' }}>
          {actionError}
        </div>
      )}

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

        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
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

      {/* 3. Tabla de Postulaciones */}
      <div className="card cultores-list-card">
        <div className="table-responsive">
          <table className="cultores-table">
            <thead>
              <tr>
                <th>CULTOR</th>
                <th>CÉDULA</th>
                <th>CORREO DE CONTACTO</th>
                <th>FECHA DE POSTULACIÓN</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-grid-state">
                      <p className="empty-grid-title">Cargando postulaciones...</p>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-grid-state">
                      <p className="empty-grid-title">No se pudieron cargar las postulaciones</p>
                      <p className="empty-grid-desc">{loadError}</p>
                    </div>
                  </td>
                </tr>
              ) : registrosFiltrados.length > 0 ? (
                registrosFiltrados.map((registro) => (
                  <tr key={registro.id_cultor}>
                    <td>
                      <div
                        className="cultor-profile-cell clickable"
                        onClick={() => {
                          setRegistroSeleccionado(registro)
                          setIsViewModalOpen(true)
                        }}
                      >
                        <div className="cultor-avatar-badge">
                          {getInitials(registro)}
                        </div>
                        <span className="cultor-display-name">
                          {nombreCompleto(registro)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cultor-subinfo">{registro.cedula || '—'}</span>
                    </td>
                    <td>
                      <span className="cultor-subinfo">{registro.correo_contacto || '—'}</span>
                    </td>
                    <td>
                      <span className="cultor-subinfo">
                        {registro.fecha_registro ? new Date(registro.fecha_registro).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="grid-actions-row">
                        <button
                          className="grid-action-btn"
                          title="Revisar Expediente"
                          onClick={() => {
                            setRegistroSeleccionado(registro)
                            setIsViewModalOpen(true)
                          }}
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          className="btn-reject"
                          disabled={procesandoId === registro.id_cultor}
                          onClick={() => handleRechazar(registro.id_cultor)}
                        >
                          {procesandoId === registro.id_cultor ? '...' : 'Rechazar'}
                        </button>
                        <button
                          className="btn-approve"
                          disabled={procesandoId === registro.id_cultor}
                          onClick={() => handleAprobar(registro.id_cultor)}
                        >
                          {procesandoId === registro.id_cultor ? '...' : 'Aprobar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-grid-state">
                      <FolderOpen size={40} />
                      <p className="empty-grid-title">No hay pre-registros pendientes</p>
                      <p className="empty-grid-desc">Todas las postulaciones han sido validadas.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                    {registroSeleccionado.fecha_nacimiento ? new Date(registroSeleccionado.fecha_nacimiento).toLocaleDateString() : '—'}
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

              {/* Galería: foto_perfil / foto_certificacion son las únicas columnas de
                  imagen que existen hoy en el modelo. Sin Multer conectado, casi siempre
                  estarán vacías — por eso cada miniatura cae al placeholder "Sin imagen". */}
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

      {/* 5. Respaldo: la aprobación quedó guardada en la BD, pero EmailJS no pudo notificar.
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
    </div>
  )
}

export default PreRegistration
