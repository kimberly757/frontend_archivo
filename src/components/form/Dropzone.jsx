import { useRef, useState } from 'react'

function Dropzone({ files, onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const addFiles = (fileList) => {
    onFilesChange([...files, ...Array.from(fileList)])
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-warm-sand/30'
            : 'border-warm-sand hover:bg-warm-sand/15'
        }`}
      >
        <svg
          className="h-9 w-9 text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.25"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 8.25 12 3.75 7.5 8.25M12 3.75v13.5"
          />
        </svg>
        <p className="font-sans text-sm text-cafe-noir">
          Arrastra archivos aquí o haz clic para seleccionarlos
        </p>
        <p className="font-sans text-xs text-secondary">
          PDF, JPG o PNG · máx. 10MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between border-b border-warm-sand px-1 py-2 font-sans text-sm text-cafe-noir"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-tertiary hover:underline text-xs font-medium"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dropzone
