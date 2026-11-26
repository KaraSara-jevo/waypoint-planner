import { useState } from 'react'
import { Check, CheckCircle2, ChevronDown, FileText, LockKeyhole, Plus, Trash2 } from 'lucide-react'
import ResourceVault from '../shared/ResourceVault'

function AddItemForm({ onAdd }) {
  const [text, setText] = useState('')

  function submit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  return (
    <form onSubmit={submit} className="mt-3 flex items-center gap-2">
      <Plus size={15} className="shrink-0 text-slate-400" />
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Add an item..." aria-label="Add an item" className="min-h-10 min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0" />
      {text.trim() && <button className="min-h-10 rounded-md px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50" type="submit">Add</button>}
    </form>
  )
}

function ChecklistSection({ title, subtitle, icon: Icon, items, onAdd, onToggle, onDelete, tone, resourceType, onAddNote, onUpdateNote, onDeleteNote, onAddAttachment, onDeleteAttachment }) {
  const palette = tone === 'violet'
    ? { icon: 'bg-violet-50 text-violet-600', checked: 'border-violet-600 bg-violet-600' }
    : { icon: 'bg-blue-50 text-blue-600', checked: 'border-blue-600 bg-blue-600' }

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${palette.icon}`}><Icon size={17} strokeWidth={1.8} /></div>
        <div className="pt-0.5"><h3 className="text-sm font-semibold text-slate-800">{title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">{subtitle}</p></div>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item) => {
            const row = (
              <div className="group flex min-h-9 items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-50">
                <button type="button" onClick={() => onToggle(item.id)} aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.text}`} className="-ml-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition hover:bg-slate-100">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border transition ${item.checked ? palette.checked + ' text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                    {item.checked && <Check size={11} strokeWidth={3} />}
                  </span>
                </button>
                <span className={`min-w-0 flex-1 pt-1 text-[13px] leading-5 ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                <button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.text}`} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"><Trash2 size={15} /></button>
              </div>
            )

            return (
              <li key={item.id} className="group rounded-lg">
                <ResourceVault
                  item={item}
                  onAddNote={(text) => onAddNote(resourceType, item.id, text)}
                  onUpdateNote={(noteId, text) => onUpdateNote(resourceType, item.id, noteId, text)}
                  onDeleteNote={(noteId) => onDeleteNote(resourceType, item.id, noteId)}
                  onAddAttachment={(attachment) => onAddAttachment(resourceType, item.id, attachment)}
                  onDeleteAttachment={(attachmentId) => onDeleteAttachment(resourceType, item.id, attachmentId)}
                >
                  {row}
                </ResourceVault>
              </li>
            )
          })}
        </ul>
      ) : <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-400">Nothing added yet.</p>}
      <AddItemForm onAdd={onAdd} />
    </section>
  )
}

export default function StepCard({ step, index, isActive, locked, expanded, onToggleExpanded, onUpdateTitle, onDeleteStep, onAddItem, onToggleItem, onDeleteItem, onAddNote, onUpdateNote, onDeleteNote, onAddAttachment, onDeleteAttachment, onComplete }) {
  const items = [...step.requirements, ...step.tasks]
  const checkedCount = items.filter((item) => item.checked).length
  const canComplete = items.length === 0 || checkedCount === items.length

  return (
    <article className={`relative pl-[54px] max-sm:pl-[44px] ${locked ? 'opacity-55' : ''}`}>
      <div className={`absolute left-0 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border-[3px] bg-[#f7f8fc] max-sm:h-8 max-sm:w-8 ${step.completed ? 'border-emerald-500 text-emerald-600' : isActive ? 'border-indigo-500 text-indigo-600 shadow-[0_0_0_4px_rgba(99,102,241,0.10)]' : 'border-slate-300 text-slate-400'} max-sm:left-[1px]`}>
        {step.completed ? <CheckCircle2 size={20} className="fill-emerald-500 text-white" /> : isActive ? <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> : <LockKeyhole size={15} />}
      </div>

      <div className={`overflow-hidden rounded-2xl border bg-white shadow-[0_3px_12px_rgba(15,23,42,0.025)] transition ${isActive ? 'border-indigo-300 ring-1 ring-indigo-100' : step.completed ? 'border-emerald-100' : 'border-slate-200/80'}`}>
        <button type="button" disabled={locked} onClick={onToggleExpanded} className={`flex w-full items-start gap-3 px-5 py-4 text-left transition max-sm:px-4 ${locked ? 'cursor-not-allowed' : 'hover:bg-slate-50/60'}`}>
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${step.completed ? 'bg-emerald-50 text-emerald-700' : isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{String(index + 1).padStart(2, '0')}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`text-sm font-semibold ${step.completed ? 'text-slate-700' : 'text-slate-800'}`}>Step {index + 1}</span>
              {isActive && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">In progress</span>}
              {step.completed && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>}
              {locked && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Locked</span>}
            </span>
            <span className="mt-1.5 block truncate text-[13px] text-slate-500">{step.title}</span>
          </span>
          {!locked && <ChevronDown size={17} className={`mt-1 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
        </button>

        {expanded && !locked && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 max-sm:px-4">
            <div className="mb-5 flex items-start gap-2">
              <input value={step.title} onChange={(event) => onUpdateTitle(event.target.value)} aria-label={`Step ${index + 1} title`} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
              <button type="button" onClick={onDeleteStep} aria-label={`Delete step ${index + 1}`} title="Delete step" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7">
              <ChecklistSection title="Requirements / Resources Needed" subtitle="Gather these before you begin." icon={FileText} items={step.requirements} tone="violet" resourceType="requirement" onAdd={(text) => onAddItem('requirements', text)} onToggle={(itemId) => onToggleItem('requirements', itemId)} onDelete={(itemId) => onDeleteItem('requirements', itemId)} onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} onAddAttachment={onAddAttachment} onDeleteAttachment={onDeleteAttachment} />
              <ChecklistSection title="Actionable Sub-steps" subtitle="The tasks that move this step forward." icon={CheckCircle2} items={step.tasks} tone="blue" resourceType="substep" onAdd={(text) => onAddItem('tasks', text)} onToggle={(itemId) => onToggleItem('tasks', itemId)} onDelete={(itemId) => onDeleteItem('tasks', itemId)} onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} onAddAttachment={onAddAttachment} onDeleteAttachment={onDeleteAttachment} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-400">{items.length === 0 ? 'No checklist items required.' : `${checkedCount} of ${items.length} items checked`}</p>
              {step.completed ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><Check size={14} /> Step completed</span> : isActive ? (
                <button type="button" disabled={!canComplete} onClick={onComplete} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${canComplete ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}>Complete Step <Check size={14} /></button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
