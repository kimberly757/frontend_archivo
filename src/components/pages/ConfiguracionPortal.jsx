import React, { useState, useEffect } from 'react'
import {
  Edit2, Trash2, Plus, Monitor, Link as LinkIcon, Folder, FolderOpen, Eye, EyeOff, Camera, Layers, X, Lock as LockIcon, CalendarDays, ArrowLeft, Image as ImageIcon
} from 'lucide-react'
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
  deleteEfemerideRequest,
  getCategoriasRequest
} from '../../services/api'
import SelectInput from '../form/SelectInput'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const EFEMERIDE_FORM_INICIAL = {
  titulo: '', descripcion: '', fecha: '', categoria: '', imagen: '', activa: true,
}
import TextInput from '../form/TextInput'
import Textarea from '../form/Textarea'
import DateInput from '../form/DateInput'

const ConfiguracionPortal = () => {
  const token = localStorage.getItem('auth-token')
  const [iframeKey, setIframeKey] = useState(Date.now())

  const [configWeb, setConfigWeb] = useState({
    hero_titulo: '',
    hero_subtitulo: '',
    about_texto: '',
    contacto_email: '',
    contacto_telefono: '',
    contacto_direccion: '',
    hero_imagen: '',
    about_imagen: '',
    login_titulo: '',
    login_subtitulo: '',
    login_top_label: '',
    login_bottom_label: '',
    login_imagen: ''
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
  const [categorias, setCategorias] = useState([])

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

  useEffect(() => {
    fetchConfigWeb()
    fetchExposiciones()
    fetchObras()
    fetchEfemerides()
    getCategoriasRequest().then(setCategorias).catch(() => setCategorias([]))
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
          hero_imagen: data.hero_imagen || '',
          about_imagen: data.about_imagen || '',
          login_titulo: data.login_titulo || 'Inicio de Sesión',
          login_subtitulo: data.login_subtitulo || 'Patrimonio Cultural Luis Felipe Ramón y Rivera',
          login_top_label: data.login_top_label || 'Ministerio de Cultura',
          login_bottom_label: data.login_bottom_label || 'Sistema de Gestión y Control Patrimonial',
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
      formData.append('login_titulo', configWeb.login_titulo)
      formData.append('login_subtitulo', configWeb.login_subtitulo)
      formData.append('login_top_label', configWeb.login_top_label)
      formData.append('login_bottom_label', configWeb.login_bottom_label)
      
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
      alert("¡Configuración Web actualizada con éxito!")
      setHeroFile(null)
      setAboutFile(null)
      setLoginFile(null)
      fetchConfigWeb()
      setIframeKey(Date.now())
    } catch (error) {
      alert("Error al guardar la configuración web: " + (error.response?.data?.message || error.response?.data?.error || error.message))
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleToggleObraDestacado = async (id_obra) => {
    const obra = obrasColeccion.find(o => o.id_obra === id_obra)
    const nuevoDestacado = obra.destacado_galeria === 'si' ? 'no' : 'si'
    try {
      await updateObraDestacadoRequest(id_obra, nuevoDestacado, token)
      setObrasColeccion(prev => prev.map(o => 
        o.id_obra === id_obra ? { ...o, destacado_galeria: nuevoDestacado } : o
      ))
      setIframeKey(Date.now())
    } catch (error) {
      alert("Error al actualizar destacado de la obra")
    }
  }

  const handleToggleEstatus = async (expo) => {
    const newEstatus = expo.estatus === 'activa' ? 'inactiva' : 'activa'
    try {
      await updateExposicionAdminRequest(expo.id_exposicion, { ...expo, estatus: newEstatus }, token)
      fetchExposiciones()
      setIframeKey(Date.now())
    } catch (error) {
      alert("Error al cambiar estatus")
    }
  }

  const handleDeleteExposicion = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta exposición?")) {
      try {
        await deleteExposicionAdminRequest(id, token)
        setExposiciones(prev => prev.filter(e => e.id_exposicion !== id))
        setIframeKey(Date.now())
      } catch (error) {
        alert("Error al eliminar")
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
      alert(error.message || "Error al guardar la efeméride")
    }
  }

  const handleToggleEfemerideActiva = async (efe) => {
    try {
      await updateEfemerideRequest(efe.id_efemeride, { activa: !efe.activa }, token)
      fetchEfemerides()
      setIframeKey(Date.now())
    } catch (error) {
      alert("Error al cambiar el estatus de la efeméride")
    }
  }

  const handleDeleteEfemeride = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta efeméride?")) {
      try {
        await deleteEfemerideRequest(id, token)
        setEfemerides(prev => prev.filter(e => e.id_efemeride !== id))
        setIframeKey(Date.now())
      } catch (error) {
        alert("Error al eliminar")
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
      alert("Error al guardar exposición")
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
      alert("Error al cambiar vínculo de la obra")
    }
  }

  return (
    <div className="module-container">
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO FOLKLORE</span>
            <span className="separator">/</span>
            <span className="current">CONFIGURACIÓN DEL PORTAL</span>
          </nav>
          <h1>Configuración del Portal</h1>
          <p className="page-subtitle">
            Gestiona el contenido, textos e imágenes de la página de inicio, de nosotros, del login y de las exposiciones virtuales.
          </p>
        </div>
      </header>

      {/* 0. Previsualización en la Web */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={18} style={{ color: '#B4533C' }} />
          Vista Previa del Portal Web
        </h2>
        <div style={{ padding: '4px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', height: '500px', overflow: 'hidden' }}>
          <iframe 
            key={iframeKey}
            src={`http://localhost:5174/?t=${iframeKey}`} 
            title="Previsualización de la Web Pública"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
          />
        </div>
      </section>

      {/* 1. Textos y Contenido de la Web */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-card-title" style={{ marginBottom: '16px' }}>
          <Edit2 size={18} style={{ color: '#B4533C' }} />
          Textos y Contenido de la Web
        </h2>
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          {loadingConfig ? (
            <p className="text-sm text-cafe-noir/60 text-center py-8">Cargando configuración...</p>
          ) : (
            <form onSubmit={handleSaveConfigWeb} className="tw-scope space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput 
                  label="Título Principal (Hero)" 
                  name="hero_titulo" 
                  value={configWeb.hero_titulo} 
                  onChange={(e) => setConfigWeb({...configWeb, hero_titulo: e.target.value})}
                  placeholder="Ej. Táchira: Cuna de Tradición"
                />
                <TextInput 
                  label="Subtítulo (Hero)" 
                  name="hero_subtitulo" 
                  value={configWeb.hero_subtitulo} 
                  onChange={(e) => setConfigWeb({...configWeb, hero_subtitulo: e.target.value})}
                  placeholder="Ej. Preservando el folklore..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a3b32' }}>Imagen de Fondo (Hero)</label>
                  {configWeb.hero_imagen && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eaeaea', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f8f6' }}>
                      <img src={configWeb.hero_imagen} alt="Hero actual" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setHeroFile(e.target.files[0])}
                    style={{ fontSize: '12px' }}
                  />
                  {heroFile && <span style={{ fontSize: '11px', color: '#B4533C' }}>Nueva: {heroFile.name}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a3b32' }}>Imagen de la Sección Nosotros</label>
                  {configWeb.about_imagen && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eaeaea', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f8f6' }}>
                      <img src={configWeb.about_imagen} alt="Nosotros actual" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setAboutFile(e.target.files[0])}
                    style={{ fontSize: '12px' }}
                  />
                  {aboutFile && <span style={{ fontSize: '11px', color: '#B4533C' }}>Nueva: {aboutFile.name}</span>}
                </div>
              </div>

              <Textarea 
                label="Texto: Acerca del Archivo" 
                name="about_texto" 
                value={configWeb.about_texto} 
                onChange={(e) => setConfigWeb({...configWeb, about_texto: e.target.value})}
                placeholder="Escribe la historia o propósito del archivo..."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TextInput 
                  label="Email de Contacto" 
                  name="contacto_email" 
                  type="email"
                  value={configWeb.contacto_email} 
                  onChange={(e) => setConfigWeb({...configWeb, contacto_email: e.target.value})}
                />
                <TextInput 
                  label="Teléfono de Contacto" 
                  name="contacto_telefono" 
                  value={configWeb.contacto_telefono} 
                  onChange={(e) => setConfigWeb({...configWeb, contacto_telefono: e.target.value})}
                />
                <TextInput 
                  label="Dirección Física" 
                  name="contacto_direccion" 
                  value={configWeb.contacto_direccion} 
                  onChange={(e) => setConfigWeb({...configWeb, contacto_direccion: e.target.value})}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-terracota" disabled={isSavingConfig}>
                  {isSavingConfig ? 'Guardando Cambios...' : 'Guardar Cambios Web'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 2. Personalización del Login */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LockIcon size={18} style={{ color: '#B4533C' }} />
          Personalización del Login
        </h2>
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          {loadingConfig ? (
            <p className="text-sm text-cafe-noir/60 text-center py-8">Cargando configuración...</p>
          ) : (
            <form onSubmit={handleSaveConfigWeb} className="tw-scope space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput 
                  label="Etiqueta Superior (Ej. Ministerio de Cultura)" 
                  name="login_top_label" 
                  value={configWeb.login_top_label} 
                  onChange={(e) => setConfigWeb({...configWeb, login_top_label: e.target.value})}
                  placeholder="Ej. Ministerio de Cultura"
                />
                <TextInput 
                  label="Título de Inicio de Sesión" 
                  name="login_titulo" 
                  value={configWeb.login_titulo} 
                  onChange={(e) => setConfigWeb({...configWeb, login_titulo: e.target.value})}
                  placeholder="Ej. Archivo Regional de Folklore"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput 
                  label="Subtítulo del Login" 
                  name="login_subtitulo" 
                  value={configWeb.login_subtitulo} 
                  onChange={(e) => setConfigWeb({...configWeb, login_subtitulo: e.target.value})}
                  placeholder="Ej. Patrimonio Cultural Luis Felipe Ramón y Rivera"
                />
                <TextInput 
                  label="Etiqueta Inferior (Ej. Sistema de Gestión...)" 
                  name="login_bottom_label" 
                  value={configWeb.login_bottom_label} 
                  onChange={(e) => setConfigWeb({...configWeb, login_bottom_label: e.target.value})}
                  placeholder="Ej. Sistema de Gestión y Control Patrimonial"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '380px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a3b32' }}>Imagen de Fondo de Login</label>
                {configWeb.login_imagen && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eaeaea', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f8f6' }}>
                    <img src={configWeb.login_imagen} alt="Login actual" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setLoginFile(e.target.files[0])}
                  style={{ fontSize: '12px' }}
                />
                {loginFile && <span style={{ fontSize: '11px', color: '#B4533C' }}>Nueva: {loginFile.name}</span>}
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-terracota" disabled={isSavingConfig}>
                  {isSavingConfig ? 'Guardando Cambios...' : 'Guardar Cambios de Login'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 2. Colección General */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-card-title" style={{ marginBottom: '16px' }}>
          <Eye size={18} style={{ color: '#B4533C' }} />
          Colección General (Obras Públicas)
        </h2>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          {loadingObras ? (
            <p className="text-sm text-cafe-noir/60 text-center py-8">Cargando obras...</p>
          ) : (
            <div className="table-container overflow-x-auto rounded-xl border border-cafe-noir/20 bg-white/50">
              <table className="w-full text-left font-sans">
                <thead style={{ backgroundColor: '#f9f8f6' }}>
                  <tr className="text-xs uppercase tracking-wider text-cafe-noir/80 border-b border-cafe-noir/10">
                    <th className="py-4 px-4 w-16 text-center">Imagen</th>
                    <th className="py-4 px-4">Código</th>
                    <th className="py-4 px-4">Obra / Pieza</th>
                    <th className="py-4 px-4 text-center">Web (Pública)</th>
                  </tr>
                </thead>
                <tbody>
                    {obrasColeccion.map(obra => {
                      const coverImage = obra.multimedia && obra.multimedia[0] ? obra.multimedia[0].url_archivo : null;
                      return (
                        <tr key={obra.id_obra} className="border-b border-cafe-noir/5 hover:bg-cafe-noir/5 transition-colors">
                          <td className="py-3 px-4">
                            {coverImage ? (
                              <img src={coverImage} alt={obra.titulo} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', margin: '0 auto' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', backgroundColor: '#e2dacf', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a7a6a', margin: '0 auto' }}>
                                <Camera size={20} />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-cafe-noir">{obra.codigo_qr_link}</td>
                      <td className="py-3 px-4 text-sm text-cafe-noir/80">{obra.titulo}</td>
                      <td className="py-3 px-4 text-center">
                        <label className="toggle-switch-wrapper inline-block">
                          <input 
                            type="checkbox" 
                            checked={obra.destacado_galeria === 'si'}
                            onChange={() => handleToggleObraDestacado(obra.id_obra)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
                  {obrasColeccion.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-sm text-cafe-noir/40">No hay obras en el inventario.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 3-4. Exposiciones y Efemérides: un único botón crea cualquiera de los dos */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn-terracota flex items-center gap-2" onClick={abrirSelectorCrear} style={{ padding: '8px 16px', fontSize: '13px' }}>
          <Plus size={16} /> Efeméride / Exposición
        </button>
      </div>

      {/* 3. Exposiciones */}
      <section>
        <div style={{ marginBottom: '16px' }}>
          <h2 className="section-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#B4533C' }} />
            Exposiciones Virtuales
          </h2>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          {loadingExposiciones ? (
            <p className="text-sm text-cafe-noir/60 text-center py-8">Cargando exposiciones...</p>
          ) : (
            <div className="table-container overflow-x-auto rounded-xl border border-cafe-noir/20 bg-white/50">
              <table className="w-full text-left font-sans">
                <thead style={{ backgroundColor: '#f9f8f6' }}>
                  <tr className="text-xs uppercase tracking-wider text-cafe-noir/80 border-b border-cafe-noir/10">
                    <th className="py-4 px-4">Exposición</th>
                    <th className="py-4 px-4">Organizador</th>
                    <th className="py-4 px-4">Descripción</th>
                    <th className="py-4 px-4">Lugar</th>
                    <th className="py-4 px-4">Estatus (Web)</th>
                    <th className="py-4 px-4">Fechas</th>
                    <th className="py-4 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {exposiciones.map(expo => (
                    <tr key={expo.id_exposicion} className="border-b border-cafe-noir/5 hover:bg-cafe-noir/5">
                      <td className="py-3 px-4 text-base font-bold text-cafe-noir">{expo.nombre_exposicion}</td>
                      <td className="py-3 px-4 text-sm text-cafe-noir/70">{expo.organizador || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-cafe-noir/70">{expo.descripcion?.length > 40 ? expo.descripcion.substring(0,40)+'...' : expo.descripcion}</td>
                      <td className="py-3 px-4 text-sm text-cafe-noir/70">{expo.lugar_fisico || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          backgroundColor: expo.estatus === 'activa' ? '#E1F5FE' : '#F5F5F5',
                          color: expo.estatus === 'activa' ? '#0277BD' : '#757575'
                        }}>
                          {expo.estatus === 'activa' ? 'Pública' : 'Oculta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-cafe-noir/60">
                        {expo.fecha_inicio && new Date(expo.fecha_inicio).toLocaleDateString()} - 
                        {expo.fecha_fin && new Date(expo.fecha_fin).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 rounded-full hover:bg-cafe-noir/10" title={expo.estatus === 'activa' ? 'Ocultar en Web' : 'Publicar en Web'} onClick={() => handleToggleEstatus(expo)}>
                            {expo.estatus === 'activa' ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button className="p-2 rounded-full hover:bg-cafe-noir/10" title="Vincular Obras" onClick={() => openObrasModal(expo)}>
                            <Folder size={16} />
                          </button>
                          <button className="p-2 rounded-full hover:bg-cafe-noir/10" onClick={() => openEditModal(expo)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 rounded-full hover:bg-red-50 text-red-500" onClick={() => handleDeleteExposicion(expo.id_exposicion)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {exposiciones.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-sm text-cafe-noir/40">No hay exposiciones registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 4. Efemérides Culturales */}
      <section style={{ marginTop: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 className="section-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} style={{ color: '#B4533C' }} />
            Efemérides Culturales
          </h2>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          {loadingEfemerides ? (
            <p className="text-sm text-cafe-noir/60 text-center py-8">Cargando efemérides...</p>
          ) : (
            <div className="table-container overflow-x-auto rounded-xl border border-cafe-noir/20 bg-white/50">
              <table className="w-full text-left font-sans">
                <thead style={{ backgroundColor: '#f9f8f6' }}>
                  <tr className="text-xs uppercase tracking-wider text-cafe-noir/80 border-b border-cafe-noir/10">
                    <th className="py-4 px-4">Efeméride</th>
                    <th className="py-4 px-4">Fecha</th>
                    <th className="py-4 px-4">Categoría</th>
                    <th className="py-4 px-4">Estatus (Web)</th>
                    <th className="py-4 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {efemerides.map(efe => (
                    <tr key={efe.id_efemeride} className="border-b border-cafe-noir/5 hover:bg-cafe-noir/5">
                      <td className="py-3 px-4 text-base font-bold text-cafe-noir">{efe.titulo}</td>
                      <td className="py-3 px-4 text-sm text-cafe-noir/70">
                        {efe.dia} de {MESES[efe.mes - 1]}{efe.anio_referencia ? ` (${efe.anio_referencia})` : ''}
                      </td>
                      <td className="py-3 px-4 text-sm text-cafe-noir/70">{efe.categoria || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: efe.activa ? '#E1F5FE' : '#F5F5F5',
                          color: efe.activa ? '#0277BD' : '#757575'
                        }}>
                          {efe.activa ? 'Pública' : 'Oculta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 rounded-full hover:bg-cafe-noir/10" title={efe.activa ? 'Ocultar en Web' : 'Publicar en Web'} onClick={() => handleToggleEfemerideActiva(efe)}>
                            {efe.activa ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button className="p-2 rounded-full hover:bg-cafe-noir/10" onClick={() => openEditEfemerideModal(efe)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 rounded-full hover:bg-red-50 text-red-500" onClick={() => handleDeleteEfemeride(efe.id_efemeride)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {efemerides.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-sm text-cafe-noir/40">No hay efemérides registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        <div className="tw-scope">
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3a200d]/50 backdrop-blur-md">
            <div className="relative w-full max-w-2xl h-auto max-h-[90vh] rounded-[2rem] bg-[#F4F0E6] shadow-2xl shadow-black/50 flex flex-col">
              {modalMode === 'create' && (
                <button
                  type="button"
                  onClick={volverAlSelectorDesdeEfemeride}
                  title="Volver a elegir tipo"
                  className="absolute top-6 left-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir hover:opacity-70"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEfemerideModalOpen(false)}
                className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir hover:opacity-70"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="relative z-10 w-full overflow-y-auto px-6 py-10 sm:px-12 sm:py-14 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cafe-noir/20">
                <div className="text-center text-cafe-noir">
                  <span className="font-sans text-xs uppercase tracking-[0.1em] text-cafe-noir/80">Panel Administrativo</span>
                  <h2 className="mt-1 font-sans font-semibold tracking-tight text-3xl sm:text-4xl text-cafe-noir">
                    {modalMode === 'create' ? 'Nueva Efeméride' : 'Editar Efeméride'}
                  </h2>
                </div>
                <div className="mt-10">
                  <form onSubmit={handleSaveEfemeride} className="space-y-7">
                    <TextInput
                      label="Título *"
                      name="titulo"
                      value={efemerideForm.titulo}
                      onChange={(e) => setEfemerideForm({ ...efemerideForm, titulo: e.target.value })}
                      placeholder="Ej. Natalicio de Simón Bolívar"
                      required
                    />
                    <Textarea
                      label="Descripción"
                      name="descripcion"
                      value={efemerideForm.descripcion}
                      onChange={(e) => setEfemerideForm({ ...efemerideForm, descripcion: e.target.value })}
                    />
                    <DateInput
                      label="Fecha Histórica"
                      name="fecha"
                      required
                      value={efemerideForm.fecha}
                      onChange={(e) => setEfemerideForm({ ...efemerideForm, fecha: e.target.value })}
                    />
                    <p className="-mt-4 font-sans text-xs text-cafe-noir/50">
                      El día y el mes se repiten cada año; el año elegido queda como año de referencia histórico.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
                      <SelectInput
                        label="Categoría"
                        name="categoria"
                        value={efemerideForm.categoria}
                        onChange={(e) => setEfemerideForm({ ...efemerideForm, categoria: e.target.value })}
                        options={categorias.map((c) => ({ value: c.nombre, label: c.nombre }))}
                      />
                      <div className="flex flex-col gap-2">
                        <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">Imagen</span>
                        <label
                          htmlFor="efemeride-imagen-input"
                          className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-cafe-noir/25 bg-white/50 transition-colors hover:border-[#B4533C] hover:bg-white"
                        >
                          {efemerideImagenPreview || efemerideForm.imagen ? (
                            <img
                              src={efemerideImagenPreview || efemerideForm.imagen}
                              alt="Vista previa de la efeméride"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="h-6 w-6 text-cafe-noir/30" />
                              <span className="font-sans text-xs text-cafe-noir/50">Haz clic para elegir una imagen</span>
                            </>
                          )}
                        </label>
                        <input
                          id="efemeride-imagen-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEfemerideImagenFile(e.target.files[0] || null)}
                          className="hidden"
                        />
                        {efemerideImagenFile && (
                          <span className="font-sans text-xs text-[#B4533C]">Nueva imagen: {efemerideImagenFile.name}</span>
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={efemerideForm.activa}
                        onChange={(e) => setEfemerideForm({ ...efemerideForm, activa: e.target.checked })}
                      />
                      <span className="font-sans text-sm text-cafe-noir">Visible en la web pública</span>
                    </label>
                    <div className="pt-6">
                      <button type="submit" className="w-full rounded-full bg-[#8E412E] py-4 font-sans text-sm font-semibold text-white shadow-md transition-all hover:bg-[#A94F38]">
                        {modalMode === 'create' ? 'Crear Efeméride' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR EXPOSICION */}
      {isModalOpen && (
        <div className="tw-scope">
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3a200d]/50 backdrop-blur-md">
            <div className="relative w-full max-w-2xl h-auto max-h-[90vh] rounded-[2rem] bg-[#F4F0E6] shadow-2xl shadow-black/50 flex flex-col">
              {modalMode === 'create' && (
                <button
                  type="button"
                  onClick={volverAlSelectorDesdeExposicion}
                  title="Volver a elegir tipo"
                  className="absolute top-6 left-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir hover:opacity-70"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir hover:opacity-70"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="relative z-10 w-full overflow-y-auto px-6 py-10 sm:px-12 sm:py-14 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cafe-noir/20">
                <div className="text-center text-cafe-noir">
                  <span className="font-sans text-xs uppercase tracking-[0.1em] text-cafe-noir/80">Panel Administrativo</span>
                  <h2 className="mt-1 font-sans font-semibold tracking-tight text-3xl sm:text-4xl text-cafe-noir">
                    {modalMode === 'create' ? 'Nueva Exposición' : 'Editar Exposición'}
                  </h2>
                </div>
                <div className="mt-10">
                  <form onSubmit={handleSaveExposicion} className="space-y-7">
                    <TextInput 
                      label="Nombre de la Exposición *" 
                      name="nombre_exposicion" 
                      value={expoForm.nombre_exposicion} 
                      onChange={(e) => setExpoForm({...expoForm, nombre_exposicion: e.target.value})}
                      required
                    />
                    <Textarea 
                      label="Descripción" 
                      name="descripcion" 
                      value={expoForm.descripcion} 
                      onChange={(e) => setExpoForm({...expoForm, descripcion: e.target.value})}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <TextInput 
                        label="Lugar Físico" 
                        name="lugar_fisico" 
                        value={expoForm.lugar_fisico} 
                        onChange={(e) => setExpoForm({...expoForm, lugar_fisico: e.target.value})}
                      />
                      <TextInput 
                        label="Organizador" 
                        name="organizador" 
                        value={expoForm.organizador} 
                        onChange={(e) => setExpoForm({...expoForm, organizador: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <label className="flex flex-col gap-2">
                        <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">Fecha Inicio</span>
                        <input 
                          type="date" 
                          value={expoForm.fecha_inicio} 
                          onChange={(e) => setExpoForm({...expoForm, fecha_inicio: e.target.value})} 
                          className="w-full rounded-xl border border-cafe-noir/30 bg-white/50 px-4 py-2.5 font-sans text-cafe-noir"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">Fecha Fin</span>
                        <input 
                          type="date" 
                          value={expoForm.fecha_fin} 
                          onChange={(e) => setExpoForm({...expoForm, fecha_fin: e.target.value})} 
                          className="w-full rounded-xl border border-cafe-noir/30 bg-white/50 px-4 py-2.5 font-sans text-cafe-noir"
                        />
                      </label>
                    </div>
                    <div className="pt-6">
                      <button type="submit" className="w-full rounded-full bg-[#8E412E] py-4 font-sans text-sm font-semibold text-white shadow-md transition-all hover:bg-[#A94F38]">
                        {modalMode === 'create' ? 'Crear Exposición' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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
                  <div className="table-container rounded-xl border border-cafe-noir/20 bg-white/50" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="w-full text-left font-sans">
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#EADFC8', zIndex: 1 }}>
                        <tr className="text-xs uppercase tracking-wider text-cafe-noir/80 border-b border-cafe-noir/20">
                          <th className="py-3 px-4 w-16 text-center">Imagen</th>
                          <th className="py-3 px-4">Código</th>
                          <th className="py-3 px-4">Obra / Pieza</th>
                          <th className="py-3 px-4 text-center">Incluir en Exposición</th>
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
