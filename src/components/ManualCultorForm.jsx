import { useState, useEffect, useCallback } from 'react'

import TextInput from './form/TextInput'
import SelectInput from './form/SelectInput'
import DateInput from './form/DateInput'
import Textarea from './form/Textarea'
import Dropzone from './form/Dropzone'
import Checkbox from './form/Checkbox'
import Radio from './form/Radio'
import { ingresoManualCultorRequest, validarCedulaRequest, getParroquiasByMunicipioRequest, getMunicipiosRequest, getOficiosRequest } from '../services/api'
import { enviarCredenciales } from '../services/emailNotifications'

// Copia adaptada de RegisterForm.jsx (vite-project, web pública), mismos campos —
// pero a diferencia de la postulación pública, este ingreso usa la ruta protegida
// POST /api/cultores/ingreso-manual: el cultor queda APROBADO de inmediato (no
// 'pendiente') y el backend crea su Usuario+contraseña en la misma llamada. Por eso,
// al tener éxito, se dispara el correo de credenciales — no pasa por Pre-registro.

const generos = ['Femenino', 'Masculino', 'Otro']

const funcionalidades = ['Utilitaria', 'Decorativa', 'Ceremonial']

const recaudosRequeridos = [
  'Resumen curricular del oficio',
  'Fotografías del proceso productivo',
  'Fotografías de las obras terminadas',
  'Constancia de residencia',
  'Certificado (si cuenta con el)',
]

const prefijosCedula = ['V', 'E']
const prefijosTelefono = ['0414', '0424', '0416', '0426', '0412', '0422', '0276']

// Los nombres de estos campos coinciden EXACTAMENTE con las columnas de la tabla
// `cultores` que acepta el backend (cultoresCreateSchema), para enviarlos tal cual.
// cedula y telefono_contacto NO viven aquí: se componen aparte (prefijo + número) y
// se ensamblan en el formato exacto que exige el backend justo antes de enviarse.
const initialFormState = {
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  seudonimo: '',
  fecha_nacimiento: '',
  genero: '',
  correo_contacto: '',
  direccion_residencia: '',
  id_parroquia: '',
  resumen_curricular: '',
  trayectoria_documentada: '',
}

// Campos que hoy solo existen en la UI (no tienen columna propia en `cultores` todavía:
// oficio/producto pertenecen a tablas de oficios/obras que se conectarán en otro paso).
// Se mantienen aquí solo para no perder la sección visual, pero NO se envían al backend.
// (El campo "firma" se eliminó: nunca tuvo columna en el backend tampoco, y la
// identidad ahora se valida con el documento de cédula adjunto, no con una firma de texto.)
const initialCamposVisualesState = {
  lugarNacimiento: '',
  municipio: '',
  especialidad: '',
  producto: '',
  materiaPrima: '',
  fuenteMateriaPrima: '',
  comercializa: '',
  lugaresVenta: '',
}

function SectionTitle({ children }) {
  return (
    <div className="w-full mb-6">
      <span className="inline-block rounded-full border border-white/30 bg-[#4A3219] px-4 py-1.5 font-sans font-medium text-sm text-white">
        {children}
      </span>
    </div>
  )
}

