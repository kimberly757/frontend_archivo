function TextInput({ label, name, type = 'text', required = false, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
        {label}
        {required && <span> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-cafe-noir/30 bg-white/50 px-4 py-2.5 font-sans text-cafe-noir placeholder:text-cafe-noir/60 focus:border-cafe-noir focus:outline-none focus:ring-1 focus:ring-cafe-noir transition-colors"
      />
    </label>
  )
}

export default TextInput
