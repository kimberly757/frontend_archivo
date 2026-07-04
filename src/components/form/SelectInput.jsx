import { useState, useRef, useEffect } from 'react'

function SelectInput({ label, name, required = false, value, onChange, options, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Limpia la búsqueda cada vez que se abre/cierra, y enfoca el buscador al abrir.
  useEffect(() => {
    setQuery('')
    if (isOpen) {
      // Pequeño delay para que el input ya esté montado antes de enfocarlo.
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Find the selected option label
  const selectedOption = options.find((opt) => {
    const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt
    return optValue === value || optValue === Number(value) || String(optValue) === String(value)
  })

  const displayLabel = selectedOption
    ? (typeof selectedOption === 'object' && selectedOption !== null ? selectedOption.label : selectedOption)
    : 'Selecciona una opción'

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } })
    setIsOpen(false)
  }

  // Filtra por coincidencia al inicio de la etiqueta (ej. "S" muestra "San Cristóbal",
  // "Sucre"...), sin distinguir mayúsculas/minúsculas.
  const opcionesFiltradas = options.filter((option) => {
    if (!query.trim()) return true
    const esObjeto = typeof option === 'object' && option !== null
    const etiqueta = String(esObjeto ? option.label : option)
    return etiqueta.toLowerCase().startsWith(query.trim().toLowerCase())
  })

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
        {label}
        {required && <span> *</span>}
      </span>
      <div
        className={`relative w-full rounded-xl border border-cafe-noir/30 bg-white/50 px-4 py-2.5 pr-10 font-sans text-cafe-noir transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus-within:border-cafe-noir focus-within:ring-1 focus-within:ring-cafe-noir'}`}
        onClick={() => !disabled && !isOpen && setIsOpen(true)}
        tabIndex={disabled || isOpen ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && !isOpen && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
      >
        {isOpen ? (
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={displayLabel === 'Selecciona una opción' ? 'Buscar...' : displayLabel}
            className="w-full bg-transparent border-none outline-none font-sans text-cafe-noir placeholder:text-gray-400"
          />
        ) : (
          <span className={!value ? 'text-gray-500' : ''}>{displayLabel}</span>
        )}

        <svg
          className={`pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cafe-noir transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {isOpen && (
        <ul className="absolute z-[100] mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl top-full left-0 list-none m-0 p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cafe-noir/20 hover:scrollbar-thumb-cafe-noir/40">
          {opcionesFiltradas.length === 0 ? (
            <li className="px-4 py-2.5 text-gray-400 text-sm list-none">Sin resultados</li>
          ) : (
            opcionesFiltradas.map((option) => {
              const esObjeto = typeof option === 'object' && option !== null
              const valor = esObjeto ? option.value : option
              const etiqueta = esObjeto ? option.label : option
              const isSelected = String(value) === String(valor)

              return (
                <li
                  key={valor}
                  className={`px-4 py-2.5 cursor-pointer transition-colors text-sm list-none ${isSelected ? 'bg-amber-100/50 font-semibold text-cafe-noir' : 'text-gray-700 hover:bg-amber-50 hover:text-cafe-noir'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(valor)
                  }}
                >
                  {etiqueta}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

export default SelectInput
