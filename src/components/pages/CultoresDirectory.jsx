import React, { useState } from 'react'
import {
  Search,
  Plus,
  X,
  Edit2,
  Upload,
  FileText,
  FileBadge,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react'
import './CultoresDirectory.css'

const CultoresDirectory = ({ cultores, setCultores }) => {
  // Dynamic Options State
  const [techniquesList, setTechniquesList] = useState([
    'Talla en Madera',
    'Cerámica Tradicional',
    'Tejeduría',
    'Cestería'
  ])
  const [isAddingTechnique, setIsAddingTechnique] = useState(false)
  const [customTechnique, setCustomTechnique] = useState('')

  const handleAddTechnique = () => {
    if (customTechnique.trim() && !techniquesList.includes(customTechnique.trim())) {
      setTechniquesList([...techniquesList, customTechnique.trim()])
      setNewTechnique(customTechnique.trim())
    }
    setCustomTechnique('')
    setIsAddingTechnique(false)
  }

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTechnique, setSelectedTechnique] = useState('all')
  const [selectedMunicipio, setSelectedMunicipio] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)

  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCedula, setNewCedula] = useState('')
  const [newTechnique, setNewTechnique] = useState('Talla en Madera')
  const [newMunicipio, setNewMunicipio] = useState('San Cristóbal')
  const [newStatus, setNewStatus] = useState('ACTIVO')
  const [newObras, setNewObras] = useState(0)
  const [hasResume, setHasResume] = useState(false)
  const [hasCertification, setHasCertification] = useState(false)
  const [formError, setFormError] = useState('')

  // View Dossier (Expediente) Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCultorForView, setSelectedCultorForView] = useState(null)

  // Filter handlers
  const filteredCultores = cultores.filter(cultor => {
    // Only approved cultores are visible in the main directory
    if (cultor.verificationStatus !== 'aprobado') return false

    const matchesSearch = 
      cultor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cultor.cedula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cultor.technique.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTechnique = selectedTechnique === 'all' || cultor.technique === selectedTechnique
    const matchesMunicipio = selectedMunicipio === 'all' || cultor.municipio === selectedMunicipio
    const matchesStatus = selectedStatus === 'all' || cultor.status === selectedStatus

    return matchesSearch && matchesTechnique && matchesMunicipio && matchesStatus
  })

  // Submit Handler for New Cultor
  const handleRegisterCultor = (e) => {
    e.preventDefault()

    if (!newName.trim() || !newCedula.trim()) {
      setFormError('Por favor completa el nombre y la cédula.')
      return
    }

    // Simple ID validation (V-XX.XXX.XXX)
    const idRegex = /^[VEve]-\d{1,2}\.?\d{3}\.?\d{3}$/
    if (!idRegex.test(newCedula.trim())) {
      setFormError('Formato de cédula inválido. Ej. V-12.345.678')
      return
    }

    const newCultor = {
      id: Date.now(),
      name: newName.trim(),
      cedula: newCedula.trim().toUpperCase(),
      technique: newTechnique,
      municipio: newMunicipio,
      status: newStatus,
      supports: {
        cedula: true, // Always true upon registration
        resume: hasResume,
        certification: hasCertification
      },
      obras: Number(newObras) || 0,
      verificationStatus: 'pendiente'
    }

    setCultores([newCultor, ...cultores])
    
    // Clear and close
    setNewName('')
    setNewCedula('')
    setNewTechnique('Talla en Madera')
    setNewMunicipio('San Cristóbal')
    setNewStatus('ACTIVO')
    setNewObras(0)
    setHasResume(false)
    setHasCertification(false)
    setFormError('')
    setIsModalOpen(false)
  }

  // Get Initials for Avatar
  const getInitials = (name) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

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
            Gestión de expedientes, oficios y control de fe de vida del patrimonio vivo.
          </p>
        </div>

        <button className="btn-terracota" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Registrar Cultor</span>
        </button>
      </header>

      {/* 2. Barra de Filtros y Búsqueda */}
      <section className="filter-bar-card">
        {/* Input de Búsqueda */}
        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, cédula o técnica..." 
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

        {/* Selectores */}
        <div className="selectors-wrapper">
          <select 
            value={selectedTechnique}
            onChange={(e) => {
              setSelectedTechnique(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-dropdown-select"
          >
            <option value="all">Todas las Técnicas</option>
            {techniquesList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            value={selectedMunicipio}
            onChange={(e) => {
              setSelectedMunicipio(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-dropdown-select"
          >
            <option value="all">Municipio</option>
            <option value="San Cristóbal">San Cristóbal</option>
            <option value="Lobatera">Lobatera</option>
            <option value="Capacho">Capacho</option>
          </select>

          <select 
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-dropdown-select"
          >
            <option value="all">Fe de Vida</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="RETIRADO">RETIRADO</option>
            <option value="FALLECIDO">FALLECIDO</option>
          </select>
        </div>
      </section>

      {/* 3. Tabla Interactiva (Data Grid) */}
      <div className="card cultores-list-card">
        <div className="table-responsive">
          <table className="cultores-table">
            <thead>
              <tr>
                <th>CULTOR</th>
                <th>TÉCNICA / OFICIO</th>
                <th>FE DE VIDA</th>
                <th>SOPORTES</th>
                <th>OBRAS CATALOGADAS</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredCultores.length > 0 ? (
                filteredCultores.map((cultor) => (
                  <tr key={cultor.id}>
                    {/* Cultor Name/ID */}
                    <td>
                      <div 
                        className="cultor-profile-cell clickable"
                        onClick={() => {
                          setSelectedCultorForView(cultor)
                          setIsViewModalOpen(true)
                        }}
                      >
                        <div className="cultor-avatar-badge">
                          {getInitials(cultor.name)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="cultor-display-name">
                            {cultor.name}
                            {cultor.verificationStatus === 'pendiente' && (
                              <span className="v-status-pill pending">Pendiente</span>
                            )}
                            {cultor.verificationStatus === 'rechazado' && (
                              <span className="v-status-pill rejected">Rechazado</span>
                            )}
                          </span>
                          <span className="cultor-subinfo">{cultor.cedula} • <span style={{ fontStyle: 'italic' }}>{cultor.municipio}</span></span>
                        </div>
                      </div>
                    </td>

                    {/* Technique */}
                    <td>
                      <span className="cultor-technique-name">{cultor.technique}</span>
                    </td>

                    {/* Fe de Vida Status Pill */}
                    <td>
                      <span className={`life-badge ${cultor.status.toLowerCase()}`}>
                        <span className="life-badge-dot"></span>
                        {cultor.status}
                      </span>
                    </td>

                    {/* Soportes */}
                    <td>
                      <div className="supports-flex-row">
                        <div className="support-pill" title="Cédula de Identidad Cargada">
                          <User size={12} className="support-pill-icon" />
                          <span>C.I.</span>
                        </div>
                        {cultor.supports.resume ? (
                          <div className="support-pill" title="Resumen Curricular Cargado">
                            <FileText size={12} className="support-pill-icon" />
                            <span>R.C.</span>
                          </div>
                        ) : (
                          <div className="support-pill pending" title="Resumen Curricular Pendiente">
                            <FileText size={12} className="support-pill-icon" />
                            <span>Pte.</span>
                          </div>
                        )}
                        {cultor.supports.certification && (
                          <div className="support-pill" title="Certificación Fe de Vida Cargada">
                            <FileBadge size={12} className="support-pill-icon" />
                            <span>Cert.</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Obras Catalogadas */}
                    <td>
                      <span className="obras-count-tag">{cultor.obras} piezas</span>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="grid-actions-row">
                        <button 
                          className="grid-action-btn" 
                          title="Ver Expediente"
                          onClick={() => {
                            setSelectedCultorForView(cultor)
                            setIsViewModalOpen(true)
                          }}
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button className="grid-action-btn" title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button className="grid-action-btn" title="Subir Soportes/Fe de vida">
                          <Upload size={15} />
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
                      <p className="empty-grid-desc">Intenta cambiar los parámetros del buscador o filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Paginación */}
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

      {/* 5. Registrar Cultor Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card">
            {/* Header */}
            <div className="modal-box-header">
              <h2>Registrar Nuevo Cultor</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="close-x-btn"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterCultor}>
              <div className="modal-box-body">
                {formError && (
                  <div className="error-banner-group">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="input-box-field">
                  <label htmlFor="modal-cultor-name">Nombre Completo <span className="req-star">*</span></label>
                  <div className="icon-input-container">
                    <User size={15} className="field-icon-left" />
                    <input 
                      type="text" 
                      id="modal-cultor-name" 
                      placeholder="Ej. Eleazar Rojas"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* ID */}
                <div className="input-box-field">
                  <label htmlFor="modal-cultor-cedula">Cédula de Identidad <span className="req-star">*</span></label>
                  <div className="icon-input-container">
                    <ShieldCheck size={15} className="field-icon-left" />
                    <input 
                      type="text" 
                      id="modal-cultor-cedula" 
                      placeholder="Formato: V-12.345.678"
                      value={newCedula}
                      onChange={(e) => setNewCedula(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Selectors Row */}
                <div className="fields-split-row">
                  <div className="input-box-field">
                    <label htmlFor="modal-cultor-technique">Técnica principal</label>
                    <div className="icon-input-container" style={{ display: 'flex', gap: '8px' }}>
                      {isAddingTechnique ? (
                        <>
                          <input 
                            type="text" 
                            placeholder="Nueva técnica..." 
                            value={customTechnique} 
                            onChange={(e) => setCustomTechnique(e.target.value)} 
                            style={{ flex: 1 }}
                            autoFocus
                          />
                          <button type="button" className="btn-terracota" onClick={handleAddTechnique} style={{ padding: '0 10px', height: '100%', borderRadius: '6px' }}>✓</button>
                          <button type="button" className="btn-secondary" onClick={() => setIsAddingTechnique(false)} style={{ padding: '0 10px', height: '100%', borderRadius: '6px' }}>✕</button>
                        </>
                      ) : (
                        <>
                          <select 
                            id="modal-cultor-technique"
                            value={newTechnique}
                            onChange={(e) => setNewTechnique(e.target.value)}
                            style={{ flex: 1 }}
                          >
                            {techniquesList.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button type="button" className="btn-terracota" onClick={() => setIsAddingTechnique(true)} style={{ padding: '0 10px', height: '100%', borderRadius: '6px' }} title="Añadir técnica">
                            <Plus size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-cultor-municipio">Municipio</label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-cultor-municipio"
                        value={newMunicipio}
                        onChange={(e) => setNewMunicipio(e.target.value)}
                      >
                        <option value="San Cristóbal">San Cristóbal</option>
                        <option value="Lobatera">Lobatera</option>
                        <option value="Capacho">Capacho</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status and Obras */}
                <div className="fields-split-row">
                  <div className="input-box-field">
                    <label htmlFor="modal-cultor-status">Fe de Vida (Estado)</label>
                    <div className="icon-input-container">
                      <select 
                        id="modal-cultor-status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="RETIRADO">RETIRADO</option>
                        <option value="FALLECIDO">FALLECIDO</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-box-field">
                    <label htmlFor="modal-cultor-obras">Obras Catalogadas</label>
                    <div className="icon-input-container">
                      <input 
                        type="number" 
                        id="modal-cultor-obras" 
                        min="0"
                        value={newObras}
                        onChange={(e) => setNewObras(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox box panel */}
                <div className="checkboxes-box-panel">
                  <span className="checkboxes-box-title">Digitalizar Soportes</span>
                  
                  <label className="checkbox-label-item">
                    <input 
                      type="checkbox" 
                      checked={hasResume}
                      onChange={(e) => setHasResume(e.target.checked)}
                    />
                    <span>Resumen Curricular (R.C.)</span>
                  </label>

                  <label className="checkbox-label-item">
                    <input 
                      type="checkbox" 
                      checked={hasCertification}
                      onChange={(e) => setHasCertification(e.target.checked)}
                    />
                    <span>Certificado Fe de Vida (Cert.)</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-box-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-terracota">
                  Registrar Cultor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Ver Expediente / Modal de Verificación */}
      {isViewModalOpen && selectedCultorForView && (
        <div className="modal-overlay-backdrop">
          <div className="modal-box-card dossier-modal">
            {/* Header */}
            <div className="modal-box-header">
              <h2>Expediente del Cultor</h2>
              <button 
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedCultorForView(null)
                }}
                className="close-x-btn"
                aria-label="Cerrar expediente"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="modal-box-body">
              {/* Profile Card Header inside Modal */}
              <div className="dossier-profile-header">
                <div className="dossier-avatar">
                  {getInitials(selectedCultorForView.name)}
                </div>
                <div className="dossier-profile-meta">
                  <h3>{selectedCultorForView.name}</h3>
                  <span className="dossier-sub">{selectedCultorForView.cedula} • {selectedCultorForView.municipio}</span>
                </div>
                <div className="dossier-v-status">
                  <span className={`v-badge ${selectedCultorForView.verificationStatus || 'aprobado'}`}>
                    {selectedCultorForView.verificationStatus === 'pendiente' && 'PENDIENTE'}
                    {selectedCultorForView.verificationStatus === 'aprobado' && 'APROBADO'}
                    {selectedCultorForView.verificationStatus === 'rechazado' && 'RECHAZADO'}
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="dossier-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Nombre Completo:</span>
                  <span className="dossier-value">{selectedCultorForView.name}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Cédula de Identidad:</span>
                  <span className="dossier-value">{selectedCultorForView.cedula}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Técnica / Oficio:</span>
                  <span className="dossier-value">{selectedCultorForView.technique}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Municipio:</span>
                  <span className="dossier-value">{selectedCultorForView.municipio}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Fe de Vida (Condición):</span>
                  <span className="dossier-value">{selectedCultorForView.status}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Obras Catalogadas:</span>
                  <span className="dossier-value">{selectedCultorForView.obras} piezas</span>
                </div>
              </div>

              {/* Documents checklist */}
              <div className="checkboxes-box-panel">
                <span className="checkboxes-box-title">Documentos de Soporte Digitalizados</span>
                <div className="dossier-document-row">
                  <div className={`doc-status-item ${selectedCultorForView.supports.cedula ? 'verified' : 'missing'}`}>
                    <span className="dot"></span>
                    <span>Cédula de Identidad (C.I.)</span>
                  </div>
                  <div className={`doc-status-item ${selectedCultorForView.supports.resume ? 'verified' : 'missing'}`}>
                    <span className="dot"></span>
                    <span>Resumen Curricular (R.C.)</span>
                  </div>
                  <div className={`doc-status-item ${selectedCultorForView.supports.certification ? 'verified' : 'missing'}`}>
                    <span className="dot"></span>
                    <span>Certificado Fe de Vida (Cert.)</span>
                  </div>
                </div>
              </div>

              {/* Administrative Review Section */}
              <div className="administrative-review-panel">
                <div className="review-banner-alert success">
                  <div className="review-banner-text">
                    <strong>Expediente Verificado ✓</strong>
                    <p>Este cultor cumple con las normativas patrimoniales y se encuentra activo en el registro oficial del patrimonio vivo.</p>
                  </div>
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
                  setSelectedCultorForView(null)
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CultoresDirectory
