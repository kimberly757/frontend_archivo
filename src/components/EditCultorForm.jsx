import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import TextInput from './form/TextInput'
import SelectInput from './form/SelectInput'
import DateInput from './form/DateInput'
import Textarea from './form/Textarea'
import Checkbox from './form/Checkbox'
import { updateCultorRequest, getParroquiasByMunicipioRequest, getMunicipiosRequest } from '../services/api'

const generos = ['Femenino', 'Masculino', 'Otro']
const prefijosCedula = ['V', 'E']
const prefijosTelefono = ['0414', '0424', '0416', '0426', '0412', '0422', '0276']

function EditCultorForm({ isOpen, onClose, cultor, onSuccess }) {
  const [form, setForm] = useState({
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
    estatus_vida: '',
  })

  const [estaCertificado, setEstaCertificado] = useState(false)
  const [cedulaPrefijo, setCedulaPrefijo] = useState('V')
  const [cedulaNumero, setCedulaNumero] = useState('')
  const [telefonoPrefijo, setTelefonoPrefijo] = useState('0414')
  const [telefonoNumero, setTelefonoNumero] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [municipiosList, setMunicipiosList] = useState([])
  const [parroquias, setParroquias] = useState([])
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('')

  // Cargar municipios al abrir
  useEffect(() => {
    if (!isOpen) return
    getMunicipiosRequest()
      .then(setMunicipiosList)
      .catch(() => setMunicipiosList([]))
  }, [isOpen])

  // Poblar el formulario cuando se abre con un cultor
  useEffect(() => {
    if (!isOpen || !cultor) return

    setForm({
      primer_nombre: cultor.primer_nombre || '',
      segundo_nombre: cultor.segundo_nombre || '',
      primer_apellido: cultor.primer_apellido || '',
      segundo_apellido: cultor.segundo_apellido || '',
      seudonimo: cultor.seudonimo || '',
      fecha_nacimiento: cultor.fecha_nacimiento ? cultor.fecha_nacimiento.split('T')[0] : '',
      genero: cultor.genero || '',
      correo_contacto: cultor.correo_contacto || '',
      direccion_residencia: cultor.direccion_residencia || '',
      id_parroquia: cultor.id_parroquia || '',
      resumen_curricular: cultor.resumen_curricular || '',
      trayectoria_documentada: cultor.trayectoria_documentada || '',
      estatus_vida: cultor.estatus_vida || '',
    })

    setEstaCertificado(!!cultor.esta_certificado)

    // Descomponer cédula
    if (cultor.cedula) {
      const match = cultor.cedula.match(/^([VE])-(\d+)$/)
      if (match) {
        setCedulaPrefijo(match[1])
        setCedulaNumero(match[2])
      }
    } else {
      setCedulaPrefijo('V')
      setCedulaNumero('')
    }

    // Descomponer teléfono
    if (cultor.telefono_contacto) {
      const match = cultor.telefono_contacto.match(/^(\d{4})-(\d{7})$/)
      if (match) {
        setTelefonoPrefijo(match[1])
        setTelefonoNumero(match[2])
      }
    } else {
      setTelefonoPrefijo('0414')
      setTelefonoNumero('')
    }

    // Si tiene parroquia, intentar cargar el municipio asociado
    if (cultor.parroquia?.municipio) {
      const idMun = cultor.parroquia.municipio.id_municipio
      setMunicipioSeleccionado(String(idMun))
      if (idMun) {
        getParroquiasByMunicipioRequest(idMun)
          .then(setParroquias)
          .catch(() => setParroquias([]))
      }
    } else {
      setMunicipioSeleccionado('')
      setParroquias([])
    }
  }, [isOpen, cultor])

  if (!isOpen || !cultor) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    if (name === 'municipio') {
      setForm((prev) => ({ ...prev, id_parroquia: '' }))
      setMunicipioSeleccionado(value)
      if (value) {
        getParroquiasByMunicipioRequest(value)
          .then(setParroquias)
          .catch(() => setParroquias([]))
      } else {
        setParroquias([])
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (cedulaNumero.length < 6 || cedulaNumero.length > 9) {
      setSubmitError('La cédula debe tener entre 6 y 9 dígitos.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...Object.fromEntries(
          Object.entries(form).filter(([, valor]) => valor !== '')
        ),
        cedula: `${cedulaPrefijo}-${cedulaNumero}`,
        esta_certificado: estaCertificado,
      }
      if (telefonoNumero) {
        payload.telefono_contacto = `${telefonoPrefijo}-${telefonoNumero}`
      }

      const token = localStorage.getItem('auth-token')
      await updateCultorRequest(cultor.id_cultor, payload, token)
      onSuccess?.()
      onClose()
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="tw-scope">
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3a200d]/50 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-auto max-h-[90vh] rounded-[2rem] bg-[#F4F0E6] shadow-2xl shadow-black/50 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-cafe-noir transition-opacity hover:opacity-70"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 w-full overflow-y-auto px-6 py-10 sm:px-12 sm:py-14 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cafe-noir/20 hover:scrollbar-thumb-cafe-noir/40 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cafe-noir/20 hover:[&::-webkit-scrollbar-thumb]:bg-cafe-noir/40">
          <div className="text-center text-cafe-noir">
            <span className="font-sans text-xs uppercase tracking-[0.1em] text-cafe-noir/80">
              Panel Administrativo
            </span>
            <h2 className="mt-1 font-sans font-semibold text-3xl sm:text-4xl text-cafe-noir">
              Editar Expediente
            </h2>
            <p className="mt-2 font-sans text-sm text-cafe-noir/90">
              {cultor.primer_nombre} {cultor.primer_apellido} — {cultor.cedula || 'Sin cédula'}
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
                <TextInput label="Primer Nombre" name="primer_nombre" required value={form.primer_nombre} onChange={handleChange} placeholder="Ej. María" disabled />
                <TextInput label="Segundo nombre" name="segundo_nombre" value={form.segundo_nombre} onChange={handleChange} placeholder="Ej. Fernanda" disabled />
                <TextInput label="Primer Apellido" name="primer_apellido" required value={form.primer_apellido} onChange={handleChange} placeholder="Ej. Useche" disabled />
                <TextInput label="Segundo apellido" name="segundo_apellido" value={form.segundo_apellido} onChange={handleChange} placeholder="Ej. Pérez" disabled />
                <TextInput label="Seudónimo" name="seudonimo" value={form.seudonimo} onChange={handleChange} placeholder="Ej. El Artesano de Capacho" />

                <div className="flex flex-col gap-2">
                  <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
                    Cédula de identidad <span> *</span>
                  </span>
                  <div className="flex items-center w-full bg-white/50 border border-cafe-noir/10 rounded-xl overflow-hidden opacity-60 cursor-not-allowed">
                    <select value={cedulaPrefijo} disabled className="bg-transparent border-none outline-none focus:ring-0 py-2.5 pl-3 pr-2 font-sans text-sm text-cafe-noir/60 cursor-not-allowed">
                      {prefijosCedula.map((p) => (<option key={p} value={p}>{p}</option>))}
                    </select>
                    <input type="text" required inputMode="numeric" value={cedulaNumero} disabled placeholder="12345678" className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-2.5 pr-4 font-sans text-sm text-cafe-noir/60 placeholder:text-cafe-noir/30 cursor-not-allowed" />
                  </div>
                </div>

                <DateInput label="Fecha de nacimiento" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} min="1900-01-01" max={new Date().toISOString().split('T')[0]} disabled />
                <SelectInput label="Género" name="genero" value={form.genero} onChange={handleChange} options={generos} disabled />
                <SelectInput label="Municipio de residencia" name="municipio" value={municipioSeleccionado} onChange={handleChange} options={municipiosList.map((m) => ({ value: String(m.id_municipio), label: m.nombre }))} />
                <SelectInput label="Parroquia de residencia" name="id_parroquia" value={form.id_parroquia} onChange={handleChange} options={parroquias.map((p) => ({ value: String(p.id_parroquia), label: p.nombre }))} disabled={!municipioSeleccionado || parroquias.length === 0} />
                <TextInput label="Dirección de residencia" name="direccion_residencia" value={form.direccion_residencia} onChange={handleChange} placeholder="Ej. Calle 5, casa N°12" />

                <div className="flex flex-col gap-2">
                  <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">Teléfono de contacto</span>
                  <div className="flex items-center w-full bg-white/50 border border-cafe-noir/30 rounded-xl overflow-hidden focus-within:border-cafe-noir focus-within:ring-1 focus-within:ring-cafe-noir transition-colors">
                    <select value={telefonoPrefijo} onChange={(e) => setTelefonoPrefijo(e.target.value)} className="bg-transparent border-none outline-none focus:ring-0 py-2.5 pl-3 pr-2 font-sans text-sm text-cafe-noir cursor-pointer">
                      {prefijosTelefono.map((p) => (<option key={p} value={p}>{p}</option>))}
                    </select>
                    <input type="tel" inputMode="numeric" maxLength={7} value={telefonoNumero} onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="1234567" className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-2.5 pr-4 font-sans text-sm text-cafe-noir placeholder:text-cafe-noir/30" />
                  </div>
                </div>

                <TextInput label="Correo electrónico" name="correo_contacto" type="email" required value={form.correo_contacto} onChange={handleChange} placeholder="nombre@correo.com" />
              </div>

              <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-7">
                <Textarea label="Resumen curricular" name="resumen_curricular" value={form.resumen_curricular} onChange={handleChange} placeholder="Trayectoria del artesano/a..." />
                <Textarea label="Trayectoria documentada" name="trayectoria_documentada" value={form.trayectoria_documentada} onChange={handleChange} placeholder="Reconocimientos, exposiciones o participaciones previas..." />
                <div className="flex flex-wrap gap-6">
                  <Checkbox checked={estaCertificado} onChange={() => setEstaCertificado((prev) => !prev)} label="Cuenta con certificación vigente" />
                </div>
              </div>

              {submitError && (
                <div className="rounded-2xl border border-red-200/50 bg-red-50/60 px-4 py-3 text-center font-sans text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="rounded-full border border-cafe-noir/30 px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-cafe-noir transition-opacity hover:opacity-80">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-full bg-cafe-noir px-10 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default EditCultorForm
