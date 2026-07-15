function DateInput({ label, name, required = false, value, onChange, min, max, disabled = false }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-xs font-semibold uppercase tracking-wide text-cafe-noir">
        {label}
        {required && <span> *</span>}
      </span>
      <div className={`relative ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <input
          type="date"
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          className="date-input-full-click"
        />
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cafe-noir"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5z"
          />
        </svg>
      </div>
      <style>{`
        .date-input-full-click {
          width: 100%;
          appearance: none;
          border-radius: 0.75rem;
          border: 1px solid rgba(139, 90, 43, 0.3);
          background-color: rgba(255, 255, 255, 0.5);
          padding: 0.625rem 2.5rem 0.625rem 1rem;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 0.875rem;
          color: #5C3A1E;
          transition: all 0.2s;
        }
        .date-input-full-click:focus {
          border-color: #5C3A1E;
          outline: none;
          box-shadow: 0 0 0 1px #5C3A1E;
        }
        .date-input-full-click::-webkit-calendar-picker-indicator {
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </label>
  )
}

export default DateInput
