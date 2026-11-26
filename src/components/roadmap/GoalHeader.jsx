import { useState } from 'react'
import { ArrowUpRight, ClipboardList, Copy, ListTree, Menu, Network, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function GoalHeader({ goal, onUpdateTitle, onDuplicate, viewMode, onViewChange, sidebarCollapsed, onToggleSidebar, onOpenMobileSidebar }) {
  const [editing, setEditing] = useState(false)
  const completedCount = goal?.steps.filter((step) => step.completed).length ?? 0
  const progress = goal?.steps.length ? Math.round((completedCount / goal.steps.length) * 100) : 0

  return (
    <>
      <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-200/80 bg-white/90 px-6 py-3 backdrop-blur max-sm:px-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 md:flex">
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button type="button" onClick={onOpenMobileSidebar} aria-label="Open navigation menu" title="Open navigation menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 md:hidden"><Menu size={20} /></button>
          <div className="flex items-center gap-2 text-xs text-slate-400 max-sm:hidden"><span>Workspace</span><span className="text-slate-300">/</span><span className="font-medium text-slate-600">Roadmap</span></div>
        </div>
        <div className="flex items-center gap-3">
          {goal && <div role="tablist" aria-label="Roadmap view" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button type="button" role="tab" aria-selected={viewMode === 'timeline'} onClick={() => onViewChange('timeline')} className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${viewMode === 'timeline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><ListTree size={14} /> Timeline View</button>
            <button type="button" role="tab" aria-selected={viewMode === 'mindmap'} onClick={() => onViewChange('mindmap')} className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${viewMode === 'mindmap' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Network size={14} /> Mind Map View</button>
          </div>}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm max-sm:hidden"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saved automatically</div>
        </div>
      </header>

      {goal && (viewMode === 'mindmap' ? (
        <div className="mx-auto max-w-[1600px] px-6 pb-2 pt-3 max-sm:px-4">
          <div className="flex items-center justify-between gap-8 max-md:flex-col max-md:items-stretch max-md:gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {editing ? (
                <input autoFocus value={goal.title} onChange={(event) => onUpdateTitle(event.target.value)} onBlur={() => setEditing(false)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label="Goal title" className="min-h-11 min-w-0 flex-1 border-0 border-b-2 border-indigo-400 bg-transparent px-0 py-1 text-xl font-bold tracking-tight text-slate-900 outline-none focus:ring-0" />
              ) : (
                <button type="button" onClick={() => setEditing(true)} className="group flex min-h-10 min-w-0 items-center gap-2 text-left" title="Edit goal title"><h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{goal.title || 'Untitled Goal'}</h1><span className="shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100"><ArrowUpRight size={15} /></span></button>
              )}
              <button type="button" onClick={onDuplicate} title="Duplicate roadmap" className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Copy size={13} /><span className="max-sm:hidden">Duplicate</span></button>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-[560px]">
              <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600"><ClipboardList size={15} className="text-indigo-600" /><span>Progress</span><span className="text-sm font-bold text-slate-800">{progress}%</span></div>
              <div className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
              <span className="shrink-0 text-[10px] text-slate-400">{completedCount}/{goal.steps.length}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600"><span className="h-px w-5 bg-indigo-300" /> Your roadmap</div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {editing ? (
                <input autoFocus value={goal.title} onChange={(event) => onUpdateTitle(event.target.value)} onBlur={() => setEditing(false)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label="Goal title" className="min-h-11 w-full border-0 border-b-2 border-indigo-400 bg-transparent px-0 py-1 text-3xl font-bold tracking-tight text-slate-900 outline-none focus:ring-0 sm:text-[34px]" />
              ) : (
                <button type="button" onClick={() => setEditing(true)} className="group flex min-h-11 max-w-full items-center gap-2 text-left" title="Edit goal title"><h1 className="truncate text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">{goal.title || 'Untitled Goal'}</h1><span className="shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100"><ArrowUpRight size={17} /></span></button>
              )}
              <p className="mt-2 text-sm text-slate-500">A clear path from idea to done.</p>
            </div>
            <button type="button" onClick={onDuplicate} title="Duplicate roadmap" className="mt-1 flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Copy size={14} /><span className="max-sm:hidden">Duplicate</span></button>
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_rgba(15,23,42,0.025)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ClipboardList size={15} /></div>Overall progress</div>
              <div className="flex items-baseline gap-1"><span className="text-xl font-bold tracking-tight text-slate-800">{progress}</span><span className="text-xs font-semibold text-slate-400">%</span></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="mt-2.5 flex justify-between text-[11px] text-slate-400"><span>{completedCount} of {goal.steps.length} main steps completed</span><span>{goal.steps.length === 0 ? 'Ready to plan' : progress === 100 ? 'Roadmap complete!' : `${goal.steps.length - completedCount} to go`}</span></div>
          </div>
        </div>
      ))}
    </>
  )
}
