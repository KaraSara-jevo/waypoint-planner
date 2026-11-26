import { useState } from 'react'
import { ArrowUpRight, Check, Plus, WandSparkles, X } from 'lucide-react'
import { createId, createRoadmapItem } from '../../data/sampleData'

export default function ReversePlanModal({ onClose, onCreateGoal }) {
  const [phase, setPhase] = useState('goal')
  const [goalTitle, setGoalTitle] = useState('')
  const [backwardSteps, setBackwardSteps] = useState([])
  const [stepTitle, setStepTitle] = useState('')
  const [requirements, setRequirements] = useState([])
  const [requirementInput, setRequirementInput] = useState('')
  const targetTitle = backwardSteps.length ? backwardSteps[backwardSteps.length - 1].title : goalTitle

  function addRequirement() {
    const text = requirementInput.trim()
    if (!text) return
    setRequirements((current) => [...current, text])
    setRequirementInput('')
  }

  function addPreviousStep() {
    const title = stepTitle.trim()
    if (!title) return
    setBackwardSteps((current) => [...current, { title, requirements }])
    setStepTitle('')
    setRequirements([])
    setRequirementInput('')
  }

  function generateRoadmap() {
    const startTitle = stepTitle.trim()
    if (!startTitle) return
    const steps = [
      {
        id: createId(),
        title: startTitle,
        requirements: requirements.map((text) => createRoadmapItem(text)),
        tasks: [],
        completed: false,
      },
      ...[...backwardSteps].reverse().map((step) => ({
        id: createId(),
        title: step.title,
        requirements: step.requirements.map((text) => createRoadmapItem(text)),
        tasks: [],
        completed: false,
      })),
      { id: createId(), title: goalTitle.trim(), requirements: [], tasks: [], completed: false },
    ]
    onCreateGoal(goalTitle.trim(), steps)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="wizard-title" className="my-auto max-h-[calc(100dvh-2rem)] w-[95vw] max-w-lg overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-7 pb-6 pt-7 sm:px-8">
          <div aria-hidden="true" className="absolute -right-8 -top-14 h-44 w-44 rounded-full border-[24px] border-white/60" />
          <button type="button" onClick={onClose} aria-label="Close wizard" className="absolute right-5 top-5 z-10 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"><X size={18} /></button>
          <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-indigo-600"><WandSparkles size={14} /> Reverse planning</div>
          <h2 id="wizard-title" className="relative mt-3 text-2xl font-bold tracking-tight text-slate-900">Start at the finish line.</h2>
          <p className="relative mt-1.5 max-w-sm text-sm leading-6 text-slate-500">Work backwards from your outcome. We’ll turn each answer into a step-by-step roadmap.</p>
          <div className="relative mt-5 flex items-center gap-2"><span className={`h-1.5 w-12 rounded-full ${phase === 'goal' ? 'bg-indigo-600' : 'bg-indigo-300'}`} /><span className={`h-1.5 w-12 rounded-full ${phase === 'backwards' ? 'bg-indigo-600' : 'bg-slate-200'}`} /><span className="ml-1 text-[10px] font-semibold text-slate-400">{phase === 'goal' ? '1 of 2' : '2 of 2'}</span></div>
        </div>

        <div className="px-7 py-7 sm:px-8">
          {phase === 'goal' ? (
            <form onSubmit={(event) => { event.preventDefault(); if (goalTitle.trim()) setPhase('backwards') }}>
              <label htmlFor="wizard-goal" className="block text-sm font-semibold text-slate-800">What is your final goal / end result?</label>
              <p className="mt-1 text-xs leading-5 text-slate-500">Name the outcome you want to reach. For example: “Publish a book”.</p>
              <input id="wizard-goal" autoFocus value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="e.g. Publish a book" className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
              <div className="mt-7 flex justify-end"><button type="submit" disabled={!goalTitle.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Start planning <ArrowUpRight size={16} /></button></div>
            </form>
          ) : (
            <div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Working backwards from</p><p className="mt-1 text-sm font-semibold text-indigo-950">{targetTitle}</p></div>
              <label htmlFor="backward-step" className="mt-5 block text-sm font-semibold text-slate-800">To achieve “{targetTitle}”, what needs to happen right before it?</label>
              <p className="mt-1 text-xs leading-5 text-slate-500">Add the milestone that must come just before the result above.</p>
              <input id="backward-step" autoFocus value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} placeholder="e.g. Finish the final manuscript" className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />

              <div className="mt-5">
                <label htmlFor="backward-requirement" className="block text-xs font-semibold text-slate-700">Requirements Needed <span className="font-normal text-slate-400">(optional)</span></label>
                <form onSubmit={(event) => { event.preventDefault(); addRequirement() }} className="mt-2 flex gap-2">
                  <input id="backward-requirement" value={requirementInput} onChange={(event) => setRequirementInput(event.target.value)} placeholder="e.g. Editor feedback" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                  <button type="submit" disabled={!requirementInput.trim()} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={14} /> Add</button>
                </form>
                {requirements.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{requirements.map((requirement, index) => <span key={`${requirement}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 pl-2.5 pr-1 text-[11px] font-medium text-violet-700">{requirement}<button type="button" onClick={() => setRequirements((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${requirement}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-violet-400 hover:bg-violet-100 hover:text-violet-800"><X size={12} /></button></span>)}</div>}
              </div>

              {backwardSteps.length > 0 && <p className="mt-4 text-[11px] text-slate-400">{backwardSteps.length} {backwardSteps.length === 1 ? 'milestone' : 'milestones'} mapped so far. Your next answer will be placed before “{backwardSteps[backwardSteps.length - 1].title}”.</p>}
              <div className="mt-7 flex flex-col-reverse justify-between gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <button type="button" onClick={() => setPhase('goal')} className="min-h-11 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100">Back</button>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" disabled={!stepTitle.trim()} onClick={addPreviousStep} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={14} /> Add Previous Step</button>
                  <button type="button" title="That's the Starting Point (Generate Roadmap)" disabled={!stepTitle.trim()} onClick={generateRoadmap} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">That’s the Starting Point <Check size={14} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
