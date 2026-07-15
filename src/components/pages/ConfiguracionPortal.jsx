import React, { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Edit2, Trash2, Plus, Monitor, Link as LinkIcon, Folder, FolderOpen, Eye, EyeOff, Camera, Layers, X, CalendarDays, ArrowLeft, Image as ImageIcon, Mail, Phone, MapPin, Upload
} from 'lucide-react'
import PageHeader from '../PageHeader'
import './ConfiguracionPortal.css'
import {
  getConfiguracionWebRequest,
  updateConfiguracionWebRequest,
  getExposicionesAdminRequest,
  createExposicionAdminRequest,
  updateExposicionAdminRequest,
  deleteExposicionAdminRequest,
  getObrasPorExposicionRequest,
  linkObraExposicionRequest,
  unlinkObraExposicionRequest,
  getObrasAdminRequest,
  updateObraDestacadoRequest,
  getEfemeridesAdminRequest,
  createEfemerideRequest,
  updateEfemerideRequest,
  deleteEfemerideRequest
} from '../../services/api'
import { useToast } from '../../context/ToastContext'
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const EFEMERIDE_FORM_INICIAL = {
  titulo: '', descripcion: '', fecha: '', categoria: '', imagen: '', activa: true,
}

const ConfiguracionPortal = () => {
  const { showToast } = useToast()
  const token = localStorage.getItem('auth-token')
  const [iframeKey, setIframeKey] = useState(Date.now())

  const [configWeb, setConfigWeb] = useState({
    hero_titulo: '',
    hero_subtitulo: '',
    about_texto: '',
    contacto_email: '',
    contacto_telefono: '',
    contacto_direccion: '',
    contacto_horario: '',
    hero_imagen: '',
    about_imagen: ''
  })
  const [heroFile, setHeroFile] = useState(null)
  const [aboutFile, setAboutFile] = useState(null)
  const [loginFile, setLoginFile] = useState(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  const [exposiciones, setExposiciones] = useState([])
  const [loadingExposiciones, setLoadingExposiciones] = useState(true)

  const [obrasColeccion, setObrasColeccion] = useState([])
  const [loadingObras, setLoadingObras] = useState(true)

  // Estados del modal de exposiciones
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingExpoId, setEditingExpoId] = useState(null)
  const [expoForm, setExpoForm] = useState({
    nombre_exposicion: '',
    descripcion: '',
    lugar_fisico: '',
    organizador: '',
    fecha_inicio: '',
    fecha_fin: ''
  })

  // Efemérides
  const [efemerides, setEfemerides] = useState([])
  const [loadingEfemerides, setLoadingEfemerides] = useState(true)
  const [efemerideForm, setEfemerideForm] = useState(EFEMERIDE_FORM_INICIAL)
  const [editingEfemerideId, setEditingEfemerideId] = useState(null)
  const [isEfemerideModalOpen, setIsEfemerideModalOpen] = useState(false)
  const [efemerideImagenFile, setEfemerideImagenFile] = useState(null)
  const [efemerideImagenPreview, setEfemerideImagenPreview] = useState('')


  // Vista previa de la imagen recién elegida (antes de guardar), liberando el object
  // URL anterior para no acumular memoria cada vez que se cambia el archivo.
  useEffect(() => {
    if (!efemerideImagenFile) {
      setEfemerideImagenPreview('')
      return
    }
    const url = URL.createObjectURL(efemerideImagenFile)
    setEfemerideImagenPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [efemerideImagenFile])

  // Selector "Efeméride / Exposición": paso previo al abrir cualquiera de los dos formularios.
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false)

  // Estados para vinculación de obras a exposición
  const [isObrasModalOpen, setIsObrasModalOpen] = useState(false)
  const [selectedExpo, setSelectedExpo] = useState(null)
  const [linkedObrasIds, setLinkedObrasIds] = useState([])

  // Paginación
  const [currentPageObras, setCurrentPageObras] = useState(1)
  const [currentPageExpos, setCurrentPageExpos] = useState(1)
  const [currentPageEfeme, setCurrentPageEfeme] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchConfigWeb()
    fetchExposiciones()
    fetchObras()
    fetchEfemerides()
  }, [])

  const fetchEfemerides = async () => {
    try {
      setLoadingEfemerides(true)
      const data = await getEfemeridesAdminRequest(token)
      setEfemerides(data)
    } catch (error) {
      console.error("Error al cargar efemérides", error)
    } finally {
      setLoadingEfemerides(false)
    }
  }

  const fetchConfigWeb = async () => {
    try {
      setLoadingConfig(true)
      const data = await getConfiguracionWebRequest()
      if (data) {
        setConfigWeb({
          hero_titulo: data.hero_titulo || '',
          hero_subtitulo: data.hero_subtitulo || '',
          about_texto: data.about_texto || '',
          contacto_email: data.contacto_email || '',
          contacto_telefono: data.contacto_telefono || '',
          contacto_direccion: data.contacto_direccion || '',
          contacto_horario: data.contacto_horario || '',
          hero_imagen: data.hero_imagen || '',
          about_imagen: data.about_imagen || '',
          login_imagen: data.login_imagen || ''
        })
      }
    } catch (error) {
      console.error("Error al cargar configuración web", error)
    } finally {
      setLoadingConfig(false)
    }
  }

  const fetchExposiciones = async () => {
    try {
      setLoadingExposiciones(true)
      const data = await getExposicionesAdminRequest(token)
      setExposiciones(data)
    } catch (error) {
      console.error("Error al cargar exposiciones", error)
    } finally {
      setLoadingExposiciones(false)
    }
  }

  const fetchObras = async () => {
    try {
      setLoadingObras(true)
      const data = await getObrasAdminRequest(token)
      setObrasColeccion(data)
    } catch (error) {
      console.error("Error al cargar obras", error)
    } finally {
      setLoadingObras(false)
    }
  }

  const handleSaveConfigWeb = async (e) => {
    e.preventDefault()
    try {
      setIsSavingConfig(true)
      const formData = new FormData()
      formData.append('hero_titulo', configWeb.hero_titulo)
      formData.append('hero_subtitulo', configWeb.hero_subtitulo)
      formData.append('about_texto', configWeb.about_texto)
      formData.append('contacto_email', configWeb.contacto_email)
      formData.append('contacto_telefono', configWeb.contacto_telefono)
      formData.append('contacto_direccion', configWeb.contacto_direccion)
      formData.append('contacto_horario', configWeb.contacto_horario)

      if (heroFile) {
        formData.append('hero_imagen', heroFile)
      }
      if (aboutFile) {
        formData.append('about_imagen', aboutFile)
      }
      if (loginFile) {
        formData.append('login_imagen', loginFile)
      }

      await updateConfiguracionWebRequest(formData, token)
      showToast({ titulo: 'Configuración guardada', mensaje: 'La configuración web fue actualizada con éxito.', tipo: 'success' })
      setHeroFile(null)
      setAboutFile(null)
      setLoginFile(null)
      fetchConfigWeb()
      setIframeKey(Date.now())
    } catch (error) {
      showToast({ titulo: 'Error al guardar', mensaje: error.response?.data?.message || error.response?.data?.error || error.message, tipo: 'error' })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleToggleObraDestacado = async (id_obra) => {
    const obra = obrasColeccion.find(o => o.id_obra === id_obra)
    if (obra.destacado_galeria === 'no') {
      const activas = obrasColeccion.filter(o => o.destacado_galeria === 'si').length
      if (activas >= 6) {
        showToast({
          titulo: 'Límite alcanzado',
          mensaje: 'Solo puedes tener hasta 6 obras publicadas en la web. Desmarca alguna antes de publicar otra.',
          tipo: 'error',
        })
        return
      }
    }
    const nuevoDestacado = obra.destacado_galeria === 'si' ? 'no' : 'si'
    try {
      await updateObraDestacadoRequest(id_obra, nuevoDestacado, token)
      setObrasColeccion(prev => prev.map(o =>
        o.id_obra === id_obra ? { ...o, destacado_galeria: nuevoDestacado } : o
      ))
      setIframeKey(Date.now())
    } catch (error) {
      showToast({ titulo: 'Error', mensaje: 'No se pudo actualizar el destacado de la obra.', tipo: 'error' })
    }
  }

  const handleToggleEstatus = async (expo) => {
    if (expo.estatus !== 'activa') {
      const activaExistente = exposiciones.find(e => e.estatus === 'activa' && e.id_exposicion !== expo.id_exposicion)
      if (activaExistente) {
        showToast({
          titulo: 'Límite alcanzado',
          mensaje: 'Ya hay una exposición publicada en la web. Debes ocultarla antes de publicar otra.',
          tipo: 'error',
        })
        return
      }
    }
    const newEstatus = expo.estatus === 'activa' ? 'inactiva' : 'activa'
    try {
      await updateExposicionAdminRequest(expo.id_exposicion, { ...expo, estatus: newEstatus }, token)
      fetchExposiciones()
      setIframeKey(Date.now())
    } catch (error) {
      showToast({ titulo: 'Error', mensaje: 'No se pudo cambiar el estatus de la exposición.', tipo: 'error' })
    }
  }

  const handleDeleteExposicion = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta exposición?")) {
      try {
        await deleteExposicionAdminRequest(id, token)
        setExposiciones(prev => prev.filter(e => e.id_exposicion !== id))
        setIframeKey(Date.now())
      } catch (error) {
        showToast({ titulo: 'Error', mensaje: 'No se pudo eliminar la exposición.', tipo: 'error' })
      }
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setExpoForm({ nombre_exposicion: '', descripcion: '', lugar_fisico: '', organizador: '', fecha_inicio: '', fecha_fin: '' })
    setIsModalOpen(true)
  }

  // Selector de tipo: punto de entrada único para crear contenido nuevo. Muestra
  // las dos opciones (Efeméride / Exposición) y, según cuál se elija, abre el
  // formulario correspondiente (el de exposición ya existente, o el nuevo de efeméride).
  const abrirSelectorCrear = () => {
    setIsCrearModalOpen(true)
  }

  const elegirTipoACrear = (tipo) => {
    setIsCrearModalOpen(false)
    if (tipo === 'exposicion') {
      openCreateModal()
    } else {
      openCreateEfemerideModal()
    }
  }

  // Regresa al selector Efeméride/Exposición desde el formulario de creación, por si
  // se eligió el tipo equivocado. Solo tiene sentido en modo "create": al editar un
  // registro existente ya se sabe de qué tipo es.
  const volverAlSelectorDesdeEfemeride = () => {
    setIsEfemerideModalOpen(false)
    setIsCrearModalOpen(true)
  }

  const volverAlSelectorDesdeExposicion = () => {
    setIsModalOpen(false)
    setIsCrearModalOpen(true)
  }

  // EFEMÉRIDES
  const openCreateEfemerideModal = () => {
    setEditingEfemerideId(null)
    setEfemerideForm(EFEMERIDE_FORM_INICIAL)
    setEfemerideImagenFile(null)
    setModalMode('create')
    setIsEfemerideModalOpen(true)
  }

  const openEditEfemerideModal = (efe) => {
    setEditingEfemerideId(efe.id_efemeride)
    // El calendario necesita una fecha completa; si no hay año de referencia
    // guardado, se usa el año actual solo para poder mostrar día/mes en el selector.
    const anio = efe.anio_referencia || new Date().getFullYear()
    const fecha = `${String(anio).padStart(4, '0')}-${String(efe.mes).padStart(2, '0')}-${String(efe.dia).padStart(2, '0')}`
    setEfemerideForm({
      titulo: efe.titulo || '',
      descripcion: efe.descripcion || '',
      fecha,
      categoria: efe.categoria || '',
      imagen: efe.imagen || '',
      activa: efe.activa,
    })
    setEfemerideImagenFile(null)
    setModalMode('edit')
    setIsEfemerideModalOpen(true)
  }

  const handleSaveEfemeride = async (e) => {
    e.preventDefault()
    try {
      const [anio, mes, dia] = efemerideForm.fecha.split('-').map(Number)
      const formData = new FormData()
      formData.append('titulo', efemerideForm.titulo)
      formData.append('dia', dia)
      formData.append('mes', mes)
      formData.append('anio_referencia', anio)
      formData.append('activa', efemerideForm.activa ? 'true' : 'false')
      if (efemerideForm.descripcion) formData.append('descripcion', efemerideForm.descripcion)
      if (efemerideForm.categoria) formData.append('categoria', efemerideForm.categoria)
      if (efemerideImagenFile) formData.append('imagen', efemerideImagenFile)

      if (editingEfemerideId) {
        await updateEfemerideRequest(editingEfemerideId, formData, token)
      } else {
        await createEfemerideRequest(formData, token)
      }
      setIsEfemerideModalOpen(false)
      fetchEfemerides()
      setIframeKey(Date.now())
    } catch (error) {
      showToast({ titulo: 'Error', mensaje: error.message || 'No se pudo guardar la efeméride.', tipo: 'error' })
    }
  }

  const handleToggleEfemerideActiva = async (efe) => {
    if (!efe.activa) {
      const activaExistente = efemerides.find(e => e.activa && e.id_efemeride !== efe.id_efemeride)
      if (activaExistente) {
        showToast({
          titulo: 'Límite alcanzado',
          mensaje: 'Ya hay una efeméride publicada en la web. Debes ocultarla antes de publicar otra.',
          tipo: 'error',
        })
        return
      }
    }
    try {
      await updateEfemerideRequest(efe.id_efemeride, { activa: !efe.activa }, token)
      fetchEfemerides()
      setIframeKey(Date.now())
    } catch (error) {
      showToast({ titulo: 'Error', mensaje: 'No se pudo cambiar el estatus de la efeméride.', tipo: 'error' })
    }
  }

  const handleDeleteEfemeride = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta efeméride?")) {
      try {
        await deleteEfemerideRequest(id, token)
        setEfemerides(prev => prev.filter(e => e.id_efemeride !== id))
        setIframeKey(Date.now())
      } catch (error) {
        showToast({ titulo: 'Error', mensaje: 'No se pudo eliminar la efeméride.', tipo: 'error' })
      }
    }
  }

  const openEditModal = (expo) => {
    setModalMode('edit')
    setEditingExpoId(expo.id_exposicion)
    setExpoForm({
      nombre_exposicion: expo.nombre_exposicion || '',
      descripcion: expo.descripcion || '',
      lugar_fisico: expo.lugar_fisico || '',
      organizador: expo.organizador || '',
      fecha_inicio: expo.fecha_inicio ? expo.fecha_inicio.split('T')[0] : '',
      fecha_fin: expo.fecha_fin ? expo.fecha_fin.split('T')[0] : ''
    })
    setIsModalOpen(true)
  }

  const handleSaveExposicion = async (e) => {
    e.preventDefault()
    try {
      if (modalMode === 'create') {
        await createExposicionAdminRequest(expoForm, token)
      } else {
        await updateExposicionAdminRequest(editingExpoId, expoForm, token)
      }
      setIsModalOpen(false)
      fetchExposiciones()
      setIframeKey(Date.now())
    } catch (error) {
      showToast({ titulo: 'Error', mensaje: 'No se pudo guardar la exposición.', tipo: 'error' })
    }
  }

  // VINCULACIÓN DE OBRAS
  const openObrasModal = async (expo) => {
    setSelectedExpo(expo)
    setIsObrasModalOpen(true)
    try {
      const vinculos = await getObrasPorExposicionRequest(token)
      const myVinculos = vinculos.filter(v => v.id_exposicion === expo.id_exposicion)
      setLinkedObrasIds(myVinculos.map(v => v.id_obra))
    } catch (error) {
      console.error("Error al cargar vínculos")
    }
  }

  const handleToggleLinkObra = async (id_obra) => {
    const isLinked = linkedObrasIds.includes(id_obra)
    try {
      if (isLinked) {
        await unlinkObraExposicionRequest(selectedExpo.id_exposicion, id_obra, token)
        setLinkedObrasIds(prev => prev.filter(id => id !== id_obra))
        setIframeKey(Date.now())
      } else {
        await linkObraExposicionRequest(selectedExpo.id_exposicion, id_obra, token)
        setLinkedObrasIds(prev => [...prev, id_obra])
        setIframeKey(Date.now())
      }
    } catch (error) {
      showToast({ titulo: 'Error', mensaje: 'No se pudo cambiar el vínculo de la obra.', tipo: 'error' })
    }
  }

  return (
    <div className="config-module-container">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO FOLKLORE' },
          { label: 'CONFIGURACIÓN DEL PORTAL', active: true },
        ]}
        title="Configuración del Portal"
        description="Gestiona el contenido, textos e imágenes de la página de inicio, de nosotros, del login y de las exposiciones virtuales."
        actionButton={
          <a href={`${import.meta.env.VITE_PORTAL_URL}/?t=${iframeKey}`} target="_blank" rel="noopener noreferrer" className="ph-action-btn">
            <Monitor size={18} />
            Vista Previa del Portal Web
          </a>
        }
      />

      {/* 0. Previsualización en la Web */}
      <section>
        <div className="card" style={{ padding: '4px', height: '500px', overflow: 'hidden' }}>
          <iframe
            key={iframeKey}
            src={`${import.meta.env.VITE_PORTAL_URL}/?t=${iframeKey}`}
            title="Previsualización de la Web Pública"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
          />
        </div>
      </section>

      {/* 1. Textos y Contenido de la Web */}
      <section>
        <h2 className="section-card-title">
          <Edit2 size={18} />
          Textos y Contenido de la Web
        </h2>
        {loadingConfig ? (
          <p style={{ textAlign: 'center', padding: '48px', color: '#807471', fontSize: '14px', fontWeight: 500 }}>Cargando configuración...</p>
        ) : (
          <form onSubmit={handleSaveConfigWeb}>
            <div className="content-editor-grid">

              {/* ─── LEFT: Textos, Contenido y Contacto ─── */}
              <div className="editor-panel">
                <div className="editor-card editor-card-left">

                  <div className="editor-field">
                    <label htmlFor="hero_titulo">TÍTULO PRINCIPAL (HERO)</label>
                    <input
                      id="hero_titulo"
                      name="hero_titulo"
                      type="text"
                      value={configWeb.hero_titulo}
                      onChange={(e) => setConfigWeb({ ...configWeb, hero_titulo: e.target.value })}
                      placeholder="Ej. Preservando la Memoria Cultural del Táchira"
                      maxLength={80}
                    />
                    <span className="char-counter">{configWeb.hero_titulo.length}/80</span>
                  </div>

                  <div className="editor-field">
                    <label htmlFor="hero_subtitulo">SUBTÍTULO (HERO)</label>
                    <input
                      id="hero_subtitulo"
                      name="hero_subtitulo"
                      type="text"
                      value={configWeb.hero_subtitulo}
                      onChange={(e) => setConfigWeb({ ...configWeb, hero_subtitulo: e.target.value })}
                      placeholder="Ej. Un archivo digital colaborativo que rescata el oficio, la mano y la historia de nuestra gente."
                      maxLength={120}
                    />
                    <span className="char-counter">{configWeb.hero_subtitulo.length}/120</span>
                  </div>

                  <div className="editor-section">
                    <div className="editor-section-header">
                      <Edit2 size={14} />
                      <span>Acerca del Archivo</span>
                    </div>
                    <div className="editor-field" style={{ marginBottom: 0 }}>
                      <textarea
                        id="about_texto"
                        name="about_texto"
                        value={configWeb.about_texto}
                        onChange={(e) => setConfigWeb({ ...configWeb, about_texto: e.target.value })}
                        maxLength={500}
                        rows={8}
                      />
                      <span className="char-counter">{configWeb.about_texto.length}/500</span>
                    </div>
                  </div>

                  <div className="editor-section">
                    <div className="editor-section-header">
                      <Mail size={14} />
                      <span>Información de Contacto</span>
                    </div>

                    <div className="contact-field">
                      <Mail size={16} className="contact-field-icon" />
                      <input
                        type="email"
                        name="contacto_email"
                        value={configWeb.contacto_email}
                        onChange={(e) => setConfigWeb({ ...configWeb, contacto_email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        maxLength={80}
                      />
                    </div>

                    <div className="contact-field">
                      <Phone size={16} className="contact-field-icon" />
                      <input
                        type="text"
                        name="contacto_telefono"
                        value={configWeb.contacto_telefono}
                        onChange={(e) => setConfigWeb({ ...configWeb, contacto_telefono: e.target.value })}
                        placeholder="+58 000 000 0000"
                        maxLength={20}
                      />
                    </div>

                    <div className="contact-field">
                      <MapPin size={16} className="contact-field-icon" />
                      <input
                        type="text"
                        name="contacto_direccion"
                        value={configWeb.contacto_direccion}
                        onChange={(e) => setConfigWeb({ ...configWeb, contacto_direccion: e.target.value })}
                        placeholder="Dirección física"
                        maxLength={120}
                      />
                    </div>

                    <div className="contact-field">
                      <CalendarDays size={16} className="contact-field-icon" />
                      <input
                        type="text"
                        name="contacto_horario"
                        value={configWeb.contacto_horario}
                        onChange={(e) => setConfigWeb({ ...configWeb, contacto_horario: e.target.value })}
                        placeholder="Horarios de atención"
                        maxLength={120}
                      />
                    </div>
                  </div>

                  <div className="editor-actions-row">
                    <button type="submit" className="btn-primary" disabled={isSavingConfig}>
                      {isSavingConfig ? 'Guardando Cambios...' : 'Guardar Cambios Web'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── RIGHT: Galería de Imágenes ─── */}
              <div className="editor-panel">
                <div className="editor-card editor-card-right">
                  <div className="editor-card-header">
                    <ImageIcon size={16} />
                    <h3>Galería de Imágenes</h3>
                  </div>

                  <div className="image-card-item">
                    <div className="image-preview-wrapper">
                      {configWeb.hero_imagen ? (
                        <img src={configWeb.hero_imagen} alt="Hero" />
                      ) : (
                        <div className="image-preview-placeholder">
                          <ImageIcon size={32} />
                          <span>Sin imagen de Hero</span>
                        </div>
                      )}
                    </div>
                    <div className="image-card-footer">
                      <label className="image-upload-btn">
                        <Upload size={14} />
                        <span>Cambiar Imagen Hero</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setHeroFile(e.target.files[0])}
                        />
                      </label>
                      {heroFile && <span className="image-file-name">{heroFile.name}</span>}
                    </div>
                  </div>

                  <div className="image-card-item">
                    <div className="image-preview-wrapper">
                      {configWeb.about_imagen ? (
                        <img src={configWeb.about_imagen} alt="Nosotros" />
                      ) : (
                        <div className="image-preview-placeholder">
                          <ImageIcon size={32} />
                          <span>Sin imagen de Nosotros</span>
                        </div>
                      )}
                    </div>
                    <div className="image-card-footer">
                      <label className="image-upload-btn">
                        <Upload size={14} />
                        <span>Cambiar Imagen Nosotros</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAboutFile(e.target.files[0])}
                        />
                      </label>
                      {aboutFile && <span className="image-file-name">{aboutFile.name}</span>}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </section>

      {/* 2. Imagen de fondo del inicio de sesión */}
      <section>
        <h2 className="section-card-title">
          <Camera size={18} />
          Imagen de fondo del inicio de sesión
        </h2>
        {loadingConfig ? (
          <p style={{ textAlign: 'center', padding: '48px', color: '#807471', fontSize: '14px', fontWeight: 500 }}>Cargando configuración...</p>
        ) : (
          <form onSubmit={handleSaveConfigWeb}>
            <div className="editor-card">
              <div className="image-card-item" style={{ marginBottom: 0 }}>
                <div className="image-preview-wrapper login-image-preview">
                  {configWeb.login_imagen ? (
                    <img src={configWeb.login_imagen} alt="Fondo del inicio de sesión" />
                  ) : (
                    <div className="image-preview-placeholder">
                      <ImageIcon size={32} />
                      <span>Sin imagen de fondo</span>
                    </div>
                  )}
                </div>
                <div className="image-card-footer">
                  <label className="image-upload-btn">
                    <Camera size={14} />
                    <span>Cambiar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLoginFile(e.target.files[0])}
                    />
                  </label>
                  {loginFile && <span className="image-file-name">{loginFile.name}</span>}
                  <div style={{ marginLeft: 'auto' }}>
                    <button type="submit" className="btn-primary" disabled={isSavingConfig}>
                      {isSavingConfig ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* 3. Colección General */}
      <section>
        <h2 className="section-card-title">
          <Eye size={18} />
          Colección General (Obras Públicas)
        </h2>
        {loadingObras ? (
          <p style={{ textAlign: 'center', padding: '48px', color: '#807471', fontSize: '14px', fontWeight: 500 }}>Cargando obras...</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="obras-grid-container" style={{ minWidth: '640px' }}>
              <div className="obras-grid-header">
                <div className="og-col-img whitespace-nowrap">IMAGEN</div>
                <div className="og-col-code whitespace-nowrap">CÓDIGO</div>
                <div className="og-col-title whitespace-nowrap">OBRA / PIEZA</div>
                <div className="og-col-toggle whitespace-nowrap">WEB (PÚBLICA)</div>
              </div>

              {(() => {
                const totalPagesObras = Math.ceil(obrasColeccion.length / itemsPerPage)
                const paginatedObras = obrasColeccion.slice((currentPageObras - 1) * itemsPerPage, currentPageObras * itemsPerPage)
                return paginatedObras.map(obra => {
                  const coverImage = obra.multimedia && obra.multimedia[0] ? obra.multimedia[0].url_archivo : null;
                  return (
                    <div key={obra.id_obra} className="obras-grid-row">
                      <div className="og-col-img">
                        {coverImage ? (
                          <img src={coverImage} alt={obra.titulo} />
                        ) : (
                          <div className="og-thumb-placeholder">
                            <Camera size={20} />
                          </div>
                        )}
                      </div>
                      <div className="og-col-code whitespace-nowrap">{obra.codigo_qr_link}</div>
                      <div className="og-col-title whitespace-nowrap">
                        <span className="og-title-text">{obra.titulo}</span>
                      </div>
                      <div className="og-col-toggle whitespace-nowrap">
                        <label className="toggle-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={obra.destacado_galeria === 'si'}
                            onChange={() => handleToggleObraDestacado(obra.id_obra)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  );
                })
              })()}

              {obrasColeccion.length === 0 && (
                <div className="obras-grid-empty">No hay obras en el inventario.</div>
              )}

              {(() => {
                const totalPagesObras = Math.ceil(obrasColeccion.length / itemsPerPage)
                return totalPagesObras > 1 && (
                  <div className="pagination-footer" style={{ marginTop: '16px' }}>
                    <button className="page-item-btn" disabled={currentPageObras === 1} onClick={() => setCurrentPageObras(p => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
                    {Array.from({ length: totalPagesObras }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-number-btn ${currentPageObras === p ? 'active' : ''}`} onClick={() => setCurrentPageObras(p)}>{p}</button>
                    ))}
                    <button className="page-item-btn" disabled={currentPageObras === totalPagesObras} onClick={() => setCurrentPageObras(p => Math.min(totalPagesObras, p + 1))}><ChevronRight size={16} /></button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </section>

      {/* 3-4. Exposiciones y Efemérides: un único botón crea cualquiera de los dos */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn-primary" onClick={abrirSelectorCrear} style={{ padding: '10px 20px', fontSize: '13px', boxShadow: '0 4px 12px rgba(180, 83, 60, 0.2)' }}>
          <Plus size={16} /> Efeméride / Exposición
        </button>
      </div>

      {/* 4. Exposiciones */}
      <section>
        <h2 className="section-card-title">
          <Layers size={18} />
          Exposiciones Virtuales
        </h2>
        {loadingExposiciones ? (
          <p style={{ textAlign: 'center', padding: '48px', color: '#807471', fontSize: '14px', fontWeight: 500 }}>Cargando exposiciones...</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="data-grid" style={{ minWidth: '900px' }}>
              <div className="dg-header expo-header">
                <div className="whitespace-nowrap">EXPOSICIÓN</div>
                <div className="whitespace-nowrap">ORGANIZADOR</div>
                <div className="whitespace-nowrap">DESCRIPCIÓN</div>
                <div className="whitespace-nowrap">LUGAR</div>
                <div className="whitespace-nowrap">ESTATUS (WEB)</div>
                <div className="whitespace-nowrap">FECHAS</div>
                <div className="dg-col-center whitespace-nowrap">ACCIONES</div>
              </div>

              {(() => {
                const totalPagesExpos = Math.ceil(exposiciones.length / itemsPerPage)
                const paginatedExpos = exposiciones.slice((currentPageExpos - 1) * itemsPerPage, currentPageExpos * itemsPerPage)
                return paginatedExpos.map(expo => (
                  <div key={expo.id_exposicion} className="dg-row expo-row">
                    <div className="dg-title whitespace-nowrap">{expo.nombre_exposicion}</div>
                    <div className="dg-secondary whitespace-nowrap">{expo.organizador || 'N/A'}</div>
                    <div className="dg-secondary whitespace-nowrap">{expo.descripcion?.length > 40 ? expo.descripcion.substring(0, 40) + '...' : expo.descripcion}</div>
                    <div className="dg-secondary whitespace-nowrap">{expo.lugar_fisico || 'N/A'}</div>
                    <div className="whitespace-nowrap">
                      <span className={`status-badge ${expo.estatus === 'activa' ? 'activo' : 'inactivo'}`}>
                        {expo.estatus === 'activa' ? 'Pública' : 'Oculta'}
                      </span>
                    </div>
                    <div className="dg-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {expo.fecha_inicio && new Date(expo.fecha_inicio).toLocaleDateString()} - {expo.fecha_fin && new Date(expo.fecha_fin).toLocaleDateString()}
                    </div>
                    <div className="dg-col-center whitespace-nowrap">
                      <div className="icon-btn-group">
                        <button className="icon-btn" title={expo.estatus === 'activa' ? 'Ocultar en Web' : 'Publicar en Web'} onClick={() => handleToggleEstatus(expo)}>
                          {expo.estatus === 'activa' ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="icon-btn" title="Vincular Obras" onClick={() => openObrasModal(expo)}>
                          <Folder size={15} />
                        </button>
                        <button className="icon-btn" onClick={() => openEditModal(expo)}>
                          <Edit2 size={15} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteExposicion(expo.id_exposicion)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              })()}

              {exposiciones.length === 0 && (
                <div className="dg-empty">
                  <Layers size={28} />
                  <span>No hay exposiciones registradas.</span>
                </div>
              )}

              {(() => {
                const totalPagesExpos = Math.ceil(exposiciones.length / itemsPerPage)
                return totalPagesExpos > 1 && (
                  <div className="pagination-footer" style={{ marginTop: '16px' }}>
                    <button className="page-item-btn" disabled={currentPageExpos === 1} onClick={() => setCurrentPageExpos(p => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
                    {Array.from({ length: totalPagesExpos }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-number-btn ${currentPageExpos === p ? 'active' : ''}`} onClick={() => setCurrentPageExpos(p)}>{p}</button>
                    ))}
                    <button className="page-item-btn" disabled={currentPageExpos === totalPagesExpos} onClick={() => setCurrentPageExpos(p => Math.min(totalPagesExpos, p + 1))}><ChevronRight size={16} /></button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </section>

      {/* 5. Efemérides Culturales */}
      <section>
        <h2 className="section-card-title">
          <CalendarDays size={18} />
          Efemérides Culturales
        </h2>
        {loadingEfemerides ? (
          <p style={{ textAlign: 'center', padding: '48px', color: '#807471', fontSize: '14px', fontWeight: 500 }}>Cargando efemérides...</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="data-grid" style={{ minWidth: '700px' }}>
              <div className="dg-header efe-header">
                <div className="whitespace-nowrap">EFEMÉRIDE</div>
                <div className="whitespace-nowrap">FECHA</div>
                <div className="whitespace-nowrap">CATEGORÍA</div>
                <div className="whitespace-nowrap">ESTATUS (WEB)</div>
                <div className="dg-col-center whitespace-nowrap">ACCIONES</div>
              </div>

              {(() => {
                const totalPagesEfeme = Math.ceil(efemerides.length / itemsPerPage)
                const paginatedEfeme = efemerides.slice((currentPageEfeme - 1) * itemsPerPage, currentPageEfeme * itemsPerPage)
                return paginatedEfeme.map(efe => (
                  <div key={efe.id_efemeride} className="dg-row efe-row">
                    <div className="dg-title whitespace-nowrap">{efe.titulo}</div>
                    <div className="dg-secondary whitespace-nowrap">
                      {efe.dia} de {MESES[efe.mes - 1]}{efe.anio_referencia ? ` (${efe.anio_referencia})` : ''}
                    </div>
                    <div className="dg-secondary whitespace-nowrap">{efe.categoria || 'N/A'}</div>
                    <div className="whitespace-nowrap">
                      <span className={`status-badge ${efe.activa ? 'activo' : 'inactivo'}`}>
                        {efe.activa ? 'Pública' : 'Oculta'}
                      </span>
                    </div>
                    <div className="dg-col-center whitespace-nowrap">
                      <div className="icon-btn-group">
                        <button className="icon-btn" title={efe.activa ? 'Ocultar en Web' : 'Publicar en Web'} onClick={() => handleToggleEfemerideActiva(efe)}>
                          {efe.activa ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="icon-btn" onClick={() => openEditEfemerideModal(efe)}>
                          <Edit2 size={15} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteEfemeride(efe.id_efemeride)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              })()}

              {efemerides.length === 0 && (
                <div className="dg-empty">
                  <CalendarDays size={28} />
                  <span>No hay efemérides registradas.</span>
                </div>
              )}

              {(() => {
                const totalPagesEfeme = Math.ceil(efemerides.length / itemsPerPage)
                return totalPagesEfeme > 1 && (
                  <div className="pagination-footer" style={{ marginTop: '16px' }}>
                    <button className="page-item-btn" disabled={currentPageEfeme === 1} onClick={() => setCurrentPageEfeme(p => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
                    {Array.from({ length: totalPagesEfeme }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-number-btn ${currentPageEfeme === p ? 'active' : ''}`} onClick={() => setCurrentPageEfeme(p)}>{p}</button>
                    ))}
                    <button className="page-item-btn" disabled={currentPageEfeme === totalPagesEfeme} onClick={() => setCurrentPageEfeme(p => Math.min(totalPagesEfeme, p + 1))}><ChevronRight size={16} /></button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </section>

      {/* MODAL SELECTOR: Efeméride / Exposición */}
      {isCrearModalOpen && (
        <div className="tw-scope">
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3a200d]/50 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-[2rem] bg-[#F4F0E6] shadow-2xl shadow-black/50 p-10">
              <button
                type="button"
                onClick={() => setIsCrearModalOpen(false)}
                className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir hover:opacity-70"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="text-center text-cafe-noir mb-8">
                <span className="font-sans text-xs uppercase tracking-[0.1em] text-cafe-noir/80">Panel Administrativo</span>
                <h2 className="mt-1 font-sans font-semibold tracking-tight text-2xl sm:text-3xl text-cafe-noir">¿Qué deseas crear?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <button
                  type="button"
                  onClick={() => elegirTipoACrear('efemeride')}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-cafe-noir/20 bg-white/60 p-6 transition-colors hover:border-[#B4533C] hover:bg-white"
                >
                  <CalendarDays className="h-8 w-8 text-[#B4533C]" />
                  <span className="font-sans text-sm font-semibold text-cafe-noir">Efeméride</span>
                </button>
                <button
                  type="button"
                  onClick={() => elegirTipoACrear('exposicion')}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-cafe-noir/20 bg-white/60 p-6 transition-colors hover:border-[#B4533C] hover:bg-white"
                >
                  <Layers className="h-8 w-8 text-[#B4533C]" />
                  <span className="font-sans text-sm font-semibold text-cafe-noir">Exposición</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR EFEMÉRIDE */}
      {isEfemerideModalOpen && (
        <div className="efe-modal-overlay">
          <div className="efe-modal">
            <div className="efe-modal-header">
              {modalMode === 'create' && (
                <button onClick={volverAlSelectorDesdeEfemeride} className="efe-nav-btn" title="Volver a elegir tipo">
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="efe-modal-title-block">
                <span className="efe-modal-breadcrumb">PANEL ADMINISTRATIVO</span>
                <h2 className="efe-modal-title">
                  {modalMode === 'create' ? 'Nueva Efeméride' : 'Editar Efeméride'}
                </h2>
              </div>
              <button onClick={() => setIsEfemerideModalOpen(false)} className="efe-nav-btn" title="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="efe-modal-body">
              <form onSubmit={handleSaveEfemeride} noValidate>
                <div className="efe-field">
                  <label htmlFor="efe-titulo">TÍTULO *</label>
                  <input
                    id="efe-titulo"
                    name="titulo"
                    type="text"
                    value={efemerideForm.titulo}
                    onChange={(e) => setEfemerideForm({ ...efemerideForm, titulo: e.target.value })}
                    placeholder="Ej. Natalicio de Simón Bolívar"
                    required
                  />
                </div>

                <div className="efe-field">
                  <label htmlFor="efe-descripcion">DESCRIPCIÓN</label>
                  <textarea
                    id="efe-descripcion"
                    name="descripcion"
                    value={efemerideForm.descripcion}
                    onChange={(e) => setEfemerideForm({ ...efemerideForm, descripcion: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="efe-field">
                  <label htmlFor="efe-fecha">FECHA HISTÓRICA *</label>
                  <input
                    id="efe-fecha"
                    name="fecha"
                    type="date"
                    required
                    value={efemerideForm.fecha}
                    onChange={(e) => setEfemerideForm({ ...efemerideForm, fecha: e.target.value })}
                  />
                  <p className="efe-field-hint">
                    El día y el mes se repiten cada año; el año elegido queda como año de referencia histórico.
                  </p>
                </div>

                <div className="efe-field">
                  <label>IMAGEN</label>
                  <div className="efe-image-wrapper">
                    <label htmlFor="efe-imagen-input" className="efe-dropzone">
                      {efemerideImagenPreview || efemerideForm.imagen ? (
                        <img
                          src={efemerideImagenPreview || efemerideForm.imagen}
                          alt="Vista previa"
                        />
                      ) : (
                        <div className="efe-dropzone-placeholder">
                          <ImageIcon size={24} />
                          <span>Haz clic para elegir una imagen</span>
                        </div>
                      )}
                    </label>
                    <button
                      type="button"
                      className="efe-image-remove-btn"
                      onClick={() => {
                        setEfemerideImagenFile(null)
                        setEfemerideImagenPreview('')
                        setEfemerideForm({ ...efemerideForm, imagen: '' })
                      }}
                      title="Quitar imagen"
                    >
                      <X size={16} />
                    </button>
                    <input
                      id="efe-imagen-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEfemerideImagenFile(e.target.files[0] || null)}
                      hidden
                    />
                    {efemerideImagenFile && (
                      <span className="efe-file-name">{efemerideImagenFile.name}</span>
                    )}
                  </div>
                </div>

                <label className="efe-checkbox">
                  <input
                    type="checkbox"
                    checked={efemerideForm.activa}
                    onChange={(e) => setEfemerideForm({ ...efemerideForm, activa: e.target.checked })}
                  />
                  <span className="efe-checkbox-mark"></span>
                  <span className="efe-checkbox-label">Visible en la web pública</span>
                </label>

                <button type="submit" className="efe-submit-btn">
                  {modalMode === 'create' ? 'Crear Efeméride' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR EXPOSICION */}
      {isModalOpen && (
        <div className="efe-modal-overlay">
          <div className="efe-modal">
            <div className="efe-modal-header">
              {modalMode === 'create' && (
                <button onClick={volverAlSelectorDesdeExposicion} className="efe-nav-btn" title="Volver a elegir tipo">
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="efe-modal-title-block">
                <span className="efe-modal-breadcrumb">PANEL ADMINISTRATIVO</span>
                <h2 className="efe-modal-title">
                  {modalMode === 'create' ? 'Nueva Exposición' : 'Editar Exposición'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="efe-nav-btn" title="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="efe-modal-body">
              <form onSubmit={handleSaveExposicion} noValidate>
                <div className="efe-field">
                  <label htmlFor="expo-nombre">NOMBRE DE LA EXPOSICIÓN *</label>
                  <input
                    id="expo-nombre"
                    name="nombre_exposicion"
                    type="text"
                    value={expoForm.nombre_exposicion}
                    onChange={(e) => setExpoForm({ ...expoForm, nombre_exposicion: e.target.value })}
                    placeholder="Ej. Ruta de los Libertadores"
                    required
                  />
                </div>

                <div className="efe-field">
                  <label htmlFor="expo-descripcion">DESCRIPCIÓN</label>
                  <textarea
                    id="expo-descripcion"
                    name="descripcion"
                    value={expoForm.descripcion}
                    onChange={(e) => setExpoForm({ ...expoForm, descripcion: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="efe-grid-2col">
                  <div className="efe-field">
                    <label htmlFor="expo-lugar">LUGAR FÍSICO</label>
                    <input
                      id="expo-lugar"
                      name="lugar_fisico"
                      type="text"
                      value={expoForm.lugar_fisico}
                      onChange={(e) => setExpoForm({ ...expoForm, lugar_fisico: e.target.value })}
                      placeholder="Ej. Museo de Bellas Artes"
                    />
                  </div>

                  <div className="efe-field">
                    <label htmlFor="expo-organizador">ORGANIZADOR</label>
                    <input
                      id="expo-organizador"
                      name="organizador"
                      type="text"
                      value={expoForm.organizador}
                      onChange={(e) => setExpoForm({ ...expoForm, organizador: e.target.value })}
                      placeholder="Ej. Ministerio de Cultura"
                    />
                  </div>
                </div>

                <div className="efe-grid-2col">
                  <div className="efe-field">
                    <label htmlFor="expo-fecha-inicio">FECHA INICIO</label>
                    <input
                      id="expo-fecha-inicio"
                      name="fecha_inicio"
                      type="date"
                      value={expoForm.fecha_inicio}
                      onChange={(e) => setExpoForm({ ...expoForm, fecha_inicio: e.target.value })}
                    />
                  </div>

                  <div className="efe-field">
                    <label htmlFor="expo-fecha-fin">FECHA FIN</label>
                    <input
                      id="expo-fecha-fin"
                      name="fecha_fin"
                      type="date"
                      value={expoForm.fecha_fin}
                      onChange={(e) => setExpoForm({ ...expoForm, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="efe-submit-btn">
                  {modalMode === 'create' ? 'Crear Exposición' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VINCULAR OBRAS */}
      {isObrasModalOpen && selectedExpo && (
        <div className="tw-scope">
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3a200d]/50 backdrop-blur-md">
            <div className="relative w-full max-w-3xl h-auto max-h-[90vh] rounded-[2rem] bg-[#F4F0E6] shadow-2xl shadow-black/50 flex flex-col">
              <button
                type="button"
                onClick={() => setIsObrasModalOpen(false)}
                className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir hover:opacity-70"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="relative z-10 w-full overflow-y-auto px-6 py-10 sm:px-12 sm:py-14">
                <div className="text-center text-cafe-noir">
                  <span className="font-sans text-xs uppercase tracking-[0.1em] text-cafe-noir/80">Obras de Exposición</span>
                  <h2 className="mt-1 font-sans font-semibold tracking-tight text-3xl sm:text-4xl text-cafe-noir">
                    {selectedExpo.nombre_exposicion}
                  </h2>
                  <p className="mt-2 font-sans text-sm text-cafe-noir/90">Selecciona las obras a incluir.</p>
                </div>
                <div className="mt-8">
                  <div className="table-container rounded-xl border border-cafe-noir/20 bg-white/50 w-full overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="w-full text-left font-sans" style={{ minWidth: '500px' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#EADFC8', zIndex: 1 }}>
                        <tr className="text-xs uppercase tracking-wider text-cafe-noir/80 border-b border-cafe-noir/20">
                          <th className="py-3 px-4 w-16 text-center whitespace-nowrap">Imagen</th>
                          <th className="py-3 px-4 whitespace-nowrap">Código</th>
                          <th className="py-3 px-4 whitespace-nowrap">Obra / Pieza</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Incluir en Exposición</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obrasColeccion.map(obra => {
                          const isLinked = linkedObrasIds.includes(obra.id_obra)
                          const coverImage = obra.multimedia && obra.multimedia[0] ? obra.multimedia[0].url_archivo : null
                          return (
                            <tr key={obra.id_obra} className="border-b border-cafe-noir/10 hover:bg-white/40">
                              <td className="py-3 px-4">
                                {coverImage ? (
                                  <img src={coverImage} alt={obra.titulo} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', margin: '0 auto' }} />
                                ) : (
                                  <div style={{ width: '40px', height: '40px', backgroundColor: '#e2dacf', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a7a6a', margin: '0 auto' }}><Camera size={20} /></div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-cafe-noir font-medium">{obra.id_obra}</td>
                              <td className="py-3 px-4 text-sm text-cafe-noir/80">{obra.titulo}</td>
                              <td className="py-3 px-4 text-center">
                                <label className="toggle-switch-wrapper inline-block">
                                  <input type="checkbox" checked={isLinked} onChange={() => handleToggleLinkObra(obra.id_obra)} />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ConfiguracionPortal
