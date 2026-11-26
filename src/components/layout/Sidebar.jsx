import { useMemo, useRef, useState } from 'react'
import { Download, FileText, FolderKanban, PanelLeftClose, Plus, Sparkles, Trash2, Upload, WandSparkles, X } from 'lucide-react'

export default function Sidebar({ goals, activeGoalId, collapsed, mobileOpen, onCloseMobile, onToggleCollapse, onSelectGoal, onCreateGoal, onDeleteGoal, onPlanBackwards, onImportFromText, onExportBackup, onImportBackup }) {
  const [deleteGoalId, setDeleteGoalId] = useState(null)
  const [backupImport, setBackupImport] = useState(null)
  const [backupError, setBackupError] = useState('')
  const fileInputRef = useRef(null)
  const stepCounts = useMemo(() => Object.fromEntries(goals.map((goal) => [
    goal.id,
    `${goal.steps.filter((step) => step.completed).length}/${goal.steps.length}`,
  ])), [goals])
  const goalToDelete = goals.find((goal) => goal.id === deleteGoalId)

  function confirmDelete() {
    if (deleteGoalId) onDeleteGoal(deleteGoalId)
    setDeleteGoalId(null)
  }

  async function handleBackupFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const data = JSON.parse(await file.text())
      const backupGoals = Array.isArray(data) ? data : data?.goals
      if (!Array.isArray(backupGoals)) throw new Error('This file does not contain a roadmap backup.')
      setBackupError('')
      setBackupImport({ data, fileName: file.name, count: backupGoals.length })
    } catch (error) {
      setBackupImport({ fileName: file.name, count: 0 })
      setBackupError(error instanceof Error ? error.message : 'The backup file could not be read.')
    }
  }

  function confirmBackupImport() {
    if (!backupImport?.data) return
    const result = onImportBackup(backupImport.data)
    if (result.success) {
      setBackupImport(null)
      setBackupError('')
      return
    }
    setBackupError(result.error)
  }

  function runMobileAction(action) {
    action()
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation drawer" onClick={onCloseMobile} className="fixed inset-0 z-40 cursor-default bg-slate-950/45 backdrop-blur-[1px] md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-950/15 transition-transform duration-300 md:static md:z-auto md:w-[272px] md:shrink-0 md:translate-x-0 md:shadow-none md:transition-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'md:hidden' : ''}`}>
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-100 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200"><WandSparkles size={18} strokeWidth={1.9} /></div>
          <div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight text-slate-900">Waypoint</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Personal planner</p></div>
          <button type="button" onClick={() => runMobileAction(onToggleCollapse)} aria-label="Hide sidebar" title="Hide sidebar" className="ml-auto hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-700 md:flex"><PanelLeftClose size={17} /></button>
          <button type="button" onClick={onCloseMobile} aria-label="Close sidebar" title="Close sidebar" className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-700 md:hidden"><X size={18} /></button>
        </div>

        <div className="flex shrink-0 flex-col gap-2 px-4 pt-6">
          <button type="button" onClick={() => runMobileAction(onCreateGoal)} title="New Goal" className="flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100">
            <Plus size={16} /><span>New Goal</span>
          </button>
          <button type="button" onClick={() => runMobileAction(onPlanBackwards)} title="Plan Backwards" className="flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-100">
            <WandSparkles size={15} /><span>Plan Backwards</span>
          </button>
          <button type="button" onClick={() => runMobileAction(onImportFromText)} title="Import from AI / Text" className="flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100">
            <FileText size={15} /><span>Import from AI / Text</span>
          </button>
        </div>

        <div className="mt-7 min-h-0 flex-1 overflow-y-auto px-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Goals &amp; Roadmaps</p>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{goals.length}</span>
          </div>
          <nav className="space-y-1" aria-label="Goals and roadmaps">
            {goals.map((goal) => {
              const selected = goal.id === activeGoalId
              return (
                <div key={goal.id} className={`group relative flex items-center rounded-xl transition ${selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <button type="button" onClick={() => runMobileAction(() => onSelectGoal(goal.id))} title={goal.title} className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2.5 text-left">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}><FolderKanban size={14} /></div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{goal.title}</span>
                    <span className="mr-1 text-[10px] font-medium text-slate-400">{stepCounts[goal.id]}</span>
                  </button>
                  <button type="button" onClick={() => { setDeleteGoalId(goal.id); onCloseMobile() }} aria-label={`Delete ${goal.title}`} title="Delete goal" className="mr-1 flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"><Trash2 size={15} /></button>
                </div>
              )
            })}
            {goals.length === 0 && <p className="px-2 py-3 text-xs leading-5 text-slate-400 max-sm:hidden">Create a goal to start planning.</p>}
          </nav>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Data backup</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => runMobileAction(onExportBackup)} title="Export Backup" className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Download size={14} /><span>Export</span></button>
            <button type="button" onClick={() => runMobileAction(() => fileInputRef.current?.click())} title="Import Backup" className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Upload size={14} /><span>Import</span></button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleBackupFile} className="hidden" />
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Sparkles size={15} /></div>
            <div><p className="text-xs font-semibold text-slate-700">One step at a time</p><p className="mt-0.5 text-[10px] text-slate-400">Small progress adds up.</p></div>
          </div>
        </div>
      </aside>

      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteGoalId(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 size={18} /></div>
            <h2 id="delete-title" className="mt-4 text-lg font-bold text-slate-900">Delete this goal?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">“{goalToDelete.title}” and its steps will be removed from your roadmap.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteGoalId(null)} className="min-h-10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={confirmDelete} className="min-h-10 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700">Delete goal</button>
            </div>
          </div>
        </div>
      )}

      {backupImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) { setBackupImport(null); setBackupError('') } }}>
          <div role="dialog" aria-modal="true" aria-labelledby="backup-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => { setBackupImport(null); setBackupError('') }} aria-label="Close backup dialog" className="float-right flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Upload size={18} /></div>
            <h2 id="backup-title" className="mt-4 text-lg font-bold text-slate-900">Restore a backup?</h2>
            {backupError ? <p className="mt-2 text-sm leading-6 text-rose-600">{backupError}</p> : <p className="mt-2 text-sm leading-6 text-slate-500">Restore {backupImport.count} {backupImport.count === 1 ? 'roadmap' : 'roadmaps'} from <span className="font-medium text-slate-700">{backupImport.fileName}</span>? This replaces your current roadmaps.</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setBackupImport(null); setBackupError('') }} className="min-h-10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              {!backupError && <button type="button" onClick={confirmBackupImport} className="min-h-10 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Restore backup</button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
