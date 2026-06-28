function SelectInput({ label, name, required = false, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
        {label}
        {required && <span> *</span>}
      </span>
      <div className="relative">
        <select
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border-2 border-amber-700/50 bg-white px-4 py-2.5 pr-10 font-sans font-medium text-cafe-noir focus:border-cafe-noir focus:outline-none focus:ring-1 focus:ring-cafe-noir transition-colors [&>option]:text-black"
        >
          <option value="" disabled className="text-gray-500">
            Selecciona una opción
          </option>
          {options.map((option) => {
            // Soporta arreglos de strings (uso original) y de objetos {value, label}
            // (ej. parroquias, donde el texto visible no es el mismo valor que se envía).
            const esObjeto = typeof option === 'object' && option !== null
            const valor = esObjeto ? option.value : option
            const etiqueta = esObjeto ? option.label : option
            return (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            )
          })}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cafe-noir"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </label>
  )
}

export default SelectInput
