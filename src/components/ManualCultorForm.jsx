import { useState, useEffect } from 'react'

import TextInput from './form/TextInput'
import SelectInput from './form/SelectInput'
import DateInput from './form/DateInput'
import Textarea from './form/Textarea'
import Dropzone from './form/Dropzone'
import Checkbox from './form/Checkbox'
import Radio from './form/Radio'
import { ingresoManualCultorRequest, subirCedulaCultorRequest, getParroquiasRequest } from '../services/api'
import { enviarCredenciales } from '../services/emailNotifications'

// Copia adaptada de RegisterForm.jsx (vite-project, web pública), mismos campos —
// pero a diferencia de la postulación pública, este ingreso usa la ruta protegida
// POST /api/cultores/ingreso-manual: el cultor queda APROBADO de inmediato (no
// 'pendiente') y el backend crea su Usuario+contraseña en la misma llamada. Por eso,
// al tener éxito, se dispara el correo de credenciales — no pasa por Pre-registro.

const municipios = [
  'San Cristóbal',
  'Capacho (Libertador)',
  'Independencia',
  'Lobatera',
  'Pregonero',
  'Queniquea',
  'Rubio',
]

const oficios = [
  'Alfarería y cerámica',
  'Cestería',
  'Talla en madera',
  'Textiles y tejidos',
  'Pintura popular',
  'Marroquinería',
]

const generos = ['Femenino', 'Masculino', 'Otro']

const funcionalidades = ['Utilitaria', 'Decorativa', 'Ceremonial', 'Mixta']

