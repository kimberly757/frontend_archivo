import React, { useState } from 'react'
import {
  Search,
  Plus,
  X,
  Edit2,
  Trash2,
  QrCode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Laptop,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Mail,
  Send,
  Layers
} from 'lucide-react'
import partituraImg from '../../assets/featured_partitura.png'
import './DifusionGaleria.css'

const DifusionGaleria = () => {
  // Mock data of exhibitions
  const [exhibitions, setExhibitions] = useState([
    {
      id: 1,
      title: 'Talla y Madera del Táchira',
      dates: '15 Jun - 30 Jun',
      published: true,
      image: partituraImg,
      pieces: [
        { id: 101, name: 'Talla de San Isidro', author: 'Familia Roa', enabled: true, image: null },
        { id: 102, name: 'Silla artesanal de pino', author: 'José Ramírez', enabled: true, image: null }
      ]
    },
    {
      id: 2,
      title: 'Instrumentos de Viento y Cuerdas tradicionales',
      dates: '01 Jul - 15 Jul',
      published: false,
      image: null,
      pieces: [
        { id: 103, name: 'Cuatro de Cedro', author: 'Eleazar Rojas', enabled: true, image: null }
      ]
    },
    {
      id: 3,
      title: 'Vestimentas Típicas de Capacho',
      dates: '20 Jul - 05 Ago',
      published: true,
      image: null,
      pieces: []
    }
  ])

  // States
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Efemérides State
  const [efemerideText, setEfemerideText] = useState(
    'Mes del Folklore Tachirense: Conoce los rostros y saberes que tallan la identidad de nuestra región a través de nuestras expresiones vivas.'
  )
  const [efemerideBg, setEfemerideBg] = useState(null)

  // Exhibition Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingExhibitionId, setEditingExhibitionId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDates, setNewDates] = useState('')
  const [newPublished, setNewPublished] = useState(true)
  const [newImage, setNewImage] = useState(null)
  const [formError, setFormError] = useState('')

  // Pieces Management State
  const [selectedExhibitionForPieces, setSelectedExhibitionForPieces] = useState(null)
  const [isPiecesModalOpen, setIsPiecesModalOpen] = useState(false)
  const [isPieceFormOpen, setIsPieceFormOpen] = useState(false)
  const [pieceModalMode, setPieceModalMode] = useState('create')
  const [editingPieceId, setEditingPieceId] = useState(null)
  const [newPieceName, setNewPieceName] = useState('')
  const [newPieceAuthor, setNewPieceAuthor] = useState('')
  const [newPieceImage, setNewPieceImage] = useState(null)

  // Public Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)

  // Single QR Popup State
  const [isQrPopupOpen, setIsQrPopupOpen] = useState(false)
  const [selectedQrForView, setSelectedQrForView] = useState(null)

  // Email Campaign Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [selectedExhibitionForEmail, setSelectedExhibitionForEmail] = useState(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailNotification, setEmailNotification] = useState('')

  // Toggle switch handler
  const handleTogglePublished = (id) => {
    setExhibitions(prev => prev.map(ex => 
      ex.id === id ? { ...ex, published: !ex.published } : ex
    ))
  }

  // Open Create Exhibition Modal
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingExhibitionId(null)
    setNewTitle('')
    setNewDates('')
    setNewPublished(true)
    setNewImage(null)
    setFormError('')
    setIsModalOpen(true)
  }

  // Open Edit Exhibition Modal
  const handleOpenEditModal = (ex) => {
    setModalMode('edit')
    setEditingExhibitionId(ex.id)
    setNewTitle(ex.title)
    setNewDates(ex.dates)
    setNewPublished(ex.published)
    setNewImage(ex.image)
    setFormError('')
    setIsModalOpen(true)
  }

  // Handle Email Modal
  const handleOpenEmailModal = (ex) => {
    setSelectedExhibitionForEmail(ex)
    setIsEmailModalOpen(true)
    setEmailNotification('')
  }

  const handleConfirmSendEmail = () => {
    setIsSendingEmail(true)
    setTimeout(() => {
      setIsSendingEmail(false)
      setEmailNotification(`¡Invitaciones enviadas con éxito a los autores de las obras en la exposición "${selectedExhibitionForEmail.title}"!`)
      setTimeout(() => {
        setIsEmailModalOpen(false)
        setSelectedExhibitionForEmail(null)
      }, 3000)
    }, 1500)
  }

  // Handle Pieces Modal & CRUD
  const handleOpenPieces = (ex) => {
    setSelectedExhibitionForPieces(ex)
    setIsPiecesModalOpen(true)
    setIsPieceFormOpen(false)
    setNewPieceImage(null)
  }

  const handleTogglePieceStatus = (pieceId) => {
    const updatedPieces = selectedExhibitionForPieces.pieces.map(p => 
      p.id === pieceId ? { ...p, enabled: !p.enabled } : p
    )
    updateExhibitionPieces(updatedPieces)
  }

  const handleDeletePiece = (pieceId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta obra?')) {
      const updatedPieces = selectedExhibitionForPieces.pieces.filter(p => p.id !== pieceId)
      updateExhibitionPieces(updatedPieces)
    }
  }

  const handleOpenPieceForm = (mode, piece = null) => {
    setPieceModalMode(mode)
    if (mode === 'edit' && piece) {
      setEditingPieceId(piece.id)
      setNewPieceName(piece.name)
      setNewPieceAuthor(piece.author || '')
      setNewPieceImage(piece.image || null)
    } else {
      setEditingPieceId(null)
      setNewPieceName('')
      setNewPieceAuthor('')
      setNewPieceImage(null)
    }
    setIsPieceFormOpen(true)
  }

  const handleSavePiece = (e) => {
    e.preventDefault()
    if (!newPieceName.trim()) return

    let updatedPieces = [...(selectedExhibitionForPieces.pieces || [])]
    if (pieceModalMode === 'create') {
      updatedPieces.push({
        id: Date.now(),
        name: newPieceName.trim(),
        author: newPieceAuthor.trim(),
        image: newPieceImage,
        enabled: true
      })
    } else {
      updatedPieces = updatedPieces.map(p => 
        p.id === editingPieceId 
          ? { ...p, name: newPieceName.trim(), author: newPieceAuthor.trim(), image: newPieceImage } 
          : p
      )
    }
    updateExhibitionPieces(updatedPieces)
    setIsPieceFormOpen(false)
  }

  const updateExhibitionPieces = (updatedPieces) => {
    const updatedExhibition = { ...selectedExhibitionForPieces, pieces: updatedPieces }
    setSelectedExhibitionForPieces(updatedExhibition)
    setExhibitions(prev => prev.map(ex => ex.id === updatedExhibition.id ? updatedExhibition : ex))
  }

  // Handle Base64 Image upload for exhibitions and efemérides
  const handleImageChange = (e, target) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        if (target === 'exhibition') setNewImage(reader.result)
        else if (target === 'efemeride') setEfemerideBg(reader.result)
        else if (target === 'piece') setNewPieceImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Form Submit (Create/Edit)
  const handleRegisterExhibition = (e) => {
    e.preventDefault()

    if (!newTitle.trim() || !newDates.trim()) {
      setFormError('Por favor completa los campos obligatorios: Título y Fechas.')
      return
    }

    if (modalMode === 'create') {
      const newEx = {
        id: Date.now(),
        title: newTitle.trim(),
        dates: newDates.trim(),
        published: newPublished,
        image: newImage,
        pieces: []
      }
      setExhibitions([...exhibitions, newEx])
    } else {
      setExhibitions(prev => prev.map(ex => 
        ex.id === editingExhibitionId 
          ? { 
              ...ex, 
              title: newTitle.trim(), 
              dates: newDates.trim(), 
              published: newPublished, 
              image: newImage
            } 
          : ex
      ))
    }

    setNewTitle('')
    setNewDates('')
    setNewPublished(true)
    setNewImage(null)
    setEditingExhibitionId(null)
    setFormError('')
    setIsModalOpen(false)
  }

  // Delete Exhibition
  const handleDeleteExhibition = (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta exposición?')) {
      setExhibitions(exhibitions.filter(ex => ex.id !== id))
    }
  }

  return (
    <div className="difusion-module-container">
      {/* 1. Cabecera de la Sección */}
      <header className="page-header">
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO</span>
            <span className="separator">&gt;</span>
            <span className="current">DIFUSIÓN Y GALERÍA</span>
          </nav>
          <h1>Difusión y Galería Virtual</h1>
          <p className="cultor-subinfo text-light" style={{ fontSize: '14px', marginTop: '4px' }}>
            Configuración de exposiciones, visibilidad pública y gestión de códigos QR.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn-terracota-outline" onClick={() => setIsSimulatorOpen(true)}>
            <Laptop size={16} />
            <span>Previsualizar Galería</span>
          </button>
          <button className="btn-terracota" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Nueva Exposición</span>
          </button>
        </div>
      </header>

      {/* 2. Sección de Efemérides / Destacados */}
      <section className="efemerides-editor-section">
        <h2 className="section-card-title">
          <ImageIcon size={18} style={{ color: '#C05640' }} />
          <span>Configuración del Banner de Efemérides Patrimoniales</span>
        </h2>
        <div className="efemerides-banner-editor">
          <div className="efemerides-form-group">
            <label htmlFor="efemeride-text">Texto Destacado de la Efeméride</label>
            <textarea 
              id="efemeride-text"
              className="efemerides-textarea"
              placeholder="Escribe el mensaje destacado..."
              value={efemerideText}
              onChange={(e) => setEfemerideText(e.target.value)}
            />
          </div>

          <div className="efemerides-bg-uploader">
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Imagen de Fondo</span>
            {efemerideBg ? (
              <div className="image-form-preview" style={{ marginTop: '4px' }}>
                <img src={efemerideBg} alt="Fondo efeméride" style={{ width: '60px', height: '60px' }} />
                <button 
                  type="button" 
                  className="remove-img-form-btn"
                  onClick={() => setEfemerideBg(null)}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="btn-terracota-outline" 
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() => document.getElementById('efemeride-bg-picker').click()}
              >
                <UploadCloud size={14} />
                <span>Subir Imagen</span>
                <input 
                  type="file" 
                  id="efemeride-bg-picker" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageChange(e, 'efemeride')}
                />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Tablero de Exposiciones (Exhibition Cards Board) */}
      <section>
        <h2 className="section-card-title" style={{ marginBottom: '16px' }}>
          <span>Exposiciones y Muestras Activas</span>
        </h2>

        <div className="exhibitions-grid">
          {exhibitions.map(ex => (
            <div className="exhibition-card" key={ex.id}>
              {ex.image ? (
                <img src={ex.image} alt={ex.title} className="exhibition-card-img" style={{ cursor: 'pointer' }} onClick={() => handleOpenPieces(ex)} />
              ) : (
                <div className="exhibition-card-no-img" style={{ cursor: 'pointer' }} onClick={() => handleOpenPieces(ex)}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Sin imagen de fondo</span>
                </div>
              )}

              <div className="exhibition-card-body">
                <h3 style={{ cursor: 'pointer' }} onClick={() => handleOpenPieces(ex)}>{ex.title}</h3>
                <div className="exhibition-date-row">
                  <Calendar size={14} />
                  <span>{ex.dates}</span>
                  <span style={{ margin: '0 8px', color: '#d8d7d3' }}>|</span>
                  <FileText size={14} />
                  <span>{ex.pieces ? ex.pieces.length : 0} Obras</span>
                </div>

                <div className="exhibition-status-row">
                  <span className={`status-text-pill ${ex.published ? 'publicado' : 'borrador'}`}>
                    {ex.published ? 'Publicado' : 'Borrador'}
                  </span>
                  
                  {/* CSS Toggle switch */}
                  <label className="toggle-switch-wrapper">
                    <input 
                      type="checkbox" 
                      checked={ex.published}
                      onChange={() => handleTogglePublished(ex.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Card Footer Quick Actions */}
              <div className="exhibition-card-footer">
                <button 
                  className="exhibition-action-btn" 
                  title="Gestionar Obras"
                  onClick={() => handleOpenPieces(ex)}
                >
                  <Layers size={14} />
                </button>
                <button 
                  className="exhibition-action-btn" 
                  title="Mostrar Código QR"
                  onClick={() => {
                    setSelectedQrForView(ex)
                    setIsQrPopupOpen(true)
                  }}
                >
                  <QrCode size={15} />
                </button>
                <button 
                  className="exhibition-action-btn" 
                  title="Enviar Invitaciones por Correo"
                  onClick={() => handleOpenEmailModal(ex)}
                >
                  <Mail size={14} />
                </button>
                <button 
                  className="exhibition-action-btn" 
                  title="Editar Exposición"
                  onClick={() => handleOpenEditModal(ex)}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  className="exhibition-action-btn delete-btn" 
                  title="Eliminar Exposición"
                  onClick={() => handleDeleteExhibition(ex.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Registrar / Editar Exposición Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card">
            {/* Header */}
            <div className="modal-box-header">
              <h2>{modalMode === 'create' ? 'Crear Nueva Exposición' : 'Editar Exposición'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterExhibition}>
              <div className="modal-box-body">
                {formError && (
                  <div className="error-banner-group">
                    {formError}
                  </div>
                )}

                {/* Title */}
                <div className="input-box-field">
                  <label htmlFor="modal-exhibition-title">Título de la Exposición <span className="req-star">*</span></label>
                  <div className="icon-input-container">
                    <ImageIcon size={15} className="field-icon-left" />
                    <input 
                      type="text" 
                      id="modal-exhibition-title" 
                      placeholder="Ej. Talla y Madera del Táchira"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="input-box-field">
                  <label htmlFor="modal-exhibition-dates">Rango de Fechas <span className="req-star">*</span></label>
                  <div className="icon-input-container">
                    <Calendar size={15} className="field-icon-left" />
                    <input 
                      type="text" 
                      id="modal-exhibition-dates" 
                      placeholder="Ej. 15 Jun - 30 Jun"
                      value={newDates}
                      onChange={(e) => setNewDates(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Image Picker */}
                <div className="input-box-field">
                  <label>Imagen Destacada de la Temática</label>
                  <div className="image-upload-row">
                    {newImage ? (
                      <div className="image-form-preview">
                        <img src={newImage} alt="Exhibition Preview" style={{ width: '74px', height: '74px' }} />
                        <button 
                          type="button" 
                          className="remove-img-form-btn"
                          onClick={() => setNewImage(null)}
                        >
                          Quitar Foto
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-terracota-outline"
                        onClick={() => document.getElementById('exhibition-image-file').click()}
                      >
                        <UploadCloud size={16} />
                        <span>Subir Imagen</span>
                        <input 
                          type="file" 
                          id="exhibition-image-file" 
                          accept="image/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageChange(e, 'exhibition')}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Switch default status */}
                <div className="input-box-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <label style={{ margin: '0' }}>Publicar inmediatamente</label>
                  <label className="toggle-switch-wrapper">
                    <input 
                      type="checkbox" 
                      checked={newPublished}
                      onChange={(e) => setNewPublished(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-box-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-terracota">
                  {modalMode === 'create' ? 'Crear Exposición' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Simulador de Galería Pública Modal Overlay */}
      {isSimulatorOpen && (
        <div className="public-simulator-overlay">
          <div className="public-simulator-box">
            {/* Header */}
            <div className="public-simulator-header">
              <h2>
                <Eye size={18} />
                <span>Simulador de Galería Pública</span>
                <span className="simulator-tag">VISTA PORTAL PUBLICO</span>
              </h2>
              <button 
                onClick={() => setIsSimulatorOpen(false)}
                className="close-x-btn"
                style={{ color: '#ffffff' }}
                aria-label="Cerrar simulador"
              >
                <X size={18} />
              </button>
            </div>

            {/* Portal Body */}
            <div className="public-simulator-body">
              {/* Public Efemérides Banner */}
              <div className="public-efemerides-banner">
                {efemerideBg && (
                  <img src={efemerideBg} alt="Banner background" className="public-efemerides-bg" />
                )}
                <div className="public-efemerides-content">
                  <h4>Efemérides Destacadas</h4>
                  <p>{efemerideText || 'Cargando efemérides del folklore...'}</p>
                </div>
              </div>

              {/* Exhibitions list */}
              <div>
                <h3 className="public-section-title">Galería de Exposiciones Virtuales</h3>
                <div className="public-exhibitions-grid">
                  {exhibitions.filter(ex => ex.published).length > 0 ? (
                    exhibitions.filter(ex => ex.published).map(ex => (
                      <div className="public-exhibition-card" key={ex.id}>
                        {ex.image ? (
                          <img src={ex.image} alt={ex.title} />
                        ) : (
                          <div style={{ height: '130px', backgroundColor: '#ebeae6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a39996' }}>
                            <ImageIcon size={28} />
                          </div>
                        )}
                        <div className="public-exhibition-card-body">
                          <h4>{ex.title}</h4>
                          <span>Periodo: {ex.dates}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No hay exposiciones publicadas en este momento.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-box-footer" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: '#faf9f6' }}>
              <button className="btn-secondary" onClick={() => setIsSimulatorOpen(false)}>
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de visualización de QR individual */}
      {isQrPopupOpen && selectedQrForView && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card" style={{ width: '360px' }}>
            <div className="modal-box-header">
              <h2>Código QR de Exposición</h2>
              <button 
                onClick={() => {
                  setIsQrPopupOpen(false)
                  setSelectedQrForView(null)
                }}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-box-body" style={{ textAlign: 'center', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', border: '2px solid #C05640', borderRadius: '12px', backgroundColor: '#faf9f6' }}>
                <QrCode size={180} style={{ color: '#2d1e1b' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0' }}>{selectedQrForView.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Periodo: {selectedQrForView.dates}</p>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Escanea este código para acceder a la sala pública virtual.</span>
            </div>

            <div className="modal-box-footer">
              <button 
                className="btn-terracota" 
                onClick={() => {
                  setIsQrPopupOpen(false)
                  setSelectedQrForView(null)
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal de Envío de Correos (Campaña) */}
      {isEmailModalOpen && selectedExhibitionForEmail && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card">
            <div className="modal-box-header">
              <h2>Campaña de Invitaciones</h2>
              <button 
                onClick={() => {
                  if (!isSendingEmail) {
                    setIsEmailModalOpen(false)
                    setSelectedExhibitionForEmail(null)
                  }
                }}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-box-body">
              {emailNotification ? (
                <div className="success-banner-alert" style={{ marginBottom: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={16} />
                    <span>{emailNotification}</span>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginBottom: '16px', lineHeight: '1.5' }}>
                    Se enviará una invitación por correo electrónico a todos los autores y personas vinculadas a las piezas de la exposición <strong>{selectedExhibitionForEmail.title}</strong>.
                  </p>
                  
                  <div style={{ backgroundColor: '#f5f4f0', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>VISTA PREVIA DEL CORREO:</p>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '6px', border: '1px solid #ebeae6' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600' }}>
                        Asunto: Invitación Especial - {selectedExhibitionForEmail.title}
                      </p>
                      <hr style={{ border: 'none', borderTop: '1px solid #ebeae6', margin: '0 0 12px 0' }} />
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                        Estimado cultor/autor,
                      </p>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                        Le invitamos cordialmente a pasar por el archivo para que pueda experimentar en persona la exposición <strong>"{selectedExhibitionForEmail.title}"</strong>.
                      </p>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                        Este evento estará disponible durante el periodo: <strong>{selectedExhibitionForEmail.dates}</strong>. Será un honor contar con su presencia para compartir juntos la riqueza de nuestro patrimonio cultural.
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Atentamente,<br/>
                        El Equipo del Archivo de Folklore
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-box-footer">
              {!emailNotification && (
                <>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setIsEmailModalOpen(false)}
                    disabled={isSendingEmail}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn-terracota" 
                    onClick={handleConfirmSendEmail}
                    disabled={isSendingEmail}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isSendingEmail ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send size={15} />
                        Enviar Invitaciones
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal de Gestión de Obras por Evento */}
      {isPiecesModalOpen && selectedExhibitionForPieces && (
        <div className="modal-overlay-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-box-card" style={{ maxWidth: '800px' }}>
            <div className="modal-box-header">
              <h2>Obras de: {selectedExhibitionForPieces.title}</h2>
              <button 
                onClick={() => setIsPiecesModalOpen(false)}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-box-body">
              {!isPieceFormOpen ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                    <button className="btn-terracota" onClick={() => handleOpenPieceForm('create')}>
                      <Plus size={16} />
                      Añadir Obra
                    </button>
                  </div>

                  {selectedExhibitionForPieces.pieces && selectedExhibitionForPieces.pieces.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {selectedExhibitionForPieces.pieces.map(piece => (
                        <div key={piece.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', backgroundColor: '#faf9f6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, opacity: piece.enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                            {piece.image ? (
                              <img src={piece.image} alt={piece.name} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #ebeae6' }} />
                            ) : (
                              <div style={{ width: '72px', height: '72px', backgroundColor: '#ebeae6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a39996' }}>
                                <ImageIcon size={24} />
                              </div>
                            )}
                            <div>
                              <p style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{piece.name}</p>
                              <p style={{ margin: '0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>Autor / Cultor: {piece.author || 'Desconocido'}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <label className="toggle-switch-wrapper" title={piece.enabled ? 'Deshabilitar Obra' : 'Habilitar Obra'}>
                              <input 
                                type="checkbox" 
                                checked={piece.enabled}
                                onChange={() => handleTogglePieceStatus(piece.id)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                            <div style={{ width: '1px', height: '16px', backgroundColor: '#d8d7d3' }}></div>
                            <button className="exhibition-action-btn" title="Editar Obra" onClick={() => handleOpenPieceForm('edit', piece)}>
                              <Edit2 size={14} />
                            </button>
                            <button className="exhibition-action-btn delete-btn" title="Eliminar Obra" onClick={() => handleDeletePiece(piece.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '24px 0' }}>
                      No hay obras registradas en este evento.
                    </p>
                  )}
                </>
              ) : (
                <form onSubmit={handleSavePiece}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
                    {pieceModalMode === 'create' ? 'Añadir Nueva Obra' : 'Editar Obra'}
                  </h3>
                  <div className="input-box-field">
                    <label>Nombre de la Obra <span className="req-star">*</span></label>
                    <input 
                      type="text" 
                      value={newPieceName}
                      onChange={(e) => setNewPieceName(e.target.value)}
                      placeholder="Ej. Vasija de Barro Cocido"
                      required
                    />
                  </div>
                  <div className="input-box-field">
                    <label>Autor / Cultor</label>
                    <input 
                      type="text" 
                      value={newPieceAuthor}
                      onChange={(e) => setNewPieceAuthor(e.target.value)}
                      placeholder="Ej. Familia Roa"
                    />
                  </div>
                  <div className="input-box-field">
                    <label>Fotografía de la Obra</label>
                    <div className="image-upload-row">
                      {newPieceImage ? (
                        <div className="image-form-preview">
                          <img src={newPieceImage} alt="Preview" style={{ width: '74px', height: '74px', objectFit: 'cover', borderRadius: '6px' }} />
                          <button 
                            type="button" 
                            className="remove-img-form-btn"
                            onClick={() => setNewPieceImage(null)}
                          >
                            Quitar Foto
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-terracota-outline"
                          onClick={() => document.getElementById('piece-image-file').click()}
                        >
                          <UploadCloud size={16} />
                          <span>Subir Imagen</span>
                          <input 
                            type="file" 
                            id="piece-image-file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageChange(e, 'piece')}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setIsPieceFormOpen(false)}>Cancelar</button>
                    <button type="submit" className="btn-terracota">Guardar Obra</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DifusionGaleria
