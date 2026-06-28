function Textarea({ label, name, required = false, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
        {label}
        {required && <span> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-cafe-noir/30 bg-white/50 px-4 py-2.5 font-sans text-cafe-noir placeholder:text-cafe-noir/60 focus:border-cafe-noir focus:outline-none focus:ring-1 focus:ring-cafe-noir transition-colors resize-y"
      />
    </label>
  )
}

export default Textarea
