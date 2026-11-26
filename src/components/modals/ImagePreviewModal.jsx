import { useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function ImagePreviewModal({ imageUrl, fileName, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function stopPropagation(event) {
    event.stopPropagation()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${fileName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
        else event.stopPropagation()
      }}
      onPointerDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      <div className="flex max-h-full max-w-full flex-col items-center gap-4" onClick={stopPropagation}>
        <div className="flex w-full items-center justify-between gap-4 text-white">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold" title={fileName}>{fileName}</h2>
          <button type="button" onClick={onClose} aria-label="Close image preview" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X size={21} />
          </button>
        </div>
        <img src={imageUrl} alt={fileName} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
        <a href={imageUrl} download={fileName} onClick={stopPropagation} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
          <Download size={16} /> Download
        </a>
      </div>
    </div>
  )
}
