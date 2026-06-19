import React, { useState } from 'react'
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
  QrCode,
  UploadCloud,
  FileText,
  FileAudio,
  FileImage,
  File,
  User,
  Paperclip
} from 'lucide-react'
import partituraImg from '../../assets/featured_partitura.png'
import './InventarioPatrimonial.css'

const InventarioPatrimonial = () => {
  // Mock data of initial inventory pieces
  const [inventario, setInventario] = useState([
    {
      id: 1,
      name: 'Partitura Original: Tonada de San Sebastián',
      code: 'IP-001',
      author: 'Juan R. Castañeda',
      category: 'Artesanía',
      materials: 'Papel / Tinta Ferrogálica',
      conservation: 'Excelente',
      location: 'Sala 1',
      image: partituraImg,
      linkedFiles: [101] // linked to PDF
    },
    {
      id: 2,
      name: 'Cuatro de Cedro Tallado',
      code: 'IP-002',
      author: 'Eleazar Rojas',
      category: 'Instrumentos',
      materials: 'Madera de Cedro / Cuerdas de Nylon',
      conservation: 'Excelente',
      location: 'Depósito A',
      image: null,
      linkedFiles: [102] // linked to Audio
    },
    {
      id: 3,
      name: 'Traje de Danza de Sanjuanero',
      code: 'IP-003',
      author: 'Isabel de Rivera',
      category: 'Vestimenta',
      materials: 'Lino / Encaje de Bolillos',
      conservation: 'Deteriorado',
      location: 'Depósito B',
      image: null,
      linkedFiles: []
    },
    {
      id: 4,
      name: 'Vasija de Barro Cocido',
      code: 'IP-004',
      author: 'María Sosa',
      category: 'Artesanía',
      materials: 'Arcilla roja / Engobes minerales',
      conservation: 'Restauración',
      location: 'Sala 2',
      image: null,
      linkedFiles: []
    }
  ])

  // Dynamic Options State
  const [categoriesList, setCategoriesList] = useState([
    'Artesanía',
    'Instrumentos',
    'Vestimenta'
  ])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  const handleAddCategory = () => {
    if (customCategory.trim() && !categoriesList.includes(customCategory.trim())) {
      setCategoriesList([...categoriesList, customCategory.trim()])
      setNewPieceCategory(customCategory.trim())
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

  // Form Modal Configuration & Fields State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingPieceId, setEditingPieceId] = useState(null)
  
  const [newPieceName, setNewPieceName] = useState('')
  const [newPieceCode, setNewPieceCode] = useState('')
  const [newPieceAuthor, setNewPieceAuthor] = useState('')
  const [newPieceCategory, setNewPieceCategory] = useState('Artesanía')
  const [newPieceMaterials, setNewPieceMaterials] = useState('')
  const [newPieceConservation, setNewPieceConservation] = useState('Excelente')
  const [newPieceLocation, setNewPieceLocation] = useState('Sala 1')
  const [newPieceImage, setNewPieceImage] = useState(null) // Base64 dataURL
  const [formError, setFormError] = useState('')

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

  // Filters logic
  const filteredPieces = inventario.filter(piece => {
    const matchesSearch = 
      piece.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.author.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || piece.category === selectedCategory
    const matchesConservation = selectedConservation === 'all' || piece.conservation === selectedConservation
    const matchesLocation = selectedLocation === 'all' || piece.location.startsWith(selectedLocation)

    return matchesSearch && matchesCategory && matchesConservation && matchesLocation
  })

  // Open Create Modal Handler
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingPieceId(null)
    setNewPieceName('')
    setNewPieceCode('')
    setNewPieceAuthor('')
    setNewPieceCategory('Artesanía')
    setNewPieceMaterials('')
    setNewPieceConservation('Excelente')
    setNewPieceLocation('Sala 1')
    setNewPieceImage(null)
    setFormError('')
    setIsModalOpen(true)
  }

  // Open Edit Modal Handler
  const handleOpenEditModal = (piece) => {
    setModalMode('edit')
    setEditingPieceId(piece.id)
    setNewPieceName(piece.name)
    setNewPieceCode(piece.code)
    setNewPieceAuthor(piece.author)
    setNewPieceCategory(piece.category)
    setNewPieceMaterials(piece.materials === 'No especificados' ? '' : piece.materials)
    setNewPieceConservation(piece.conservation)
    setNewPieceLocation(piece.location)
    setNewPieceImage(piece.image)
    setFormError('')
    setIsModalOpen(true)
  }

  // Handle Base64 Image upload via FileReader
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        setFormError('Por favor selecciona un archivo de imagen válido.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPieceImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit Handler for Form (Create/Edit)
  const handleRegisterPiece = (e) => {
    e.preventDefault()

    if (!newPieceName.trim() || !newPieceCode.trim() || !newPieceAuthor.trim()) {
      setFormError('Por favor completa los campos obligatorios: Obra, Código y Autor.')
      return
    }

    // Basic Code validation format IP-XXX
    const codeRegex = /^IP-\d{3,4}$/i
    if (!codeRegex.test(newPieceCode.trim())) {
      setFormError('Formato de código inválido. Debe ser IP-XXX (Ej: IP-005)')
      return
    }

    // Duplicate code check (ignoring current editing piece)
    const isDuplicate = inventario.some(p => 
      p.code.toUpperCase() === newPieceCode.trim().toUpperCase() && 
      p.id !== editingPieceId
    )
    if (isDuplicate) {
      setFormError('El código de inventario ya se encuentra registrado.')
      return
    }

    if (modalMode === 'create') {
      const newPiece = {
        id: Date.now(),
        name: newPieceName.trim(),
        code: newPieceCode.trim().toUpperCase(),
        author: newPieceAuthor.trim(),
        category: newPieceCategory,
        materials: newPieceMaterials.trim() || 'No especificados',
        conservation: newPieceConservation,
        location: newPieceLocation,
        image: newPieceImage,
        linkedFiles: []
      }
      setInventario([...inventario, newPiece])
    } else {
      setInventario(prev => prev.map(p => 
        p.id === editingPieceId 
          ? { 
              ...p, 
              name: newPieceName.trim(), 
              code: newPieceCode.trim().toUpperCase(), 
              author: newPieceAuthor.trim(), 
              category: newPieceCategory, 
              materials: newPieceMaterials.trim() || 'No especificados', 
              conservation: newPieceConservation, 
              location: newPieceLocation, 
              image: newPieceImage 
            } 
          : p
      ))
    }
    
    // Reset and close
    setNewPieceName('')
    setNewPieceCode('')
    setNewPieceAuthor('')
    setNewPieceCategory('Artesanía')
    setNewPieceMaterials('')
    setNewPieceConservation('Excelente')
    setNewPieceLocation('Sala 1')
    setNewPieceImage(null)
    setEditingPieceId(null)
    setFormError('')
    setIsModalOpen(false)
  }

  // Delete Piece Handler
  const handleDeletePiece = (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro del inventario?')) {
      setInventario(inventario.filter(p => p.id !== id))
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
      {/* 1. Cabecera de la Sección */}
      <header className="page-header">
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO</span>
            <span className="separator">&gt;</span>
            <span className="current">INVENTARIO PATRIMONIAL</span>
          </nav>
          <h1>Inventario Patrimonial</h1>
          <p className="cultor-subinfo text-light" style={{ fontSize: '14px', marginTop: '4px' }}>
            Fichas técnicas, registro multimedia y gestión de exposición cultural.
          </p>
        </div>

        <button className="btn-terracota" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          <span>Nueva Obra / Pieza</span>
        </button>
      </header>

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
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
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
            <option value="Sala">Sala</option>
            <option value="Depósito">Depósito</option>
          </select>
        </div>
      </section>

      {/* 3. Tabla de Inventario (Data Grid) */}
      <div className="card cultores-list-card">
        <div className="table-responsive">
          <table className="inventario-table">
            <thead>
              <tr>
                <th>PIEZA / OBRA</th>
                <th>AUTOR</th>
                <th>MATERIALES</th>
                <th>CONSERVACIÓN</th>
                <th>UBICACIÓN</th>
                <th>QR</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredPieces.length > 0 ? (
                filteredPieces.map((piece) => (
                  <tr key={piece.id}>
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
                        {piece.image ? (
                          <img src={piece.image} alt={piece.name} className="piece-thumbnail" />
                        ) : (
                          <div className="piece-thumbnail-placeholder">
                            <Camera size={18} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="piece-display-name">{piece.name}</span>
                          <span className="piece-code-info">{piece.code}</span>
                        </div>
                      </div>
                    </td>

                    {/* Autor */}
                    <td>
                      <span className="author-cell-text">{piece.author}</span>
                    </td>

                    {/* Materiales */}
                    <td>
                      <span className="materials-text">{piece.materials}</span>
                    </td>

                    {/* Conservación */}
                    <td>
                      <span className={`cons-badge ${piece.conservation.toLowerCase()}`}>
                        <span className="cons-badge-dot"></span>
                        {piece.conservation}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td>
                      <span className="location-text">{piece.location}</span>
                    </td>

                    {/* QR Code Icon with Hover popup */}
                    <td>
                      <div className="qr-code-cell">
                        <QrCode size={18} />
                        <div className="qr-tooltip">
                          ID Pieza: {piece.code}
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="text-right">
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
                          onClick={() => handleDeletePiece(piece.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
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
      </div>

      {/* 4. Sección de Formulario (Carga Multimedia Global) */}
      <section className="multimedia-upload-section">
        <h2 className="section-card-title">
          <UploadCloud size={18} style={{ color: '#C05640' }} />
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

      {/* 5. Paginación */}
      <footer className="pagination-footer">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="page-item-btn"
          aria-label="Anterior"
        >
          <ChevronLeft size={16} />
        </button>
        
        <button 
          onClick={() => setCurrentPage(1)}
          className={`page-number-btn ${currentPage === 1 ? 'active' : ''}`}
        >
          1
        </button>
        
        <button 
          onClick={() => setCurrentPage(2)}
          className={`page-number-btn ${currentPage === 2 ? 'active' : ''}`}
        >
          2
        </button>

        <button 
          onClick={() => setCurrentPage(3)}
          className={`page-number-btn ${currentPage === 3 ? 'active' : ''}`}
        >
          3
        </button>

        <button 
          onClick={() => setCurrentPage(prev => Math.min(3, prev + 1))}
          disabled={currentPage === 3}
          className="page-item-btn"
          aria-label="Siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </footer>

      {/* 6. Formulario Modal: Registrar / Editar Obra */}
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
                    <Camera size={15} className="field-icon-left" />
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
                    <label htmlFor="modal-piece-code">Código Inventario <span className="req-star">*</span></label>
                    <div className="icon-input-container">
                      <QrCode size={15} className="field-icon-left" />
                      <input 
                        type="text" 
                        id="modal-piece-code" 
                        placeholder="Formato: IP-XXX (Ej: IP-005)"
                        value={newPieceCode}
                        onChange={(e) => setNewPieceCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-piece-author">Cultor / Autor <span className="req-star">*</span></label>
                    <div className="icon-input-container">
                      <User size={15} className="field-icon-left" />
                      <input 
                        type="text" 
                        id="modal-piece-author" 
                        placeholder="Ej. Eleazar Rojas"
                        value={newPieceAuthor}
                        onChange={(e) => setNewPieceAuthor(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Category and Location Row */}
                <div className="fields-split-row">
                  <div className="input-box-field">
                    <label htmlFor="modal-piece-category">Categoría</label>
                    <div className="icon-input-container" style={{ display: 'flex', gap: '8px' }}>
                      {isAddingCategory ? (
                        <>
                          <input 
                            type="text" 
                            placeholder="Nueva categoría..." 
                            value={customCategory} 
                            onChange={(e) => setCustomCategory(e.target.value)} 
                            style={{ flex: 1 }}
                            autoFocus
                          />
                          <button type="button" className="btn-terracota" onClick={handleAddCategory} style={{ padding: '0 10px', height: '100%', borderRadius: '6px' }}>✓</button>
                          <button type="button" className="btn-secondary" onClick={() => setIsAddingCategory(false)} style={{ padding: '0 10px', height: '100%', borderRadius: '6px' }}>✕</button>
                        </>
                      ) : (
                        <>
                          <select 
                            id="modal-piece-category"
                            value={newPieceCategory}
                            onChange={(e) => setNewPieceCategory(e.target.value)}
                            style={{ flex: 1 }}
                          >
                            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button type="button" className="btn-terracota" onClick={() => setIsAddingCategory(true)} style={{ padding: '0 10px', height: '100%', borderRadius: '6px' }} title="Añadir categoría">
                            <Plus size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-piece-location">Ubicación</label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-piece-location"
                        value={newPieceLocation}
                        onChange={(e) => setNewPieceLocation(e.target.value)}
                      >
                        <option value="Sala 1">Sala 1</option>
                        <option value="Sala 2">Sala 2</option>
                        <option value="Depósito A">Depósito A</option>
                        <option value="Depósito B">Depósito B</option>
                      </select>
                    </div>
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
                {selectedPieceForView.image ? (
                  <img src={selectedPieceForView.image} alt={selectedPieceForView.name} className="dossier-featured-img" />
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
                  <h3 style={{ fontSize: '15px' }}>{selectedPieceForView.name}</h3>
                  <span className="dossier-sub">Código Inventario: <strong>{selectedPieceForView.code}</strong></span>
                </div>
                <div>
                  <span className={`cons-badge ${selectedPieceForView.conservation.toLowerCase()}`}>
                    <span className="cons-badge-dot"></span>
                    {selectedPieceForView.conservation}
                  </span>
                </div>
              </div>

              {/* Detailed Grid */}
              <div className="dossier-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Autor / Cultor Asociado:</span>
                  <span className="dossier-value">{selectedPieceForView.author}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Categoría de Manifestación:</span>
                  <span className="dossier-value">{selectedPieceForView.category}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Materiales / Elementos:</span>
                  <span className="dossier-value">{selectedPieceForView.materials}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Ubicación Física:</span>
                  <span className="dossier-value">{selectedPieceForView.location}</span>
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
                          <span className="dot" style={{ backgroundColor: '#C05640' }}></span>
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
    </div>
  )
}

export default InventarioPatrimonial
