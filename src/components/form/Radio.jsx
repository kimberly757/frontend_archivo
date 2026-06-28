function Radio({ name, value, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 font-sans text-sm text-cafe-noir cursor-pointer select-none">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="appearance-none w-5 h-5 border-2 border-amber-700 rounded-full bg-white checked:bg-amber-700 checked:border-amber-700 focus:ring-1 focus:ring-amber-700 cursor-pointer shrink-0"
      />
      {label}
    </label>
  )
}

export default Radio