function ManualCultorForm({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(initialFormState)
  const [camposVisuales, setCamposVisuales] = useState(initialCamposVisualesState)
  const [estaCertificado, setEstaCertificado] = useState(false)
  const [oficiosSeleccionados, setOficiosSeleccionados] = useState([])
  const [clasificacionSeleccionada, setClasificacionSeleccionada] = useState([])
  const [funcionalidadMarcada, setFuncionalidadMarcada] = useState([])
  const [recaudosMarcados, setRecaudosMarcados] = useState([])
  const [archivos, setArchivos] = useState([])
  const [enviado, setEnviado] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [ocrErrores, setOcrErrores] = useState({})
  const [datosOcr, setDatosOcr] = useState(null)

  // Cédula: prefijo V-/E- + dígitos, compuestos en un solo string ("V-12345678")
  // justo antes de enviar, en el formato exacto que valida el backend.
  const [cedulaPrefijo, setCedulaPrefijo] = useState('V')
  const [cedulaNumero, setCedulaNumero] = useState('')

  // Teléfono: prefijo venezolano válido + 7 dígitos ("0414-1234567").
  const [telefonoPrefijo, setTelefonoPrefijo] = useState('0414')
  const [telefonoNumero, setTelefonoNumero] = useState('')

  // Foto/documento de cédula: OBLIGATORIO para validar identidad (bloquea el envío si
  // está vacío). Se valida por OCR contra el formulario ANTES de crear el cultor (ver
  // handleSubmit): si la imagen no es una cédula real o los datos no coinciden, el
  // registro no se crea.
  const [archivoCedula, _setArchivoCedula] = useState([])
  const setArchivoCedula = useCallback((val) => {
    _setArchivoCedula(val)
    setOcrErrores({})
    setDatosOcr(null)
  }, [])

  // Credenciales del cultor recién creado: se muestran SIEMPRE en el modal de éxito
  // (no solo si EmailJS falla) para que el admin pueda copiarlas de inmediato.
  const [credencialesRegistro, setCredencialesRegistro] = useState(null)

  // Municipios de la BD (ruta pública)
  const [municipiosList, setMunicipiosList] = useState([])
  // Parroquias filtradas por municipio (ruta pública)
  const [parroquias, setParroquias] = useState([])

  // Oficios de la BD (ruta pública)
  const [oficiosList, setOficiosList] = useState([])

  useEffect(() => {
    if (!isOpen) return
    getMunicipiosRequest()
      .then(setMunicipiosList)
      .catch(() => setMunicipiosList([]))
    
    getOficiosRequest()
      .then(setOficiosList)
      .catch(() => setOficiosList([]))
  }, [isOpen])

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name in initialFormState) {
      setForm((prev) => ({ ...prev, [name]: value }))
    } else {
      setCamposVisuales((prev) => ({ ...prev, [name]: value }))
    }

    if (ocrErrores[name]) {
      setOcrErrores((prev) => {
        const next = { ...prev }
        delete next[name]
        if (name === 'primer_nombre' || name === 'segundo_nombre') {
          delete next.primer_nombre
          delete next.segundo_nombre
        }
        if (name === 'primer_apellido' || name === 'segundo_apellido') {
          delete next.primer_apellido
          delete next.segundo_apellido
        }
        if (name === 'cedulaPrefijo' || name === 'cedulaNumero' || name === 'cedula') {
          delete next.cedula
        }
        return next
      })
    }

    if (name === 'municipio') {
      // Resetear parroquia si cambia el municipio
      setForm((prev) => ({ ...prev, id_parroquia: '' }))
      if (value) {
        getParroquiasByMunicipioRequest(value)
          .then(setParroquias)
          .catch(() => setParroquias([]))
      } else {
        setParroquias([])
      }
    }
  }

  const toggleEnLista = (lista, setLista, valor) => {
    setLista(
      lista.includes(valor)
        ? lista.filter((item) => item !== valor)
        : [...lista, valor],
    )
  }

  function normalizarTexto(t) {
    return t
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z\s]/gi, '')
      .trim().toUpperCase()
  }

  // A diferencia de normalizarTexto (que descarta dígitos, pensada para nombres),
  // esta conserva letras Y números para poder comparar cédulas de verdad.
  function normalizarCedula(t) {
    return t.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  }

  function palabrasIguales(a, b) {
    const textoA = normalizarTexto(a).replace(/\s+/g, '')
    const textoB = normalizarTexto(b).replace(/\s+/g, '')
    if (!textoA || !textoB) return false
    return textoA === textoB
  }

  function validarOcrContraFormulario(datosOcr) {
    const errores = {}
    const { cedulaExtraida, nombresExtraidos } = datosOcr

    if (cedulaExtraida) {
      const cedulaForm = `${cedulaPrefijo}-${cedulaNumero}`
      if (normalizarCedula(cedulaExtraida) !== normalizarCedula(cedulaForm)) {
        errores.cedula = 'El número de cédula en el formulario no coincide con el de la imagen.'
      }
    }

    if (nombresExtraidos) {
      if (nombresExtraidos.apellidos) {
        const apellidosForm = `${form.primer_apellido} ${form.segundo_apellido || ''}`.trim()
        if (!palabrasIguales(nombresExtraidos.apellidos, apellidosForm)) {
          errores.primer_apellido = 'Los apellidos no coinciden con los de la cédula.'
          errores.segundo_apellido = 'Los apellidos no coinciden con los de la cédula.'
        }
      }

      if (nombresExtraidos.nombres) {
        const nombresForm = `${form.primer_nombre} ${form.segundo_nombre || ''}`.trim()
        if (!palabrasIguales(nombresExtraidos.nombres, nombresForm)) {
          errores.primer_nombre = 'Los nombres no coinciden con los de la cédula.'
          errores.segundo_nombre = 'Los nombres no coinciden con los de la cédula.'
        }
      }
    }

    return errores
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setOcrErrores({})

    // Validación manual de obligatorios: el formulario usa noValidate porque el modal
    // tiene scroll propio y el aviso nativo del navegador ("completa este campo") puede
    // quedar fuera de la vista, dando la impresión de que el botón "no hace nada".
    const camposFaltantes = []
    if (!form.primer_nombre.trim()) camposFaltantes.push('Primer nombre')
    if (!form.primer_apellido.trim()) camposFaltantes.push('Primer apellido')
    if (!cedulaNumero) camposFaltantes.push('Número de cédula')
    if (!form.fecha_nacimiento) camposFaltantes.push('Fecha de nacimiento')
    if (!camposVisuales.municipio) camposFaltantes.push('Municipio de residencia')
    if (!form.correo_contacto.trim()) camposFaltantes.push('Correo electrónico')
    if (camposFaltantes.length > 0) {
      setSubmitError(`Completa los siguientes campos obligatorios: ${camposFaltantes.join(', ')}.`)
      return
    }

    // Bloqueante en el frontend: sin documento de cédula no se puede validar la
    // identidad del cultor.
    if (archivoCedula.length === 0) {
      setSubmitError('Debes adjuntar la foto o documento de la cédula para validar la identidad.')
      return
    }

    if (cedulaNumero.length < 6) {
      setSubmitError('La cédula debe tener al menos 6 dígitos.')
      return
    }

    const archivo = archivoCedula[0]
    setIsSubmitting(true)

    try {
      // Se valida la imagen por OCR y se cruza contra el formulario ANTES de crear el
      // cultor: si la imagen no es una cédula real o los datos no coinciden, se bloquea
      // aquí y el registro nunca llega a crearse (a diferencia del flujo anterior, que
      // creaba el cultor primero y solo avisaba si el documento fallaba después).
      const resultadoOcr = await validarCedulaRequest(archivo)
      setDatosOcr(resultadoOcr)
      const erroresOcr = validarOcrContraFormulario(resultadoOcr)
      if (Object.keys(erroresOcr).length > 0) {
        setOcrErrores(erroresOcr)
        setSubmitError('Los datos del formulario no coinciden con los de la cédula. Revisa los campos marcados.')
        setIsSubmitting(false)
        return
      }

      // Solo se envían los campos que existen como columna real en `cultores`.
      // Los opcionales (ej. correo_contacto, id_parroquia) se omiten si quedaron vacíos:
      // el backend valida formato/tipo cuando el campo SÍ viene presente, aunque sea opcional.
      // Se manda todo junto (datos + cédula + soportes) en UNA petición multipart: el
      // backend crea el cultor SOLO si todos los documentos adjuntados se guardan
      // correctamente (todo o nada, ver cultoresController.ingresoManual). Ya no existe
      // un estado intermedio de "registro creado pero sin documento".
      const formData = new FormData()
      Object.entries(form).forEach(([campo, valor]) => {
        if (valor !== '') formData.append(campo, valor)
      })
      formData.append('cedula', `${cedulaPrefijo}-${cedulaNumero}`)
      formData.append('esta_certificado', estaCertificado)
      if (telefonoNumero) {
        formData.append('telefono_contacto', `${telefonoPrefijo}-${telefonoNumero}`)
      }
      formData.append('archivo_cedula', archivo)
      archivos.forEach((soporte) => formData.append('archivos_soporte', soporte))

      const token = localStorage.getItem('auth-token')
      const respuesta = await ingresoManualCultorRequest(formData, token)

      // Guardar credenciales ANTES de resetear el formulario, para mostrarlas
      // en el modal de éxito (el admin las ve y copia siempre, no solo si falla
      // el correo).
      const { correo, nombre, passwordTemporal } = respuesta.credencialesNuevas
      setCredencialesRegistro({ correo, nombre, passwordTemporal })

      setForm(initialFormState)
      setCamposVisuales(initialCamposVisualesState)
      setCedulaPrefijo('V')
      setCedulaNumero('')
      setTelefonoPrefijo('0414')
      setTelefonoNumero('')
      setArchivoCedula([])
      setEstaCertificado(false)
      setOficiosSeleccionados([])
      setClasificacionSeleccionada([])
      setFuncionalidadMarcada([])
      setRecaudosMarcados([])
      setArchivos([])
      setDatosOcr(null)
      setOcrErrores({})
      setEnviado(true)
      onSuccess?.()

      // Envío de correo en segundo plano: si falla, el admin ya tiene las
      // credenciales visibles en el modal de éxito.
      try {
        await enviarCredenciales({ correo, nombre, password: passwordTemporal, rol_usuario: 'Cultor' })
      } catch {
        // Silencioso: las credenciales ya están en pantalla
      }
    } catch (error) {
      // El backend también responde 400 cuando falta correo_contacto o el archivo de
      // cédula (mensajes propios, ya amigables) — solo se traduce el 400 de restricción
      // única (cédula/correo duplicados), que llega como un error genérico de Sequelize,
      // no como mensaje propio.
      const esFaltaCorreo = error.message?.includes('requiere correo_contacto')
      const esFaltaCedula = error.message?.includes('documento de la cédula') || error.message?.includes('documento de identidad')
      const esDuplicado = error.cause?.response?.status === 400 && !esFaltaCorreo && !esFaltaCedula
      setSubmitError(
        esDuplicado
          ? 'Los datos ingresados (cédula o correo) ya se encuentran registrados en el sistema.'
          : error.message
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="tw-scope">
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3a200d]/50 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-auto max-h-[90vh] rounded-[2rem] bg-[#F4F0E6] shadow-2xl shadow-black/50 flex flex-col">

        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir transition-opacity hover:opacity-70"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenido scrollable del modal con barra de desplazamiento estilizada */}
        <div className="relative z-10 w-full overflow-y-auto px-6 py-10 sm:px-12 sm:py-14 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cafe-noir/20 hover:scrollbar-thumb-cafe-noir/40 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cafe-noir/20 hover:[&::-webkit-scrollbar-thumb]:bg-cafe-noir/40">
        <div className="text-center text-cafe-noir">
          <span className="font-sans text-xs uppercase tracking-[0.1em] text-cafe-noir/80">
            Panel Administrativo · Archivo Táchira
          </span>
          <h2 className="mt-1 font-sans font-semibold tracking-tight text-3xl sm:text-4xl text-cafe-noir">
            Ingreso Manual de Cultor
          </h2>
          <p className="mt-2 font-sans text-sm text-cafe-noir/90">
            Registra a un artesano directamente desde el panel. Queda aprobado de inmediato
            y recibe sus credenciales de acceso por correo — no pasa por Pre-registro.
          </p>
        </div>

        <div className="mt-10">
          <form onSubmit={handleSubmit} noValidate className="space-y-14">
          {/* Sección I: Datos Personales */}
          <div className="space-y-0">
            <SectionTitle>I. Datos Personales</SectionTitle>
            <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
              <TextInput
                label="Primer Nombre"
                name="primer_nombre"
                required
                value={form.primer_nombre}
                onChange={handleChange}
                placeholder="Ej. María"
                error={ocrErrores.primer_nombre}
              />
              <TextInput
                label="Segundo nombre"
                name="segundo_nombre"
                value={form.segundo_nombre}
                onChange={handleChange}
                placeholder="Ej. Fernanda"
                error={ocrErrores.segundo_nombre}
              />
              <TextInput
                label="Primer Apellido"
                name="primer_apellido"
                required
                value={form.primer_apellido}
                onChange={handleChange}
                placeholder="Ej. Useche"
                error={ocrErrores.primer_apellido}
              />
              <TextInput
                label="Segundo apellido"
                name="segundo_apellido"
                value={form.segundo_apellido}
                onChange={handleChange}
                placeholder="Ej. Pérez"
                error={ocrErrores.segundo_apellido}
              />
              <TextInput
                label="Seudónimo"
                name="seudonimo"
                value={form.seudonimo}
                onChange={handleChange}
                placeholder="Ej. El Artesano de Capacho"
              />
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                  Cédula de identidad <span> *</span>
                </span>
                <div className={`flex items-center w-full bg-white/50 border rounded-xl overflow-hidden transition-colors focus-within:ring-1 ${ocrErrores.cedula ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-400' : 'border-cafe-noir/30 focus-within:border-cafe-noir focus-within:ring-1 focus-within:ring-cafe-noir'}`}>
                  <select
                    value={cedulaPrefijo}
                    onChange={(e) => { setCedulaPrefijo(e.target.value); setOcrErrores((prev) => { const n = { ...prev }; delete n.cedula; return n }) }}
                    className="bg-transparent border-none outline-none focus:ring-0 py-2.5 pl-3 pr-2 font-sans text-sm text-cafe-noir cursor-pointer"
                  >
                    {prefijosCedula.map((prefijo) => (
                      <option key={prefijo} value={prefijo}>{prefijo}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={cedulaNumero}
                    onChange={(e) => { setCedulaNumero(e.target.value.replace(/\D/g, '').slice(0, 8)); setOcrErrores((prev) => { const n = { ...prev }; delete n.cedula; return n }) }}
                    placeholder="12345678"
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-2.5 pr-4 font-sans text-sm text-cafe-noir placeholder:text-cafe-noir/30"
                  />
                </div>
                {ocrErrores.cedula && (
                  <p className="font-sans text-xs text-red-600">
                    {ocrErrores.cedula}
                    {datosOcr?.cedulaExtraida && ` (el sistema leyó: ${datosOcr.cedulaExtraida})`}
                  </p>
                )}
              </div>
              <DateInput
                label="Fecha de nacimiento"
                name="fecha_nacimiento"
                required
                value={form.fecha_nacimiento}
                onChange={handleChange}
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
              />
              <SelectInput
                label="Género"
                name="genero"
                value={form.genero}
                onChange={handleChange}
                options={generos}
              />
              <TextInput
                label="Lugar de nacimiento"
                name="lugarNacimiento"
                value={camposVisuales.lugarNacimiento}
                onChange={handleChange}
                placeholder="Ureña, Táchira"
              />
              <SelectInput
                label="Municipio de residencia"
                name="municipio"
                required
                value={camposVisuales.municipio}
                onChange={handleChange}
                options={municipiosList.map((mun) => ({
                  value: mun.id_municipio,
                  label: mun.nombre,
                }))}
              />
              <SelectInput
                label="Parroquia de residencia"
                name="id_parroquia"
                value={form.id_parroquia}
                onChange={handleChange}
                options={parroquias.map((parroquia) => ({
                  value: parroquia.id_parroquia,
                  label: parroquia.nombre,
                }))}
                disabled={!camposVisuales.municipio || parroquias.length === 0}
              />
              <TextInput
                label="Dirección de residencia"
                name="direccion_residencia"
                value={form.direccion_residencia}
                onChange={handleChange}
                placeholder="Ej. Calle 5, casa N°12, Barrio Obrero"
              />
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                  Teléfono de contacto
                </span>
                <div className="flex items-center w-full bg-white/50 border border-cafe-noir/30 rounded-xl overflow-hidden focus-within:border-cafe-noir focus-within:ring-1 focus-within:ring-cafe-noir transition-colors">
                  <select
                    value={telefonoPrefijo}
                    onChange={(e) => setTelefonoPrefijo(e.target.value)}
                    className="bg-transparent border-none outline-none focus:ring-0 py-2.5 pl-3 pr-2 font-sans text-sm text-cafe-noir cursor-pointer"
                  >
                    {prefijosTelefono.map((prefijo) => (
                      <option key={prefijo} value={prefijo}>{prefijo}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={7}
                    value={telefonoNumero}
                    onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="1234567"
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-2.5 pr-4 font-sans text-sm text-cafe-noir placeholder:text-cafe-noir/30"
                  />
                </div>
              </div>
              <TextInput
                label="Correo electrónico"
                name="correo_contacto"
                type="email"
                required
                value={form.correo_contacto}
                onChange={handleChange}
                placeholder="nombre@correo.com"
              />
            </div>

            <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-7">
              <Textarea
                label="Resumen curricular"
                name="resumen_curricular"
                value={form.resumen_curricular}
                onChange={handleChange}
                placeholder="Trayectoria del artesano/a..."
              />
              <Textarea
                label="Trayectoria documentada"
                name="trayectoria_documentada"
                value={form.trayectoria_documentada}
                onChange={handleChange}
                placeholder="Reconocimientos, exposiciones o participaciones previas..."
              />
              <Checkbox
                checked={estaCertificado}
                onChange={() => setEstaCertificado((prev) => !prev)}
                label="Cuenta con certificación vigente"
              />
            </div>
          </div>

          {/* Sección II: Oficio, Producto y Materia Prima */}
          <div className="space-y-0">
            <SectionTitle>II. Características de Oficio y Producto</SectionTitle>
            <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                  Oficio(s) <span> *</span>
                </span>
                <div className="flex flex-wrap gap-4">
                  {oficiosList.map((o) => (
                    <Checkbox
                      key={o.id_oficio || o.nombre}
                      checked={oficiosSeleccionados.includes(o.nombre)}
                      onChange={() =>
                        toggleEnLista(oficiosSeleccionados, setOficiosSeleccionados, o.nombre)
                      }
                      label={o.nombre}
                    />
                  ))}
                </div>
              </div>
              <TextInput
                label="Especialidad"
                name="especialidad"
                value={camposVisuales.especialidad}
                onChange={handleChange}
                placeholder="Ej. Cestería en bejuco"
              />
              <TextInput
                label="Producto principal"
                name="producto"
                value={camposVisuales.producto}
                onChange={handleChange}
                placeholder="Ej. Tinaja de Capacho"
              />
              <TextInput
                label="Materia prima utilizada"
                name="materiaPrima"
                value={camposVisuales.materiaPrima}
                onChange={handleChange}
                placeholder="Ej. Arcilla roja de Capacho"
              />
              <TextInput
                label="Procedencia de la materia prima"
                name="fuenteMateriaPrima"
                value={camposVisuales.fuenteMateriaPrima}
                onChange={handleChange}
                placeholder="Ej. Extracción local, compra a terceros"
              />
            </div>

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Clasificación
              </span>
              <div className="mt-3 flex flex-wrap gap-6">
                {['Indígena', 'Tradicional', 'Contemporánea'].map((opcion) => (
                  <Checkbox
                    key={opcion}
                    checked={clasificacionSeleccionada.includes(opcion)}
                    onChange={() =>
                      toggleEnLista(clasificacionSeleccionada, setClasificacionSeleccionada, opcion)
                    }
                    label={opcion}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Funcionalidad
              </span>
              <div className="mt-3 flex flex-wrap gap-6">
                {funcionalidades.map((opcion) => (
                  <Checkbox
                    key={opcion}
                    checked={funcionalidadMarcada.includes(opcion)}
                    onChange={() =>
                      toggleEnLista(funcionalidadMarcada, setFuncionalidadMarcada, opcion)
                    }
                    label={opcion}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Comercialización
              </span>
              <div className="mt-3 flex flex-wrap gap-6">
                {['Sí comercializa', 'No comercializa'].map((opcion) => (
                  <Radio
                    key={opcion}
                    name="comercializa"
                    value={opcion}
                    checked={camposVisuales.comercializa === opcion}
                    onChange={handleChange}
                    label={opcion}
                  />
                ))}
              </div>
              <div className="mt-5">
                <TextInput
                  label="Lugares de venta habituales"
                  name="lugaresVenta"
                  value={camposVisuales.lugaresVenta}
                  onChange={handleChange}
                  placeholder="Ej. Mercado artesanal, ferias, encargos"
                  disabled={camposVisuales.comercializa === 'No comercializa'}
                />
              </div>
            </div>
          </div>

          {/* Sección III: Declaración y Recaudos */}
          <div className="space-y-0">
            <SectionTitle>III. Declaración de Buena Fe y Recaudos</SectionTitle>

            <p className="mt-2 font-sans text-sm leading-relaxed text-cafe-noir">
              Se declara que la información suministrada en este formulario es
              verídica y fue verificada por el personal administrativo del Museo del
              Táchira con fines de registro patrimonial.
            </p>

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Foto o Documento de Cédula <span className="text-red-600">* Obligatorio</span>
              </span>
              <p className="mt-1 font-sans text-xs text-cafe-noir/60">
                Requisito bloqueante para validar la identidad del cultor.
              </p>
              <div className="mt-3">
                <Dropzone files={archivoCedula} onFilesChange={setArchivoCedula} accept="image/jpeg,image/png,image/webp" maxSizeMB={5} minWidth={600} minHeight={400} maxFiles={1} />
              </div>
            </div>

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Otros documentos de soporte (opcional)
              </span>
              <div className="mt-3">
                <Dropzone files={archivos} onFilesChange={setArchivos} />
              </div>
            </div>

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Recaudos exigidos
              </span>
              <div className="mt-3 space-y-2.5">
                {recaudosRequeridos.map((recaudo) => (
                  <Checkbox
                    key={recaudo}
                    checked={recaudosMarcados.includes(recaudo)}
                    onChange={() =>
                      toggleEnLista(recaudosMarcados, setRecaudosMarcados, recaudo)
                    }
                    label={recaudo}
                  />
                ))}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/60 px-4 py-3 text-center font-sans text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-center pt-4 sm:justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-cafe-noir px-10 py-3.5 font-sans text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Cultor'}
            </button>
          </div>
          </form>
        </div>
        </div>
      </div>
    </div>

    {/* Modal de éxito: superpuesto y centrado, por encima del formulario.
        Siempre muestra las credenciales para que el admin las copie de inmediato. */}
    {enviado && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-[#1a0f06]/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[2rem] bg-[#F4F0E6] p-8 sm:p-10 text-center shadow-2xl shadow-black/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-9 w-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="mt-6 font-sans text-2xl font-bold tracking-tight text-cafe-noir">
            ¡Cultor Registrado y Aprobado!
          </h3>

          <p className="mt-3 font-sans text-sm leading-relaxed text-cafe-noir/80">
            El registro quedó aprobado de inmediato. A continuación sus
            credenciales de acceso — cópielas y entréguelas al cultor.
          </p>

          {credencialesRegistro && (
            <div className="mt-6 rounded-2xl border border-cafe-noir/10 bg-white/70 p-5 space-y-3 text-left font-sans text-sm text-cafe-noir">
              <p><span className="font-semibold">Cultor:</span> {credencialesRegistro.nombre}</p>
              <p><span className="font-semibold">Correo:</span> {credencialesRegistro.correo}</p>
              <p>
                <span className="font-semibold">Contraseña temporal:</span>{' '}
                <span className="font-mono font-bold text-tertiary select-all">{credencialesRegistro.passwordTemporal}</span>
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(credencialesRegistro.passwordTemporal)}
                className="mt-2 w-full rounded-full border border-cafe-noir/30 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir transition-opacity hover:opacity-80"
              >
                Copiar Contraseña
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setEnviado(false); setCredencialesRegistro(null) }}
            className="mt-8 w-full rounded-full bg-cafe-noir px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-opacity hover:opacity-80"
          >
            Aceptar
          </button>
        </div>
      </div>
    )}
    </div>
  )
}

export default ManualCultorForm
