import React, { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'
import {
  Search,
  Plus,
  X,
  Edit2,
  Trash2,
  Camera,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  FileAudio,
  FileImage,
  File,
  User,
  Paperclip,
  Eye,
  EyeOff
} from 'lucide-react'
import partituraImg from '../../assets/featured_partitura.png'
import './InventarioPatrimonial.css'
import { 
  getObrasAdminRequest,
  createObraRequest,
  updateObraRequest,
  deleteObraRequest,
  deleteObraWithPasswordRequest,
  getCultoresAprobadosRequest,
  getCategoriasRequest,
  createCategoriaRequest,
  uploadMultimediaRequest,
  getSalasRequest
} from '../../services/api'
import { useToast } from '../../context/ToastContext'

const InventarioPatrimonial = () => {
  const { showToast } = useToast()
  const token = localStorage.getItem('auth-token')
  
  const [inventario, setInventario] = useState([])
  const [categoriesList, setCategoriesList] = useState([])
  const [cultoresList, setCultoresList] = useState([])
  const [salasList, setSalasList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  const [isStandaloneCategoryModalOpen, setIsStandaloneCategoryModalOpen] = useState(false)
  const [standaloneCategoryName, setStandaloneCategoryName] = useState('')
  const [standaloneCategoryDescripcion, setStandaloneCategoryDescripcion] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (salasList.length > 0) {
      setNewPieceLocation(salasList[0].nombre)
    }
  }, [salasList])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [obras, cultores, categorias, salas] = await Promise.all([
        getObrasAdminRequest(token).catch(() => []),
        getCultoresAprobadosRequest(token).catch(() => []),
        getCategoriasRequest().catch(() => []),
        getSalasRequest(token).catch(() => [])
      ])
      setInventario(obras)
      setCultoresList(cultores)
      setCategoriesList(categorias)
      setSalasList(salas)
    } catch (err) {
      console.error('Error al cargar datos de inventario:', err)
      setError('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (customCategory.trim()) {
      try {
        const nuevaCat = await createCategoriaRequest(customCategory.trim(), null, token)
        setCategoriesList(prev => [...prev, nuevaCat])
        setNewPieceCategory(nuevaCat.id_categoria)
      } catch (err) {
        showAlert('Error al añadir la categoría: ' + err.message)
      }
    }
    setCustomCategory('')
    setIsAddingCategory(false)
  }

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedConservation, setSelectedConservation] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Form Modal Configuration & Fields State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingPieceId, setEditingPieceId] = useState(null)
  
  const [newPieceName, setNewPieceName] = useState('')
  const [newPieceCode, setNewPieceCode] = useState('')
  const [newPieceAuthor, setNewPieceAuthor] = useState('')
  const [newPieceCategory, setNewPieceCategory] = useState('')
  const [newPieceMaterials, setNewPieceMaterials] = useState('')
  const [newPieceYear, setNewPieceYear] = useState('')
  const [newPieceConservation, setNewPieceConservation] = useState('Excelente')
  const [newPieceLocation, setNewPieceLocation] = useState('Sala 1')
  const [newPieceImage, setNewPieceImage] = useState(null)
  const [newPieceImageFile, setNewPieceImageFile] = useState(null)
  const [formError, setFormError] = useState('')

  // Modal de confirmación personalizado (reemplaza window.confirm)
  const [confirmDialog, setConfirmDialog] = useState(null) // { message, onConfirm }
  const showConfirm = (message, onConfirm) => setConfirmDialog({ message, onConfirm })
  const handleConfirmYes = () => { const fn = confirmDialog?.onConfirm; setConfirmDialog(null); fn && fn() }
  const handleConfirmNo  = () => setConfirmDialog(null)

  // Modal de alerta personalizado (reemplaza alert)
  const [alertDialog, setAlertDialog] = useState(null) // { message, isError }
  const showAlert = (message, isError = true) => setAlertDialog({ message, isError })

  // Modal de verificación de contraseña para eliminar obra
  const [passwordDialog, setPasswordDialog] = useState(null) // { id_obra, titulo }
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deletePasswordError, setDeletePasswordError] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  // View Dossier (Expediente Técnico) Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPieceForView, setSelectedPieceForView] = useState(null)

  // Link Media Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedPieceForLinking, setSelectedPieceForLinking] = useState(null)

  // Drag-and-Drop / Global Uploader State
  const [dragging, setDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 101, name: 'registro_partitura_scan.pdf', size: '4.82 MB', type: 'pdf' },
    { id: 102, name: 'audio_cuatro_prueba.wav', size: '12.40 MB', type: 'audio' }
  ])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, selectedCategory, selectedConservation, selectedLocation])

  // Filters logic
  const filteredPieces = (inventario || []).filter(piece => {
    const matchesSearch = 
      (piece.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (piece.cultor?.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (piece.cultor?.apellido || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || String(piece.id_categoria) === String(selectedCategory)
    const matchesConservation = selectedConservation === 'all' || piece.estado_conservacion === selectedConservation
    const matchesLocation = selectedLocation === 'all' || (piece.ubicacion_actual || '').startsWith(selectedLocation)

    return matchesSearch && matchesCategory && matchesConservation && matchesLocation
  })

  const totalPages = Math.ceil(filteredPieces.length / itemsPerPage)
  const paginatedPieces = filteredPieces.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Open Create Modal Handler
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingPieceId(null)
    setNewPieceName('')
    setNewPieceCode('')
    setNewPieceAuthor(cultoresList[0]?.id_cultor || '')
    setNewPieceCategory(categoriesList[0]?.id_categoria || '')
    setNewPieceMaterials('')
    setNewPieceYear('')
    setNewPieceConservation('Excelente')
    setNewPieceLocation('Sala 1')
    setNewPieceImage(null)
    setNewPieceImageFile(null)
    setFormError('')
    setIsModalOpen(true)
  }

  // Cambia el estado de conservación directamente desde la ficha técnica (sin tener
  // que cerrarla y abrir el modal de edición completo).
  const handleCambiarConservacion = async (idObra, nuevoValor) => {
    try {
      await updateObraRequest(idObra, { estado_conservacion: nuevoValor }, token)
      setSelectedPieceForView(prev => prev ? { ...prev, estado_conservacion: nuevoValor } : prev)
      setInventario(prev => prev.map(p => p.id_obra === idObra ? { ...p, estado_conservacion: nuevoValor } : p))
    } catch (err) {
      showAlert('No se pudo actualizar el estado de conservación: ' + err.message)
    }
  }

  // Open Edit Modal Handler
  const handleOpenEditModal = (piece) => {
    setModalMode('edit')
    setEditingPieceId(piece.id_obra)
    setNewPieceName(piece.titulo || '')
    setNewPieceCode(piece.codigo_qr_link || '')
    setNewPieceAuthor(piece.id_cultor || '')
    setNewPieceCategory(piece.id_categoria || '')
    setNewPieceMaterials(piece.materiales_utilizados === 'No especificados' ? '' : (piece.materiales_utilizados || ''))
    setNewPieceYear(piece.anio_creacion || '')
    setNewPieceConservation(piece.estado_conservacion || 'Excelente')
    setNewPieceLocation(piece.ubicacion_actual || 'Sala 1')
    setNewPieceImage(piece.multimedia && piece.multimedia[0] ? piece.multimedia[0].url_archivo : null)
    setNewPieceImageFile(null)
    setFormError('')
    setIsModalOpen(true)
  }

  // Handle Image upload selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        setFormError('Por favor selecciona un archivo de imagen válido.')
        return
      }
      setNewPieceImageFile(file)
      setNewPieceImage(URL.createObjectURL(file))
    }
  }

  // Submit Handler for Form (Create/Edit)
  const handleRegisterPiece = async (e) => {
    e.preventDefault()

    if (!newPieceName.trim() || !newPieceAuthor || !newPieceCategory) {
      setFormError('Por favor completa los campos obligatorios: Obra, Autor y Categoría.')
      return
    }

    const selectedCultor = cultoresList.find(c => String(c.id_cultor) === String(newPieceAuthor))
    if (!selectedCultor?.id_parroquia) {
      setFormError('El cultor seleccionado no tiene parroquia asignada en su perfil. Complétala antes de registrar la obra.')
      return
    }
    // La web pública (Gallery.jsx, Eventos.jsx, etc.) muestra tipo_patrimonio como si
    // fuera la categoría de la obra — así que aquí se sincroniza con el nombre real de
    // la categoría elegida, en vez de mandar un valor fijo que no tenía relación con ella.
    const categoriaSeleccionada = categoriesList.find(c => String(c.id_categoria) === String(newPieceCategory))

    const payload = {
      titulo: newPieceName.trim(),
      id_cultor: newPieceAuthor ? parseInt(newPieceAuthor, 10) : null,
      id_categoria: newPieceCategory ? parseInt(newPieceCategory, 10) : null,
      id_parroquia: selectedCultor ? selectedCultor.id_parroquia : null,
      tipo_patrimonio: categoriaSeleccionada?.nombre || null,
      materiales_utilizados: newPieceMaterials.trim() || 'No especificados',
      anio_creacion: newPieceYear ? parseInt(newPieceYear, 10) : null,
      estado_conservacion: newPieceConservation,
      ubicacion_actual: newPieceLocation
    }

    if (modalMode === 'edit') {
      payload.codigo_qr_link = newPieceCode.trim().toUpperCase()
    }

    try {
      let savedObra
      if (modalMode === 'create') {
        savedObra = await createObraRequest(payload, token)
      } else {
        savedObra = await updateObraRequest(editingPieceId, payload, token)
      }

      // Si hay archivo de imagen seleccionado, subirlo
      if (newPieceImageFile) {
        const formData = new FormData()
        formData.append('archivo', newPieceImageFile)
        formData.append('id_obra', savedObra.id_obra)
        formData.append('tipo_archivo', 'imagen')
        formData.append('es_portada', 'si')
        await uploadMultimediaRequest(formData, token)
      }

      await cargarDatos()

      // Reset and close
      const obraTitulo = newPieceName.trim()
      const modoGuardado = modalMode
      setNewPieceName('')
      setNewPieceCode('')
      setNewPieceAuthor(cultoresList[0]?.id_cultor || '')
      setNewPieceCategory(categoriesList[0]?.id_categoria || '')
      setNewPieceMaterials('')
      setNewPieceYear('')
      setNewPieceConservation('Excelente')
      setNewPieceLocation('Sala 1')
      setNewPieceImage(null)
      setNewPieceImageFile(null)
      setEditingPieceId(null)
      setFormError('')
      setIsModalOpen(false)
      showToast({
        titulo: modoGuardado === 'create' ? '¡Obra registrada con éxito!' : '¡Obra actualizada con éxito!',
        mensaje: `"${obraTitulo}" ${modoGuardado === 'create' ? 'fue incorporada al inventario patrimonial.' : 'fue guardada correctamente en el inventario.'}`,
        tipo: 'success',
      })
    } catch (err) {
      setFormError(err.message || 'Error al guardar la obra.')
    }
  }

  // Delete Piece Handler — pide contraseña del administrador
  const handleDeletePiece = (piece) => {
    setDeletePassword('')
    setDeletePasswordError('')
    setPasswordDialog({ id_obra: piece.id_obra, titulo: piece.titulo })
  }

  const handleConfirmPasswordDelete = async () => {
    if (!deletePassword.trim()) {
      setDeletePasswordError('Debes ingresar tu contraseña.')
      return
    }
    setDeleteLoading(true)
    setDeletePasswordError('')
    try {
      await deleteObraWithPasswordRequest(passwordDialog.id_obra, deletePassword, token)
      await cargarDatos()
      setPasswordDialog(null)
      setDeletePassword('')
      showToast({ titulo: '¡Obra eliminada con éxito!', mensaje: `"${passwordDialog.titulo}" fue eliminada del inventario patrimonial.`, tipo: 'success' })
    } catch (err) {
      setDeletePasswordError(err.message || 'Contraseña incorrecta.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Open Link Media modal
  const handleOpenLinkModal = (piece) => {
    setSelectedPieceForLinking(piece)
    setIsLinkModalOpen(true)
  }

  // Toggle file link connection
  const handleToggleFileLink = (fileId) => {
    if (!selectedPieceForLinking) return
    const isLinked = selectedPieceForLinking.linkedFiles && selectedPieceForLinking.linkedFiles.includes(fileId)
    
    let updatedLinkedFiles = []
    if (isLinked) {
      updatedLinkedFiles = selectedPieceForLinking.linkedFiles.filter(id => id !== fileId)
    } else {
      updatedLinkedFiles = [...(selectedPieceForLinking.linkedFiles || []), fileId]
    }

    // Save to local selection state
    setSelectedPieceForLinking({
      ...selectedPieceForLinking,
      linkedFiles: updatedLinkedFiles
    })

    // Update in inventory state list
    setInventario(prev => prev.map(p => 
      p.id === selectedPieceForLinking.id ? { ...p, linkedFiles: updatedLinkedFiles } : p
    ))
  }

  // Drag-and-Drop Uploader functions
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).map(file => {
        let type = 'file'
        if (file.type.includes('pdf')) type = 'pdf'
        else if (file.type.includes('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) type = 'audio'
        else if (file.type.includes('image')) type = 'image'

        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type
        }
      })
      setUploadedFiles([...uploadedFiles, ...files])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(file => {
        let type = 'file'
        if (file.type.includes('pdf')) type = 'pdf'
        else if (file.type.includes('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) type = 'audio'
        else if (file.type.includes('image')) type = 'image'

        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type
        }
      })
      setUploadedFiles([...uploadedFiles, ...files])
    }
  }

  const handleRemoveFile = (id) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id))
    // Clean links references in inventario pieces
    setInventario(prev => prev.map(p => ({
      ...p,
      linkedFiles: p.linkedFiles ? p.linkedFiles.filter(fid => fid !== id) : []
    })))
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText size={18} />
      case 'audio':
        return <FileAudio size={18} />
      case 'image':
        return <FileImage size={18} />
      default:
        return <File size={18} />
    }
  }

  return (
    <div className="inventario-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO' },
          { label: 'INVENTARIO PATRIMONIAL', active: true },
        ]}
        title="Inventario Patrimonial"
        description="Fichas técnicas, registro multimedia y gestión de exposición cultural."
        actionButton={
          <div className="inventario-header-actions">
            <button className="ph-action-btn ph-action-btn-secondary" onClick={() => setIsStandaloneCategoryModalOpen(true)}>
              <FolderOpen size={16} />
              <span>Nueva Categoría</span>
            </button>
            <button className="ph-action-btn" onClick={handleOpenCreateModal}>
              <Plus size={16} />
              <span>Nueva Obra / Pieza</span>
            </button>
          </div>
        }
      />

      {/* 2. Barra de Filtros y Búsqueda */}
      <section className="filter-bar-card">
        {/* Input de Búsqueda */}
        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, código de inventario o autor..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
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

        {/* Selectors */}
        <div className="selectors-wrapper">
          <select 
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-dropdown-select"
          >
            <option value="all">Categoría de Manifestación</option>
            {categoriesList.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>

          <select 
            value={selectedConservation}
            onChange={(e) => {
              setSelectedConservation(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-dropdown-select"
          >
            <option value="all">Estado de Conservación</option>
            <option value="Excelente">Excelente</option>
            <option value="Deteriorado">Deteriorado</option>
            <option value="Restauración">Restauración</option>
          </select>

          <select 
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-dropdown-select"
          >
            <option value="all">Ubicación</option>
            {salasList.map(s => (
              <option key={s.id_sala} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>
      </section>

      {/* 3. Tabla de Inventario (Data Grid) */}
      <div className="card cultores-list-card">
        <div className="table-responsive">
          <table className="inventario-table">
            <thead>
              <tr>
                <th className="whitespace-nowrap">PIEZA / OBRA</th>
                <th className="whitespace-nowrap">AUTOR</th>
                <th className="whitespace-nowrap">MATERIALES</th>
                <th className="whitespace-nowrap">CONSERVACIÓN</th>
                <th className="whitespace-nowrap">UBICACIÓN</th>
                <th className="text-right whitespace-nowrap">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPieces.length > 0 ? (
                paginatedPieces.map((piece) => {
                  const coverImage = piece.multimedia && piece.multimedia[0] ? piece.multimedia[0].url_archivo : null;
                  return (
                    <tr key={piece.id_obra}>
                      {/* Pieza Obra (Thumbnail + Name) */}
                      <td>
                        <div 
                          className="piece-profile-cell"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedPieceForView(piece)
                            setIsViewModalOpen(true)
                          }}
                          title="Ver ficha técnica"
                        >
                          {coverImage ? (
                            <img src={coverImage} alt={piece.titulo} className="piece-thumbnail" />
                          ) : (
                            <div className="piece-thumbnail-placeholder">
                              <Camera size={18} />
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="piece-display-name">{piece.titulo}</span>
                            <span className="piece-code-info">{piece.codigo_qr_link}</span>
                          </div>
                        </div>
                      </td>

                      {/* Autor */}
                      <td>
                        <span className="author-cell-text">
                          {piece.cultor ? `${piece.cultor.primer_nombre} ${piece.cultor.primer_apellido}` : 'No asignado'}
                        </span>
                      </td>

                      {/* Materiales */}
                      <td>
                        <span className="materials-text">{piece.materiales_utilizados || 'No especificados'}</span>
                      </td>

                      {/* Conservación */}
                      <td>
                        {(() => {
                          const conservacion = piece.estado_conservacion || 'Excelente'
                          return (
                            <span className={`cons-badge ${conservacion.toLowerCase()}`}>
                              <span className="cons-badge-dot"></span>
                              {conservacion}
                            </span>
                          )
                        })()}
                      </td>

                      {/* Ubicación */}
                      <td>
                        <span className="location-text">{piece.ubicacion_actual || 'Sala 1'}</span>
                      </td>

                      {/* Acciones */}
                      <td className="text-right whitespace-nowrap">
                        <div className="grid-actions-row">
                          <button 
                            className="grid-action-btn" 
                            title="Ver Expediente Técnico"
                            onClick={() => {
                              setSelectedPieceForView(piece)
                              setIsViewModalOpen(true)
                            }}
                          >
                            <FolderOpen size={16} />
                          </button>
                          <button 
                            className="grid-action-btn" 
                            title="Editar Ficha"
                            onClick={() => handleOpenEditModal(piece)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            className="grid-action-btn" 
                            title="Vincular Multimedia"
                            onClick={() => handleOpenLinkModal(piece)}
                          >
                            <Paperclip size={15} />
                          </button>
                          <button 
                            className="grid-action-btn delete-btn" 
                            title="Eliminar Registro"
                            onClick={() => handleDeletePiece(piece)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-grid-state">
                      <Camera size={40} />
                      <p className="empty-grid-title">No se encontraron piezas patrimoniales</p>
                      <p className="empty-grid-desc">Intente ajustar los parámetros de búsqueda o filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <footer className="pagination-footer">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="page-item-btn"
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`page-number-btn ${currentPage === p ? 'active' : ''}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="page-item-btn"
              aria-label="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </footer>
        )}
      </div>

      {/* 4. Sección de Formulario (Carga Multimedia Global) */}
      <section className="multimedia-upload-section">
        <h2 className="section-card-title">
          <UploadCloud size={18} style={{ color: '#B4533C' }} />
          <span>Gestión de Carga Multimedia Patrimonial</span>
        </h2>

        {/* Drag and Drop Zone */}
        <div 
          className={`upload-drag-drop-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('multimedia-file-picker').click()}
        >
          <input 
            type="file" 
            id="multimedia-file-picker" 
            style={{ display: 'none' }} 
            multiple 
            onChange={handleFileSelect}
          />
          <div className="upload-icon-circle">
            <UploadCloud size={24} />
          </div>
          <p className="upload-instruction-text">
            Arrastra archivos multimedia aquí o <span>haz clic para buscar</span>
          </p>
          <p className="upload-subtext">
            Formatos admitidos: Fotos (JPG/PNG), Audios (MP3/WAV), Documentos (PDF) hasta 20MB.
          </p>
        </div>

        {/* Uploaded Files Grid */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            {uploadedFiles.map(file => (
              <div className="file-preview-card" key={file.id}>
                <div className="upload-icon-circle" style={{ width: '30px', height: '30px', backgroundColor: '#f1f0ee', color: '#807471', flexShrink: 0 }}>
                  {getFileIcon(file.type)}
                </div>
                <div className="file-info">
                  <span className="file-name-txt" title={file.name}>{file.name}</span>
                  <span className="file-size-txt">{file.size}</span>
                </div>
                <button 
                  className="file-remove-btn" 
                  title="Quitar archivo"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file.id);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Formulario Modal: Registrar / Editar Obra */}
      {isModalOpen && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card">
            {/* Header */}
            <div className="modal-box-header">
              <h2>{modalMode === 'create' ? 'Registrar Nueva Obra / Pieza' : 'Editar Ficha Técnica'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterPiece}>
              <div className="modal-box-body">
                {formError && (
                  <div className="error-banner-group">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="input-box-field">
                  <label htmlFor="modal-piece-name">Nombre de la Obra / Pieza <span className="req-star">*</span></label>
                  <div className="icon-input-container">
                    <input 
                      type="text" 
                      id="modal-piece-name" 
                      placeholder="Ej. Cuatro de Cedro Tallado"
                      value={newPieceName}
                      onChange={(e) => setNewPieceName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Code and Author Row */}
                <div className="fields-split-row">
                  <div className="input-box-field">
                    <label htmlFor="modal-piece-code">Código Inventario</label>
                    <div className="icon-input-container">
                      <input 
                        type="text" 
                        id="modal-piece-code" 
                        placeholder="Generación Automática"
                        value={modalMode === 'create' ? 'Generación Automática' : newPieceCode}
                        disabled
                        style={{ backgroundColor: '#f5f4f0', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-piece-author">Cultor / Autor <span className="req-star">*</span></label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-piece-author" 
                        value={newPieceAuthor}
                        onChange={(e) => setNewPieceAuthor(e.target.value)}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccione un cultor</option>
                        {cultoresList.map(c => (
                          <option key={c.id_cultor} value={c.id_cultor}>
                            {c.primer_nombre} {c.primer_apellido}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Chip de ubicación heredada del cultor */}
                    {(() => {
                      const cultorSel = cultoresList.find(c => String(c.id_cultor) === String(newPieceAuthor))
                      const parroquia = cultorSel?.parroquia?.nombre
                      const municipio = cultorSel?.parroquia?.municipio?.nombre
                      if (!municipio && !parroquia) return null
                      return (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                          <span>Ubicación asignada automáticamente: <strong>{[parroquia, municipio].filter(Boolean).join(', ')}</strong></span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                {/* Category and Location Row */}
                <div className="fields-split-row">
                  <div className="input-box-field">
                    <label htmlFor="modal-piece-category">Categoría <span className="req-star">*</span></label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-piece-category"
                        value={newPieceCategory}
                        onChange={(e) => setNewPieceCategory(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccione una categoría</option>
                        {categoriesList.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-piece-location">Ubicación</label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-piece-location"
                        value={newPieceLocation}
                        onChange={(e) => setNewPieceLocation(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        {salasList.length > 0 ? salasList.map(s => (
                          <option key={s.id_sala} value={s.nombre}>{s.nombre}</option>
                        )) : (
                          <option value="Sala 1">Sala 1</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Año de creación */}
                <div className="input-box-field">
                  <label htmlFor="modal-piece-year">Año de Creación</label>
                  <div className="icon-input-container">
                    <input
                      type="number"
                      id="modal-piece-year"
                      placeholder={String(new Date().getFullYear())}
                      value={newPieceYear}
                      onChange={(e) => setNewPieceYear(e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                {/* Conservation and Materials Row */}
                <div className="fields-split-row">
                  <div className="input-box-field">
                    <label htmlFor="modal-piece-conservation">Estado de Conservación</label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-piece-conservation"
                        value={newPieceConservation}
                        onChange={(e) => setNewPieceConservation(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="Excelente">Excelente</option>
                        <option value="Deteriorado">Deteriorado</option>
                        <option value="Restauración">Restauración</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-piece-materials">Materiales</label>
                    <div className="icon-input-container">
                      <input 
                        type="text" 
                        id="modal-piece-materials" 
                        placeholder="Ej. Madera de Cedro, Lino"
                        value={newPieceMaterials}
                        onChange={(e) => setNewPieceMaterials(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Foto / Imagen de la obra */}
                <div className="input-box-field">
                  <label>Fotografía de la Obra / Pieza</label>
                  <div className="dossier-image-upload-wrapper">
                    {newPieceImage ? (
                      <div className="image-form-preview">
                        <img src={newPieceImage} alt="Vista previa de la obra" />
                        <button 
                          type="button" 
                          className="remove-img-form-btn"
                          onClick={() => setNewPieceImage(null)}
                        >
                          Quitar Foto
                        </button>
                      </div>
                    ) : (
                      <div className="image-form-placeholder" onClick={() => document.getElementById('piece-image-file').click()}>
                        <Camera size={20} />
                        <span>Haga clic para seleccionar una foto</span>
                        <input 
                          type="file" 
                          id="piece-image-file" 
                          accept="image/*" 
                          style={{ display: 'none' }}
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-box-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-terracota">
                  {modalMode === 'create' ? 'Registrar Pieza' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal de Nueva Categoría (Standalone) */}
      {isStandaloneCategoryModalOpen && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card" style={{ maxWidth: '400px' }}>
            <div className="modal-box-header">
              <h2>Añadir Nueva Categoría</h2>
              <button 
                onClick={() => setIsStandaloneCategoryModalOpen(false)}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-box-body">
              <div className="input-box-field">
                <label htmlFor="standalone-category-name">Nombre de la Categoría <span className="req-star">*</span></label>
                <div className="icon-input-container">
                  <FolderOpen size={15} className="field-icon-left" />
                  <input
                    type="text"
                    id="standalone-category-name"
                    placeholder="Ej. Fotografía Histórica"
                    value={standaloneCategoryName}
                    onChange={(e) => setStandaloneCategoryName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="input-box-field" style={{ marginTop: '16px' }}>
                <label htmlFor="standalone-category-descripcion">Descripción</label>
                <div className="icon-input-container">
                  <textarea
                    id="standalone-category-descripcion"
                    placeholder="Breve descripción de la categoría (opcional)"
                    value={standaloneCategoryDescripcion}
                    onChange={(e) => setStandaloneCategoryDescripcion(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="modal-box-footer">
              <button type="button" className="btn-secondary" onClick={() => { setIsStandaloneCategoryModalOpen(false); setStandaloneCategoryName(''); setStandaloneCategoryDescripcion(''); }}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-terracota"
                onClick={async () => {
                  if (standaloneCategoryName.trim()) {
                    try {
                      const nuevaCat = await createCategoriaRequest(standaloneCategoryName.trim(), standaloneCategoryDescripcion.trim(), token);
                      setCategoriesList([...categoriesList, nuevaCat]);
                    } catch (err) {
                      showAlert('Error al crear categoría: ' + err.message);
                    }
                  }
                  setStandaloneCategoryName('');
                  setStandaloneCategoryDescripcion('');
                  setIsStandaloneCategoryModalOpen(false);
                }}
              >
                Guardar Categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Vista: Expediente Técnico Detallado */}
      {isViewModalOpen && selectedPieceForView && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card dossier-modal">
            {/* Header */}
            <div className="modal-box-header">
              <h2>Expediente Técnico Patrimonial</h2>
              <button 
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedPieceForView(null)
                }}
                className="close-x-btn"
                aria-label="Cerrar expediente"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="modal-box-body">
              {/* Image Banner */}
              <div className="dossier-image-banner">
                {selectedPieceForView.multimedia && selectedPieceForView.multimedia[0] ? (
                  <img src={selectedPieceForView.multimedia[0].url_archivo} alt={selectedPieceForView.titulo} className="dossier-featured-img" />
                ) : (
                  <div className="dossier-no-image">
                    <Camera size={32} />
                    <span>Sin registro fotográfico</span>
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="dossier-profile-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                <div className="dossier-profile-meta">
                  <h3 style={{ fontSize: '15px' }}>{selectedPieceForView.titulo}</h3>
                  <span className="dossier-sub">Código Inventario: <strong>{selectedPieceForView.codigo_qr_link}</strong></span>
                </div>
                <div>
                  {(() => {
                    const conservacion = selectedPieceForView.estado_conservacion || 'Excelente'
                    return (
                      <span className={`cons-badge ${conservacion.toLowerCase()}`}>
                        <span className="cons-badge-dot"></span>
                        <select
                          value={conservacion}
                          onChange={(e) => handleCambiarConservacion(selectedPieceForView.id_obra, e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}
                        >
                          <option value="Excelente">Excelente</option>
                          <option value="Deteriorado">Deteriorado</option>
                          <option value="Restauración">Restauración</option>
                        </select>
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Detailed Grid */}
              <div className="dossier-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Autor / Cultor Asociado:</span>
                  <span className="dossier-value">
                    {selectedPieceForView.cultor ? `${selectedPieceForView.cultor.primer_nombre} ${selectedPieceForView.cultor.primer_apellido}` : 'No asignado'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Categoría de Manifestación:</span>
                  <span className="dossier-value">
                    {selectedPieceForView.categoria ? selectedPieceForView.categoria.nombre : 'No asignada'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Materiales / Elementos:</span>
                  <span className="dossier-value">{selectedPieceForView.materiales_utilizados || 'No especificados'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Ubicación Física:</span>
                  <span className="dossier-value">{selectedPieceForView.ubicacion_actual || 'Sala 1'}</span>
                </div>
              </div>

              {/* Connected Multimedia */}
              <div className="checkboxes-box-panel">
                <span className="checkboxes-box-title">Documentación & Soportes Multimedia Vinculados</span>
                <div className="dossier-document-row">
                  {selectedPieceForView.linkedFiles && selectedPieceForView.linkedFiles.length > 0 ? (
                    selectedPieceForView.linkedFiles.map(fileId => {
                      const file = uploadedFiles.find(f => f.id === fileId)
                      if (!file) return null
                      return (
                        <div key={file.id} className="doc-status-item verified">
                          <span className="dot" style={{ backgroundColor: '#B4533C' }}></span>
                          <span>{file.name} ({file.size})</span>
                        </div>
                      )
                    })
                  ) : (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No hay archivos multimedia vinculados a esta pieza. Utiliza el ícono de vinculación en la tabla para asociar soportes.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-box-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedPieceForView(null)
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal de Vinculación de Multimedia */}
      {isLinkModalOpen && selectedPieceForLinking && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card">
            {/* Header */}
            <div className="modal-box-header">
              <h2>Vincular Soportes Multimedia</h2>
              <button 
                onClick={() => {
                  setIsLinkModalOpen(false)
                  setSelectedPieceForLinking(null)
                }}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Link Body */}
            <div className="modal-box-body">
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Selecciona los archivos de la biblioteca multimedia global que deseas vincular al expediente técnico de: <strong>{selectedPieceForLinking.name}</strong>.
              </p>

              {/* Scrollable list */}
              <div className="linking-scroll-panel">
                {uploadedFiles.length > 0 ? (
                  uploadedFiles.map(file => {
                    const isLinked = selectedPieceForLinking.linkedFiles && selectedPieceForLinking.linkedFiles.includes(file.id)
                    return (
                      <label key={file.id} className="linking-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={isLinked}
                          onChange={() => handleToggleFileLink(file.id)}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getFileIcon(file.type)}
                          <span>{file.name}</span>
                        </span>
                        <span className="file-size">{file.size}</span>
                      </label>
                    )
                  })
                ) : (
                  <div className="empty-grid-state" style={{ padding: '24px 0' }}>
                    <UploadCloud size={32} />
                    <p className="empty-grid-title" style={{ fontSize: '13px' }}>No hay archivos multimedia cargados</p>
                    <p className="empty-grid-desc" style={{ fontSize: '11px' }}>Sube archivos primero en el panel multimedia general.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-box-footer">
              <button 
                type="button" 
                className="btn-terracota" 
                onClick={() => {
                  setIsLinkModalOpen(false)
                  setSelectedPieceForLinking(null)
                }}
              >
                Listo / Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmación (reemplaza window.confirm) ─── */}
      {confirmDialog && (
        <div className="custom-dialog-overlay" onClick={handleConfirmNo}>
          <div className="custom-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="custom-dialog-icon warning">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="custom-dialog-content">
              <h3 className="custom-dialog-title">Confirmar eliminación</h3>
              <p className="custom-dialog-message">{confirmDialog.message}</p>
            </div>
            <div className="custom-dialog-actions">
              <button className="custom-dialog-btn secondary" onClick={handleConfirmNo}>
                Cancelar
              </button>
              <button className="custom-dialog-btn danger" onClick={handleConfirmYes}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Alerta/Error (reemplaza alert) ─────────── */}
      {alertDialog && (
        <div className="custom-dialog-overlay" onClick={() => setAlertDialog(null)}>
          <div className="custom-dialog-box" onClick={e => e.stopPropagation()}>
            <div className={`custom-dialog-icon ${alertDialog.isError ? 'error' : 'info'}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="custom-dialog-content">
              <h3 className="custom-dialog-title">{alertDialog.isError ? 'Ha ocurrido un error' : 'Aviso'}</h3>
              <p className="custom-dialog-message">{alertDialog.message}</p>
            </div>
            <div className="custom-dialog-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="custom-dialog-btn primary" onClick={() => setAlertDialog(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Verificación de Contraseña para Eliminar ─── */}
      {passwordDialog && (
        <div className="custom-dialog-overlay" onClick={() => { setPasswordDialog(null); setDeletePassword(''); setDeletePasswordError('') }}>
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
                Ingresa tu contraseña de administrador para confirmar la eliminación de <strong>"{passwordDialog.titulo}"</strong>. Esta acción no se puede deshacer.
              </p>
              <div className="input-box-field" style={{ marginBottom: '0' }}>
                <label htmlFor="delete-admin-password">Contraseña</label>
                <div className="icon-input-container">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    id="delete-admin-password"
                    placeholder="••••••••"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError('') }}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter' && !deleteLoading) handleConfirmPasswordDelete() }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowDeletePassword(prev => !prev)}
                    aria-label={showDeletePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8B5A2B', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {deletePasswordError && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{deletePasswordError}</p>
                )}
              </div>
            </div>
            <div className="custom-dialog-actions">
              <button className="custom-dialog-btn secondary" onClick={() => { setPasswordDialog(null); setDeletePassword(''); setDeletePasswordError('') }}>
                Cancelar
              </button>
              <button className="custom-dialog-btn danger" onClick={handleConfirmPasswordDelete} disabled={deleteLoading}>
                {deleteLoading ? (
                  'Verificando...'
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    Eliminar obra
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default InventarioPatrimonial
