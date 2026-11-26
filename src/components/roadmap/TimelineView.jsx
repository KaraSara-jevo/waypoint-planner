import { Plus } from 'lucide-react'
import StepCard from './StepCard'

export default function TimelineView({ goal, expandedStepId, onExpandedStepChange, onAddStep, onUpdateStep, onDeleteStep, onAddItem, onToggleItem, onDeleteItem, onAddNote, onUpdateNote, onDeleteNote, onAddAttachment, onDeleteAttachment, onCompleteStep }) {
  const activeIndex = goal.steps.findIndex((step) => !step.completed)
  const defaultOpenId = goal.steps[activeIndex]?.id
  const currentOpenId = expandedStepId === undefined ? defaultOpenId : expandedStepId

  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div><h2 className="text-lg font-bold tracking-tight text-slate-800">The journey</h2><p className="mt-1 text-xs text-slate-500">Work through each step in order to keep momentum.</p></div>
        <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-slate-200/80">{goal.steps.length} {goal.steps.length === 1 ? 'step' : 'steps'}</span>
      </div>

      <div className="relative">
        {goal.steps.length > 0 && <div aria-hidden="true" className="absolute bottom-8 left-[19px] top-7 w-px bg-slate-200 max-sm:left-[16px]" />}
        <div className="space-y-5">
          {goal.steps.map((step, index) => {
            const isActive = !step.completed && index === activeIndex
            const locked = !step.completed && index !== activeIndex
            const expanded = currentOpenId === step.id
            return (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isActive={isActive}
                locked={locked}
                expanded={expanded}
                onToggleExpanded={() => onExpandedStepChange(expanded ? null : step.id)}
                onUpdateTitle={(title) => onUpdateStep(step.id, (current) => ({ ...current, title }))}
                onDeleteStep={() => { onDeleteStep(step.id); if (expandedStepId === step.id) onExpandedStepChange(undefined) }}
                onAddItem={(section, text) => onAddItem(step.id, section, text)}
                onToggleItem={(section, itemId) => onToggleItem(step.id, section, itemId)}
                onDeleteItem={(section, itemId) => onDeleteItem(step.id, section, itemId)}
                onAddNote={(type, itemId, text) => onAddNote(step.id, type, itemId, text)}
                onUpdateNote={(type, itemId, noteId, text) => onUpdateNote(step.id, type, itemId, noteId, text)}
                onDeleteNote={(type, itemId, noteId) => onDeleteNote(step.id, type, itemId, noteId)}
                onAddAttachment={(type, itemId, attachment) => onAddAttachment(step.id, type, itemId, attachment)}
                onDeleteAttachment={(type, itemId, attachmentId) => onDeleteAttachment(step.id, type, itemId, attachmentId)}
                onComplete={() => { if (onCompleteStep(step.id)) onExpandedStepChange(undefined) }}
              />
            )
          })}
        </div>

        <div className="relative z-10 mt-5 pl-[54px] max-sm:pl-[44px]">
          <button type="button" onClick={onAddStep} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-xs font-semibold text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Plus size={13} /></span> Add Step</button>
        </div>
      </div>
    </>
  )
}
