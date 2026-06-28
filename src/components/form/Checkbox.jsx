function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 font-sans text-sm text-cafe-noir cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="relative appearance-none w-5 h-5 border-2 border-amber-700 rounded-[4px] bg-white checked:bg-amber-700 checked:border-amber-700 focus:ring-1 focus:ring-amber-700 cursor-pointer shrink-0 after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-[11px] after:font-bold after:text-white after:opacity-0 checked:after:opacity-100 after:content-['✓']"
      />
      {label}
    </label>
  )
}

export default Checkbox
