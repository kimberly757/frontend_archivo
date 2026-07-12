import React, { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'
import {
  Search,
  Plus,
  X,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Warehouse,
  Wrench,
  Filter,
  ArrowLeft,
  Check,
  XCircle,
  Loader
} from 'lucide-react'
import './ManagementRooms.css'
import {
  getSalasRequest,
  createSalaRequest,
  updateSalaRequest,
  getObrasPorSalaRequest,
  updateObraRequest,
  cambiarEstadoSalaRequest,
} from '../../services/api'
import { useToast } from '../../context/ToastContext'

const ManagementRooms = () => {
  const { showToast } = useToast()
  const token = localStorage.getItem('auth-token')

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subView, setSubView] = useState('list')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [obrasEnSala, setObrasEnSala] = useState([])
  const [loadingObras, setLoadingObras] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'Exhibición',
    descripcion: '',
    estado: true,
  })
  const [formError, setFormError] = useState('')

  const [isTrasladoModalOpen, setIsTrasladoModalOpen] = useState(false)
  const [obraATrasladar, setObraATrasladar] = useState(null)
  const [salaDestino, setSalaDestino] = useState(null)

  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false)
  const [obraEnFicha, setObraEnFicha] = useState(null)

  const [isDeshabilitarModalOpen, setIsDeshabilitarModalOpen] = useState(false)
  const [salaADeshabilitar, setSalaADeshabilitar] = useState(null)
  const [salaDestinoTraslado, setSalaDestinoTraslado] = useState(null)
  const [deshabilitando, setDeshabilitando] = useState(false)

  useEffect(() => {
    cargarSalas()
  }, [])

  const cargarSalas = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSalasRequest(token)
      setRooms(data)
    } catch (err) {
      setError(err.message || 'Error al cargar las salas')
    } finally {
      setLoading(false)
    }
  }

  const cargarObrasDeSala = async (sala) => {
    setLoadingObras(true)
    try {
      const data = await getObrasPorSalaRequest(sala.id_sala, token)
      setObrasEnSala(data)
    } catch (err) {
      setObrasEnSala([])
    } finally {
      setLoadingObras(false)
    }
  }

  const tipoPrefixMap = { 'Exhibición': 'EXH', 'Almacén': 'ALM', 'Taller': 'TLL' }

  const previewCodigo = (tipo) => {
    if (editingRoom) return formData.codigo
    const prefix = tipoPrefixMap[tipo] || 'EXH'
    const sameTipo = rooms.filter(r => r.tipo === tipo)
    let maxNum = 0
    sameTipo.forEach(r => {
      const match = r.codigo.match(/-(\d+)$/)
      if (match) {
        const n = parseInt(match[1], 10)
        if (n > maxNum) maxNum = n
      }
    })
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`
  }

  const handleOpenCreate = () => {
    setEditingRoom(null)
    setFormData({ codigo: '', nombre: '', tipo: 'Exhibición', descripcion: '', estado: true })
    setFormError('')
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (room) => {
    setEditingRoom(room)
    setFormData({
      codigo: room.codigo,
      nombre: room.nombre,
      tipo: room.tipo,
      descripcion: room.descripcion || '',
      estado: room.estado === 'Habilitada',
    })
    setFormError('')
    setIsFormModalOpen(true)
  }

  const handleSaveRoom = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      setFormError('Completa los campos obligatorios: Nombre.')
      return
    }
    const payload = {
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      descripcion: formData.descripcion.trim(),
      estado: formData.estado ? 'Habilitada' : 'Mantenimiento',
    }
    try {
      if (editingRoom) {
        await updateSalaRequest(editingRoom.id_sala, payload, token)
        showToast({ titulo: 'Sala actualizada', mensaje: `"${payload.nombre}" fue actualizada correctamente.`, tipo: 'success' })
      } else {
        await createSalaRequest(payload, token)
        showToast({ titulo: 'Sala registrada', mensaje: `"${payload.nombre}" fue creada exitosamente.`, tipo: 'success' })
      }
      setIsFormModalOpen(false)
      await cargarSalas()
    } catch (err) {
      setFormError(err.message || 'Error al guardar la sala.')
    }
  }

  const handleViewInventory = async (room) => {
    setSelectedRoom(room)
    setSubView('detail')
    setSearchTerm('')
    setCurrentPage(1)
    await cargarObrasDeSala(room)
  }

  const handleBackToList = () => {
    setSubView('list')
    setSelectedRoom(null)
    setObrasEnSala([])
  }

  const handleVerFicha = (obra) => {
    setObraEnFicha(obra)
    setIsFichaModalOpen(true)
  }

  const handleAbrirTraslado = (obra) => {
    setObraATrasladar(obra)
    setSalaDestino(rooms.length > 0 ? rooms[0].id_sala : null)
    setIsTrasladoModalOpen(true)
  }

  const handleConfirmarTraslado = async () => {
    const obra = obraATrasladar
    if (!obra) return
    const sala = rooms.find(s => s.id_sala === salaDestino)
    if (!sala) return
    try {
      await updateObraRequest(obra.id_obra, { ubicacion_actual: sala.nombre }, token)
      showToast({ titulo: 'Obra trasladada', mensaje: `"${obra.titulo}" fue trasladada a "${sala.nombre}".`, tipo: 'success' })
      setIsTrasladoModalOpen(false)
      setObraATrasladar(null)
      await cargarObrasDeSala(selectedRoom)
      await cargarSalas()
    } catch (err) {
      showToast({ titulo: 'Error', mensaje: err.message || 'No se pudo trasladar la obra.', tipo: 'error' })
    }
  }

  const handleAbrirDeshabilitar = (sala) => {
    setSalaADeshabilitar(sala)
    setSalaDestinoTraslado(null)
    setIsDeshabilitarModalOpen(true)
  }

  const handleConfirmarDeshabilitar = async () => {
    const sala = salaADeshabilitar
    if (!sala) return
    setDeshabilitando(true)
    try {
      await cambiarEstadoSalaRequest(sala.id_sala, {
        estado: 'Deshabilitada',
        moverA: sala.cantidad_obras > 0 ? salaDestinoTraslado : undefined,
      }, token)
      showToast({ titulo: 'Sala deshabilitada', mensaje: `"${sala.nombre}" fue deshabilitada.`, tipo: 'success' })
      setIsDeshabilitarModalOpen(false)
      setSalaADeshabilitar(null)
      await cargarSalas()
      if (selectedRoom && selectedRoom.id_sala === sala.id_sala) {
        handleBackToList()
      }
    } catch (err) {
      showToast({ titulo: 'Error', mensaje: err.message || 'No se pudo deshabilitar la sala.', tipo: 'error' })
    } finally {
      setDeshabilitando(false)
    }
  }

  const obras = obrasEnSala
  const filteredObras = obras.filter(o =>
    o.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.autor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.codigo_inventario?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.ceil(filteredObras.length / itemsPerPage)
  const paginatedObras = filteredObras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalSalas = rooms.length
  const obrasExhibicion = rooms.filter(r => r.tipo === 'Exhibición').reduce((sum, r) => sum + (r.cantidad_obras || 0), 0)
  const obrasAlmacen = rooms.filter(r => r.tipo === 'Almacén').reduce((sum, r) => sum + (r.cantidad_obras || 0), 0)
  const obrasTaller = rooms.filter(r => r.tipo === 'Taller').reduce((sum, r) => sum + (r.cantidad_obras || 0), 0)

  const tipoIconMap = {
    'Exhibición': <MapPin size={16} />,
    'Almacén': <Warehouse size={16} />,
    'Taller': <Wrench size={16} />,
  }

  if (subView === 'detail' && selectedRoom) {
    return (
      <div className="rooms-module-container">
        <button className="rooms-back-btn" onClick={handleBackToList}>
          <ArrowLeft size={18} />
          <span>Volver al listado de salas</span>
        </button>

        <div className="rooms-detail-header">
          <div className="rooms-detail-title-group">
            <h2>{selectedRoom.nombre}</h2>
            <div className="rooms-detail-tags">
              <span className={`rooms-tag rooms-tag--${selectedRoom.tipo.toLowerCase()}`}>
                {tipoIconMap[selectedRoom.tipo]}
                {selectedRoom.tipo}
              </span>
              <span className={`rooms-tag rooms-tag--${selectedRoom.estado === 'Habilitada' ? 'habilitada' : 'mantenimiento'}`}>
                {selectedRoom.estado === 'Habilitada' ? <Check size={14} /> : <XCircle size={14} />}
                {selectedRoom.estado}
              </span>
              <span className="rooms-tag rooms-tag--code">{selectedRoom.codigo}</span>
            </div>
          </div>
        </div>

        <div className="rooms-toolbar">
          <h3 className="rooms-toolbar-title">Inventario de Obras en Sala</h3>
          <div className="rooms-toolbar-controls">
            <div className="search-input-wrapper">
              <Search className="search-input-icon" size={16} />
              <input
                type="text"
                className="search-input-field"
                placeholder="Buscar por título, autor o código..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              />
            </div>
            <button className="rooms-filter-btn">
              <Filter size={16} />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {loadingObras ? (
          <div className="rooms-empty">
            <Loader size={32} className="rooms-spinner" />
            <p>Cargando obras de la sala...</p>
          </div>
        ) : filteredObras.length === 0 ? (
          <div className="rooms-empty">
            <Building2 size={48} />
            <p>{searchTerm ? 'No se encontraron obras con ese criterio de búsqueda.' : 'Esta sala no tiene obras vinculadas.'}</p>
          </div>
        ) : (
          <>
            <div className="rooms-obras-grid">
              {paginatedObras.map(obra => (
                <div key={obra.id_obra} className="rooms-obra-card">
                  <div className="rooms-obra-img">
                    {obra.imagen ? (
                      <img src={obra.imagen} alt={obra.titulo} className="rooms-obra-img-src" />
                    ) : (
                      <Building2 size={28} />
                    )}
                  </div>
                  <div className="rooms-obra-info">
                    <span className="rooms-obra-title">{obra.titulo}</span>
                    <span className="rooms-obra-autor">{obra.autor}</span>
                    <span className="rooms-obra-codigo">{obra.codigo_inventario}</span>
                    <div className="rooms-obra-actions">
                      <button className="grid-action-btn" title="Trasladar" onClick={() => handleAbrirTraslado(obra)}>
                        <MapPin size={15} />
                      </button>
                      <button className="grid-action-btn" title="Ver Ficha de la obra" onClick={() => handleVerFicha(obra)}>
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination-footer">
                <button
                  className="page-item-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`page-item-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="page-item-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {isFichaModalOpen && obraEnFicha && (
              <div className="modal-overlay" onClick={() => setIsFichaModalOpen(false)}>
                <div className="rooms-modal salas-ficha-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{obraEnFicha.titulo}</h2>
                    <button className="rooms-modal-close-btn" onClick={() => setIsFichaModalOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="salas-ficha-body">
                    {obraEnFicha.imagen && (
                      <img src={obraEnFicha.imagen} alt={obraEnFicha.titulo} className="salas-ficha-img" />
                    )}
                    <div className="salas-ficha-info">
                      <p><strong>Autor:</strong> {obraEnFicha.autor || '—'}</p>
                      <p><strong>Código:</strong> {obraEnFicha.codigo_inventario || '—'}</p>
                      <p><strong>Ubicación actual:</strong> {obraEnFicha.ubicacion_actual || selectedRoom?.nombre || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTrasladoModalOpen && obraATrasladar && (
              <div className="modal-overlay" onClick={() => setIsTrasladoModalOpen(false)}>
                <div className="rooms-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Trasladar: {obraATrasladar.titulo}</h2>
                    <button className="rooms-modal-close-btn" onClick={() => setIsTrasladoModalOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="rooms-form">
                    <div>
                      <label className="form-label">Seleccionar sala de destino</label>
                      <select
                        className="form-input"
                        value={salaDestino || ''}
                        onChange={e => setSalaDestino(Number(e.target.value))}
                      >
                        {rooms.map(s => (
                          <option key={s.id_sala} value={s.id_sala}>{s.codigo} — {s.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-actions">
                      <button className="btn-cancel" onClick={() => setIsTrasladoModalOpen(false)}>Cancelar</button>
                      <button className="btn-terracota" onClick={handleConfirmarTraslado}>Confirmar traslado</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="rooms-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'GESTIÓN DE SALAS', active: false },
          { label: 'LISTADO DE SALAS', active: true },
        ]}
        title="Gestión de Salas y Ubicaciones"
        actionButton={
          <button className="btn-terracota" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Registrar Nueva Sala</span>
          </button>
        }
      />

      <section className="rooms-kpi-row">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon--total">
              <Building2 size={18} />
            </div>
            <span className="stat-card-label">TOTAL DE SALAS HABILITADAS</span>
          </div>
          <span className="stat-card-value">{totalSalas}</span>
        </div>
        <div className="stat-card gold">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon--exhibicion">
              <MapPin size={18} />
            </div>
            <span className="stat-card-label">OBRAS EN EXHIBICIÓN</span>
          </div>
          <span className="stat-card-value">{obrasExhibicion}</span>
        </div>
        <div className="stat-card clay">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon--almacen">
              <Warehouse size={18} />
            </div>
            <span className="stat-card-label">OBRAS EN ALMACÉN</span>
          </div>
          <span className="stat-card-value">{obrasAlmacen}</span>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon--taller">
              <Wrench size={18} />
            </div>
            <span className="stat-card-label">OBRAS EN TALLER</span>
          </div>
          <span className="stat-card-value">{obrasTaller}</span>
        </div>
      </section>

      {loading ? (
        <div className="rooms-empty">
          <Loader size={32} className="rooms-spinner" />
          <p>Cargando salas...</p>
        </div>
      ) : error ? (
        <div className="rooms-empty">
          <p>{error}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Código de Sala</th>
                <th>Nombre del Espacio</th>
                <th>Tipo de Espacio</th>
                <th>Estado</th>
                <th>Cant. Obras</th>
                <th className="rooms-th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id_sala}>
                  <td><span className="rooms-code-pill">{room.codigo}</span></td>
                  <td><span className="rooms-name-cell">{room.nombre}</span></td>
                  <td>
                    <span className={`rooms-tag rooms-tag--${room.tipo.toLowerCase()}`}>
                      {tipoIconMap[room.tipo]}
                      {room.tipo}
                    </span>
                  </td>
                  <td>
                    <span className={`review-badge-pill ${room.estado === 'Habilitada' ? 'aprobado' : 'rechazado'}`}>
                      <span className="review-badge-dot" />
                      {room.estado}
                    </span>
                  </td>
                  <td><span className="obras-count-tag">{room.cantidad_obras}</span></td>
                  <td className="rooms-actions-cell">
                    <div className="grid-actions-row">
                      <button className="grid-action-btn" title="Ver Inventario de la Sala" onClick={() => handleViewInventory(room)}>
                        <Eye size={15} />
                      </button>
                      <button className="grid-action-btn" title="Editar Sala" onClick={() => handleOpenEdit(room)}>
                        <Edit2 size={15} />
                      </button>
                      {room.estado === 'Habilitada' && (
                        <button className="grid-action-btn grid-action-btn--danger" title="Deshabilitar Sala" onClick={() => handleAbrirDeshabilitar(room)}>
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content rooms-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRoom ? 'Editar Sala' : 'Registrar Nueva Sala'}</h2>
              <button className="modal-close-btn" onClick={() => setIsFormModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="rooms-form">
              {formError && <div className="form-error-global">{formError}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="room-codigo">Código interno</label>
                  <input
                    id="room-codigo"
                    type="text"
                    value={editingRoom ? formData.codigo : previewCodigo(formData.tipo)}
                    readOnly={!editingRoom}
                    className={editingRoom ? '' : 'codigo-preview'}
                    title={editingRoom ? '' : 'Generado automáticamente'}
                  />
                  {!editingRoom && <span className="codigo-hint">Se genera automáticamente según el tipo de espacio</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="room-nombre">Nombre de la sala <span className="required">*</span></label>
                  <input
                    id="room-nombre"
                    type="text"
                    placeholder="Ej. Sala de Exposiciones Principal"
                    value={formData.nombre}
                    onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="room-tipo">Tipo de espacio</label>
                  <select
                    id="room-tipo"
                    value={formData.tipo}
                    onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="Exhibición">Exhibición</option>
                    <option value="Almacén">Almacén</option>
                    <option value="Taller">Taller</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <div className="toggle-group">
                    <span className={`toggle-label ${formData.estado ? 'active' : ''}`}>Habilitada</span>
                    <div
                      className={`toggle-switch ${formData.estado ? 'on' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, estado: !prev.estado }))}
                    >
                      <div className="toggle-knob" />
                    </div>
                    <span className={`toggle-label ${!formData.estado ? 'active' : ''}`}>Mantenimiento</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="room-descripcion">Descripción o consideraciones técnicas</label>
                <textarea
                  id="room-descripcion"
                  rows={4}
                  placeholder="Describe el espacio, condiciones ambientales, capacidad, etc."
                  value={formData.descripcion}
                  onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsFormModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-terracota">
                  <Check size={18} />
                  <span>Guardar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeshabilitarModalOpen && salaADeshabilitar && (
        <div className="modal-overlay" onClick={() => setIsDeshabilitarModalOpen(false)}>
          <div className="rooms-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Deshabilitar Sala</h2>
              <button className="rooms-modal-close-btn" onClick={() => setIsDeshabilitarModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="rooms-form">
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {salaADeshabilitar.cantidad_obras > 0 ? (
                  <>
                    La sala <strong>"{salaADeshabilitar.nombre}"</strong> tiene <strong>{salaADeshabilitar.cantidad_obras} obra(s)</strong>.
                    Debes seleccionar una sala de destino para trasladarlas antes de deshabilitarla.
                  </>
                ) : (
                  <>¿Estás seguro de deshabilitar la sala <strong>"{salaADeshabilitar.nombre}"</strong>? No contiene obras.</>
                )}
              </p>

              {salaADeshabilitar.cantidad_obras > 0 && (
                <div>
                  <label className="form-label">Sala de destino para las obras</label>
                  <select
                    className="form-input"
                    value={salaDestinoTraslado || ''}
                    onChange={e => setSalaDestinoTraslado(Number(e.target.value))}
                  >
                    <option value="">Seleccionar sala...</option>
                    {rooms.filter(s => s.id_sala !== salaADeshabilitar.id_sala).map(s => (
                      <option key={s.id_sala} value={s.id_sala}>{s.codigo} — {s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setIsDeshabilitarModalOpen(false)} disabled={deshabilitando}>
                  Cancelar
                </button>
                <button
                  className="btn-terracota"
                  onClick={handleConfirmarDeshabilitar}
                  disabled={deshabilitando || (salaADeshabilitar.cantidad_obras > 0 && !salaDestinoTraslado)}
                >
                  {deshabilitando ? 'Deshabilitando...' : 'Deshabilitar Sala'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagementRooms
