import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Download, FilePlus2, FileText, ImagePlus, LoaderCircle, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react'
import { WaypointFileVault } from '../../utils/fileVaultDB'
import ImagePreviewModal from '../modals/ImagePreviewModal'

function formatSize(size = 0) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function NoteContent({ text }) {
  const tokens = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi)
  return (
    <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
      {tokens.map((token, index) => (/^(https?:\/\/|www\.)/i.test(token)
        ? <a key={`${index}-${token}`} href={token.startsWith('www.') ? `https://${token}` : token} target="_blank" rel="noreferrer" className="break-all font-medium text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-800">{token}</a>
        : <span key={`${index}-${token}`}>{token}</span>))}
    </p>
  )
}

export default function ResourceVault({ item, children, onAddNote, onUpdateNote, onDeleteNote, onAddAttachment, onDeleteAttachment, globalExpansion }) {
  const [localExpansion, setLocalExpansion] = useState(null)
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingFile, setSavingFile] = useState(false)
  const [error, setError] = useState('')
  const [fileRecords, setFileRecords] = useState({})
  const [lightboxId, setLightboxId] = useState(null)
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const notes = item.notes ?? []
  const attachments = item.attachments ?? []
  const fileCount = attachments.filter((attachment) => !attachment.fileType?.startsWith('image/')).length
  const screenshotCount = attachments.length - fileCount
  const resourcesExpanded = globalExpansion
    ? (localExpansion?.version === globalExpansion.version ? localExpansion.expanded : globalExpansion.expanded)
    : (localExpansion?.expanded ?? false)
  const attachmentKey = JSON.stringify(attachments.map(({ id, fileName, fileType, fileSize, createdAt }) => ({ id, fileName, fileType, fileSize, createdAt })))

  useEffect(() => {
    let cancelled = false
    const objectUrls = []
    const attachmentSnapshot = JSON.parse(attachmentKey)
    Promise.all(attachmentSnapshot.map(async (attachment) => {
      try {
        const record = await WaypointFileVault.getFile(attachment.id)
        if (!record?.blob) return [attachment.id, { missing: true }]
        const url = URL.createObjectURL(record.blob)
        objectUrls.push(url)
        return [attachment.id, { record, url }]
      } catch {
        return [attachment.id, { missing: true }]
      }
    })).then((entries) => {
      if (!cancelled) setFileRecords(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [attachmentKey])

  async function saveFile(file) {
    if (!file) return
    setResourcesExpanded(true)
    setSavingFile(true)
    setError('')
    try {
      const metadata = await WaypointFileVault.saveFile(file)
      onAddAttachment(metadata)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this file.')
    } finally {
      setSavingFile(false)
    }
  }

  function handlePaste(event) {
    const clipboardItems = Array.from(event.clipboardData?.items ?? [])
    const imageItem = clipboardItems.find((clipboardItem) => clipboardItem.type.startsWith('image/'))
    if (!imageItem) return
    const image = imageItem.getAsFile()
    if (!image) return
    event.preventDefault()
    setResourcesExpanded(true)
    const extension = image.type.split('/')[1]?.split('+')[0] || 'png'
    const pastedFile = new File([image], `pasted-screenshot-${Math.floor(event.timeStamp)}.${extension}`, { type: image.type })
    void saveFile(pastedFile)
  }

  function startNewNote() {
    setResourcesExpanded(true)
    setEditingNoteId(null)
    setNoteDraft('')
    setNoteEditorOpen(true)
    setError('')
  }

  function startEditNote(note) {
    setResourcesExpanded(true)
    setEditingNoteId(note.id)
    setNoteDraft(note.text)
    setNoteEditorOpen(true)
    setError('')
  }

  function cancelNoteEdit() {
    setEditingNoteId(null)
    setNoteDraft('')
    setNoteEditorOpen(false)
  }

  function saveNote(event) {
    event.preventDefault()
    const text = noteDraft.trim()
    if (!text) return
    if (editingNoteId) onUpdateNote(editingNoteId, text)
    else onAddNote(text)
    cancelNoteEdit()
  }

  function handleFileInput(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    void saveFile(file)
  }

  function openAttachment(attachment) {
    const record = fileRecords[attachment.id]?.record
    if (!record?.blob) return
    const url = fileRecords[attachment.id].url
    if (attachment.fileType?.startsWith('image/')) {
      setLightboxId(attachment.id)
      return
    }
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.fileName
    link.target = '_blank'
    link.rel = 'noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const lightboxAttachment = attachments.find((attachment) => attachment.id === lightboxId)
  const lightboxRecord = lightboxAttachment ? fileRecords[lightboxAttachment.id] : null

  function setResourcesExpanded(nextValue) {
    setLocalExpansion((current) => {
      const currentValue = globalExpansion
        ? (current?.version === globalExpansion.version ? current.expanded : globalExpansion.expanded)
        : (current?.expanded ?? false)
      const expanded = typeof nextValue === 'function' ? nextValue(currentValue) : nextValue
      return { version: globalExpansion?.version ?? null, expanded }
    })
  }

  return (
    <div className="min-w-0 flex-1" tabIndex={0} role="group" aria-label={`Resources for ${item.text}. Paste a screenshot here.`} onPaste={handlePaste}>
      {children}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={startNewNote} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Plus size={12} /> Note</button>
        <button type="button" onClick={() => imageInputRef.current?.click()} disabled={savingFile} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"><ImagePlus size={12} /> Screenshot</button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={savingFile} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"><FilePlus2 size={12} /> File</button>
        {savingFile && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><LoaderCircle size={12} className="animate-spin" /> Saving</span>}
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
        <input ref={fileInputRef} type="file" onChange={handleFileInput} className="hidden" />
      </div>

      {(notes.length > 0 || attachments.length > 0) && (
        <button type="button" onClick={() => setResourcesExpanded((expanded) => !expanded)} aria-expanded={resourcesExpanded} className="mt-2 inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
          <Paperclip size={12} />
          <span className="truncate">{fileCount > 0 && `${fileCount} ${fileCount === 1 ? 'File' : 'Files'}`}{fileCount > 0 && (screenshotCount > 0 || notes.length > 0) && ' · '}{screenshotCount > 0 && `${screenshotCount} ${screenshotCount === 1 ? 'Screenshot' : 'Screenshots'}`}{screenshotCount > 0 && notes.length > 0 && ' · '}{notes.length > 0 && `${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}`}</span>
          {resourcesExpanded ? <><span>Collapse</span><ChevronUp size={12} /></> : <><span>Expand</span><ChevronDown size={12} /></>}
        </button>
      )}

      {error && <p role="alert" className="mt-2 text-[10px] leading-4 text-rose-600">{error}</p>}

      {resourcesExpanded && noteEditorOpen && (
        <form onSubmit={saveNote} className="mt-2 rounded-xl border border-indigo-100 bg-white p-2.5">
          <label htmlFor={`note-${item.id}`} className="mb-1.5 block text-[10px] font-semibold text-slate-600">{editingNoteId ? 'Edit note' : 'New note'} <span className="font-normal text-slate-400">(URLs become clickable)</span></label>
          <textarea id={`note-${item.id}`} autoFocus value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Write notes, instructions, credentials, links, or a text checklist..." className="min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={cancelNoteEdit} className="min-h-10 rounded-lg px-3 text-[10px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={!noteDraft.trim()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[10px] font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200"><Check size={13} /> Save note</button>
          </div>
        </form>
      )}

      {resourcesExpanded && notes.length > 0 && <div className="mt-2 space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Saved note</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => startEditNote(note)} aria-label="Edit note" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600"><Pencil size={13} /></button>
                <button type="button" onClick={() => onDeleteNote(note.id)} aria-label="Delete note" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <NoteContent text={note.text} />
          </div>
        ))}
      </div>}

      {resourcesExpanded && attachments.length > 0 && <div className="mt-2 space-y-1.5">
        {attachments.map((attachment) => {
          const resource = fileRecords[attachment.id]
          const isImage = attachment.fileType?.startsWith('image/')
          return (
            <div key={attachment.id} role="button" tabIndex={0} onClick={() => openAttachment(attachment)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAttachment(attachment) } }} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1.5 transition hover:bg-amber-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              {isImage ? (
                <button type="button" onClick={(event) => { event.stopPropagation(); openAttachment(attachment) }} disabled={!resource?.url} aria-label={`Preview ${attachment.fileName}`} className="flex h-14 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100 disabled:cursor-default">
                  {resource?.url ? <img src={resource.url} alt={attachment.fileName} className="h-full w-full object-cover" /> : <ImagePlus size={18} className="text-slate-300" />}
                </button>
              ) : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><FileText size={17} /></div>}
              <div className="min-w-0 flex-1">
                {resource?.url ? (
                  <button type="button" onClick={(event) => { event.stopPropagation(); openAttachment(attachment) }} className="block max-w-full cursor-pointer truncate rounded px-1 text-left text-[11px] font-semibold text-slate-700 hover:bg-amber-50/80 hover:text-indigo-700">{attachment.fileName}</button>
                ) : <p className="truncate text-[11px] font-semibold text-slate-700">{attachment.fileName}</p>}
                <p className="mt-0.5 truncate text-[9px] text-slate-400">{formatSize(attachment.fileSize)}{resource?.missing ? ' · File data unavailable on this device' : ''}</p>
                {resource?.url && !isImage && <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-medium text-indigo-500"><Download size={10} /> Open or download</span>}
                {resource === undefined && <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] text-slate-400"><LoaderCircle size={10} className="animate-spin" /> Loading</span>}
              </div>
              <button type="button" onClick={(event) => { event.stopPropagation(); onDeleteAttachment(attachment.id) }} aria-label={`Delete ${attachment.fileName}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600"><X size={15} /></button>
            </div>
          )
        })}
      </div>}

      {lightboxAttachment && lightboxRecord?.url && <ImagePreviewModal imageUrl={lightboxRecord.url} fileName={lightboxAttachment.fileName} onClose={() => setLightboxId(null)} />}
    </div>
  )
}