const recaudosRequeridos = [
  'Copia de la cédula de identidad',
  'Resumen curricular del oficio',
  'Fotografías del proceso productivo',
  'Fotografías de las obras terminadas',
  'Constancia de residencia',
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
  oficio: '',
  especialidad: '',
  producto: '',
  clasificacion: '',
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
  const [funcionalidadMarcada, setFuncionalidadMarcada] = useState([])
  const [recaudosMarcados, setRecaudosMarcados] = useState([])
  const [archivos, setArchivos] = useState([])
  const [enviado, setEnviado] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [documentoUploadError, setDocumentoUploadError] = useState('')

  // Cédula: prefijo V-/E- + dígitos, compuestos en un solo string ("V-12345678")
  // justo antes de enviar, en el formato exacto que valida el backend.
  const [cedulaPrefijo, setCedulaPrefijo] = useState('V')
  const [cedulaNumero, setCedulaNumero] = useState('')

  // Teléfono: prefijo venezolano válido + 7 dígitos ("0414-1234567").
  const [telefonoPrefijo, setTelefonoPrefijo] = useState('0414')
  const [telefonoNumero, setTelefonoNumero] = useState('')

  // Foto/documento de cédula: OBLIGATORIO para validar identidad (bloquea el envío si
  // está vacío). Nota: esta exigencia hoy solo se aplica en el frontend — el backend
  // todavía no tiene Multer/almacenamiento de archivos conectado, así que no hay forma
  // de validar este requisito del lado del servidor por ahora.
  const [archivoCedula, setArchivoCedula] = useState([])

  // Respaldo si el alta fue exitosa en la BD pero EmailJS falló al notificar: se
  // muestran las credenciales aquí para que el admin las copie y las comunique
  // manualmente (mismo patrón que ya usa PreRegistration.jsx).
  const [credencialesSinNotificar, setCredencialesSinNotificar] = useState(null)

  // Parroquias para el <select> de id_parroquia (ruta pública, sin auth)
  const [parroquias, setParroquias] = useState([])

  useEffect(() => {
    if (!isOpen) return
    getParroquiasRequest()
      .then(setParroquias)
      .catch(() => setParroquias([]))
  }, [isOpen])

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name in initialFormState) {
      setForm((prev) => ({ ...prev, [name]: value }))
    } else {
      setCamposVisuales((prev) => ({ ...prev, [name]: value }))
    }
  }

  const toggleEnLista = (lista, setLista, valor) => {
    setLista(
      lista.includes(valor)
        ? lista.filter((item) => item !== valor)
        : [...lista, valor],
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setDocumentoUploadError('')

    // Bloqueante en el frontend: sin documento de cédula no se puede validar la
    // identidad del cultor. El archivo en sí se sube en un segundo paso, después de
    // crear el cultor (ver más abajo), ya que el backend necesita el id_cultor real
    // para asociar el documento.
    if (archivoCedula.length === 0) {
      setSubmitError('Debes adjuntar la foto o documento de la cédula para validar la identidad.')
      return
    }

    const archivo = archivoCedula[0]
    setIsSubmitting(true)

    try {
      // Solo se envían los campos que existen como columna real en `cultores`.
      // Los opcionales (ej. correo_contacto, id_parroquia) se omiten si quedaron vacíos:
      // el backend valida formato/tipo cuando el campo SÍ viene presente, aunque sea opcional.
      const payload = {
        ...Object.fromEntries(
          Object.entries(form).filter(([, valor]) => valor !== '')
        ),
        // Ensamblados aquí en el formato exacto que exige el backend (V-12345678 /
        // 0414-1234567), a partir del prefijo seleccionado + los dígitos escritos.
        cedula: `${cedulaPrefijo}-${cedulaNumero}`,
        // Estado booleano aparte: nunca debe viajar como string ('true'/'false'),
        // el backend lo valida estrictamente como boolean.
        esta_certificado: estaCertificado,
      }
      if (telefonoNumero) {
        payload.telefono_contacto = `${telefonoPrefijo}-${telefonoNumero}`
      }

      const token = localStorage.getItem('auth-token')
      const respuesta = await ingresoManualCultorRequest(payload, token)

      // El cultor ya quedó creado en la BD en este punto. La subida del documento es
      // un segundo paso, encadenado con el id_cultor real que recién devolvió el
      // backend — si esta parte falla, el registro del cultor NO se revierte, solo
      // se le avisa al admin para que suba el documento más tarde.
      try {
        await subirCedulaCultorRequest(respuesta.id_cultor, archivo, token)
      } catch {
        setDocumentoUploadError('Registro creado con éxito, pero hubo un error al cargar el documento de identidad.')
      }

      setForm(initialFormState)
      setCamposVisuales(initialCamposVisualesState)
      setCedulaPrefijo('V')
      setCedulaNumero('')
      setTelefonoPrefijo('0414')
      setTelefonoNumero('')
      setArchivoCedula([])
      setEstaCertificado(false)
      setFuncionalidadMarcada([])
      setRecaudosMarcados([])
      setArchivos([])
      setEnviado(true)
      onSuccess?.()

      // El backend siempre devuelve credencialesNuevas en este endpoint (el cultor
      // queda aprobado de inmediato), así que aquí no es condicional como en
      // PreRegistration.jsx — solo puede fallar el envío del correo, no su existencia.
      const { correo, nombre, passwordTemporal } = respuesta.credencialesNuevas
      try {
        await enviarCredenciales({ correo, nombre, password: passwordTemporal, rol_usuario: 'Cultor' })
      } catch {
        setCredencialesSinNotificar({ correo, nombre, passwordTemporal })
      }
    } catch (error) {
      // El backend también responde 400 cuando falta correo_contacto (mensaje propio,
      // ya es amigable) — solo se traduce el 400 de restricción única (cédula/correo
      // duplicados), que llega como un error genérico de Sequelize, no como mensaje propio.
      const esFaltaCorreo = error.message?.includes('requiere correo_contacto')
      const esDuplicado = error.cause?.response?.status === 400 && !esFaltaCorreo
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
          <form onSubmit={handleSubmit} className="space-y-14">
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
                placeholder="Ej. María José"
              />
              <TextInput
                label="Segundo nombre"
                name="segundo_nombre"
                value={form.segundo_nombre}
                onChange={handleChange}
                placeholder="Ej. Fernanda"
              />
              <TextInput
                label="Primer Apellido"
                name="primer_apellido"
                required
                value={form.primer_apellido}
                onChange={handleChange}
                placeholder="Ej. Useche Rangel"
              />
              <TextInput
                label="Segundo apellido"
                name="segundo_apellido"
                value={form.segundo_apellido}
                onChange={handleChange}
                placeholder="Ej. Pérez"
              />
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                  Cédula de identidad <span> *</span>
                </span>
                <div className="flex items-center w-full bg-transparent border border-[#D2C5B4] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#8B5A2B]">
                  <select
                    value={cedulaPrefijo}
                    onChange={(e) => setCedulaPrefijo(e.target.value)}
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
                    onChange={(e) => setCedulaNumero(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678"
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-2.5 pr-4 font-sans text-sm text-cafe-noir placeholder:text-cafe-noir/30"
                  />
                </div>
              </div>
              <DateInput
                label="Fecha de nacimiento"
                name="fecha_nacimiento"
                required
                value={form.fecha_nacimiento}
                onChange={handleChange}
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
                options={municipios}
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
                <div className="flex items-center w-full bg-transparent border border-[#D2C5B4] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#8B5A2B]">
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
                label="Cuenta con certificación de Fe de Vida vigente"
              />
            </div>
          </div>

          {/* Sección II: Oficio, Producto y Materia Prima */}
          <div className="space-y-0">
            <SectionTitle>II. Características de Oficio y Producto</SectionTitle>
            <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
              <SelectInput
                label="Oficio"
                name="oficio"
                required
                value={camposVisuales.oficio}
                onChange={handleChange}
                options={oficios}
              />
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
                  <Radio
                    key={opcion}
                    name="clasificacion"
                    value={opcion}
                    checked={camposVisuales.clasificacion === opcion}
                    onChange={handleChange}
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
                <Dropzone files={archivoCedula} onFilesChange={setArchivoCedula} />
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

            <div className="mt-8">
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                Otros documentos de soporte (opcional)
              </span>
              <div className="mt-3">
                <Dropzone files={archivos} onFilesChange={setArchivos} />
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

    {/* Modal de éxito: superpuesto y centrado, por encima del formulario */}
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
            El registro quedó aprobado de inmediato y sus credenciales de acceso
            fueron enviadas a su correo.
          </p>

          {documentoUploadError && (
            <p className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-left font-sans text-sm text-amber-800">
              {documentoUploadError}
            </p>
          )}

          <button
            type="button"
            onClick={() => { setEnviado(false); setDocumentoUploadError('') }}
            className="mt-8 w-full rounded-full bg-cafe-noir px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-opacity hover:opacity-80"
          >
            Aceptar
          </button>
        </div>
      </div>
    )}

    {/* Respaldo: el cultor ya quedó aprobado en la BD, pero EmailJS no pudo notificar.
        Modal bloqueante para asegurar que el admin vea y copie la contraseña antes de cerrar. */}
    {credencialesSinNotificar && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-[#1a0f06]/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[2rem] bg-[#F4F0E6] p-8 sm:p-10 text-center shadow-2xl shadow-black/50">
          <h3 className="font-sans text-xl font-bold tracking-tight text-cafe-noir">
            Cultor Aprobado — Falta Notificar
          </h3>

          <p className="mt-3 rounded-xl border border-red-200/50 bg-red-50/60 px-4 py-3 text-left font-sans text-sm text-red-700">
            El cultor fue registrado y aprobado, pero no se pudo enviar el correo con sus
            credenciales. Copia esta contraseña y comunícasela manualmente.
          </p>

          <div className="mt-6 space-y-3 text-left font-sans text-sm text-cafe-noir">
            <p><span className="font-semibold">Cultor:</span> {credencialesSinNotificar.nombre}</p>
            <p><span className="font-semibold">Correo:</span> {credencialesSinNotificar.correo}</p>
            <p>
              <span className="font-semibold">Contraseña temporal:</span>{' '}
              <span className="font-mono font-bold text-tertiary">{credencialesSinNotificar.passwordTemporal}</span>
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(credencialesSinNotificar.passwordTemporal)}
              className="w-full rounded-full border border-cafe-noir/30 px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir transition-opacity hover:opacity-80"
            >
              Copiar Contraseña
            </button>
            <button
              type="button"
              onClick={() => setCredencialesSinNotificar(null)}
              className="w-full rounded-full bg-cafe-noir px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide text-white shadow-md transition-opacity hover:opacity-80"
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

export default ManualCultorForm
