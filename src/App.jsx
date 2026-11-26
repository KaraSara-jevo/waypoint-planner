import { useState } from 'react'
import { FolderKanban, Plus, WandSparkles } from 'lucide-react'
import ImportTextModal from './components/modals/ImportTextModal'
import ReversePlanModal from './components/modals/ReversePlanModal'
import Sidebar from './components/layout/Sidebar'
import GoalHeader from './components/roadmap/GoalHeader'
import MindMapView from './components/roadmap/MindMapView'
import TimelineView from './components/roadmap/TimelineView'
import { useRoadmaps } from './hooks/useRoadmaps'

function App() {
  const {
    goals,
    activeGoal,
    activeGoalId,
    selectGoal,
    createGoal,
    deleteGoal,
    duplicateGoal,
    updateGoalTitle,
    updateMindMapNodePosition,
    resetMindMapLayout,
    addStep,
    updateStep,
    deleteStep,
    addChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    completeStep,
    addNote,
    updateNote,
    deleteNote,
    addAttachment,
    deleteAttachment,
    exportBackup,
    importBackup,
  } = useRoadmaps()
  const [expandedStepId, setExpandedStepId] = useState(undefined)
  const [reversePlanOpen, setReversePlanOpen] = useState(false)
  const [importTextOpen, setImportTextOpen] = useState(false)
  const [viewMode, setViewMode] = useState('timeline')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function handleSelectGoal(goalId) {
    selectGoal(goalId)
    setExpandedStepId(undefined)
  }

  function handleCreateGoal(title, steps) {
    createGoal(title, steps)
    setExpandedStepId(undefined)
  }

  function handleImportBackup(data) {
    const result = importBackup(data)
    if (result.success) setExpandedStepId(undefined)
    return result
  }

  function handleAddStep() {
    const step = addStep()
    if (step) setExpandedStepId(step.id)
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#f7f8fc] text-slate-900">
      <Sidebar
        goals={goals}
        activeGoalId={activeGoalId}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
        onSelectGoal={handleSelectGoal}
        onCreateGoal={() => { createGoal(); setExpandedStepId(undefined) }}
        onDeleteGoal={(goalId) => { deleteGoal(goalId); setExpandedStepId(undefined) }}
        onPlanBackwards={() => setReversePlanOpen(true)}
        onImportFromText={() => setImportTextOpen(true)}
        onExportBackup={exportBackup}
        onImportBackup={handleImportBackup}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <GoalHeader key={activeGoalId ?? 'empty'} goal={activeGoal} onUpdateTitle={updateGoalTitle} onDuplicate={() => { duplicateGoal(); setExpandedStepId(undefined) }} viewMode={viewMode} onViewChange={setViewMode} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <div className={viewMode === 'mindmap' ? 'mx-auto w-full max-w-none px-4 pb-3 pt-1 max-md:px-3 max-sm:px-2' : 'mx-auto max-w-[1040px] px-8 pb-20 pt-12 max-md:px-4 max-md:pt-6'}>
          {activeGoal ? (
            viewMode === 'timeline' ? (
              <TimelineView
                goal={activeGoal}
                expandedStepId={expandedStepId}
                onExpandedStepChange={setExpandedStepId}
                onAddStep={handleAddStep}
                onUpdateStep={updateStep}
                onDeleteStep={(stepId) => { deleteStep(stepId); if (expandedStepId === stepId) setExpandedStepId(undefined) }}
                onAddItem={addChecklistItem}
                onToggleItem={toggleChecklistItem}
                onDeleteItem={deleteChecklistItem}
                onAddNote={addNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onAddAttachment={addAttachment}
                onDeleteAttachment={deleteAttachment}
                onCompleteStep={completeStep}
              />
            ) : (
              <MindMapView
                key={activeGoalId}
                goal={activeGoal}
                onUpdateNodePosition={updateMindMapNodePosition}
                onResetLayout={resetMindMapLayout}
                onToggleItem={toggleChecklistItem}
                onCompleteStep={completeStep}
                onAddItem={addChecklistItem}
                onDeleteItem={deleteChecklistItem}
                onAddNote={addNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onAddAttachment={addAttachment}
                onDeleteAttachment={deleteAttachment}
              />
            )
          ) : (
            <div className="mx-auto mt-20 max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FolderKanban size={22} /></div>
              <h1 className="mt-4 text-xl font-semibold tracking-tight">Start with a goal</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Create a roadmap to break your next big idea into clear, actionable steps.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => createGoal()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> New Goal</button>
                <button type="button" onClick={() => setReversePlanOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><WandSparkles size={16} /> Plan Backwards</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {reversePlanOpen && <ReversePlanModal onClose={() => setReversePlanOpen(false)} onCreateGoal={handleCreateGoal} />}
      {importTextOpen && <ImportTextModal onClose={() => setImportTextOpen(false)} onCreateGoal={handleCreateGoal} />}
    </div>
  )
}

export default App
