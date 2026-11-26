import { useState } from 'react'
import { Check, Copy, FileText, Sparkles, WandSparkles, X } from 'lucide-react'
import { createId, createRoadmapItem } from '../../data/sampleData'
import { parseRoadmapText } from '../../utils/textParser'

function createPrompt(goal) {
  return `Create a clear, practical, sequential roadmap for this goal: ${goal.trim()}\n\nOutput only plain text using exactly this structure. Include multiple numbered steps, with requirements and actionable tasks under the relevant steps. Do not use Markdown headings, tables, or code fences.\n\nGoal: ${goal.trim()}\nStep 1: [Step Title]\n- Req: [Requirement 1]\n- Task: [Sub-step 1]\nStep 2: [Step Title]\n- Req: [Requirement 1]\n- Task: [Sub-step 1]`
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('Clipboard access is unavailable. You can still copy the prompt manually.')
}

export default function ImportTextModal({ onClose, onCreateGoal }) {
  const [goalIdea, setGoalIdea] = useState('')
  const [rawText, setRawText] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleCopyPrompt() {
    const promptGoal = goalIdea.trim()
    if (!promptGoal) {
      setError('Enter a goal first so the prompt can include it.')
      return
    }

    try {
      await copyToClipboard(createPrompt(promptGoal))
      setCopied(true)
      setError('')
    } catch (copyError) {
      setCopied(false)
      setError(copyError instanceof Error ? copyError.message : 'Could not copy the prompt.')
    }
  }

  function buildRoadmap() {
    const roadmap = parseRoadmapText(rawText)
    if (roadmap.steps.length === 0) {
      setError('Add at least one line such as “Step 1: Choose a location” before building the roadmap.')
      return
    }

    const steps = roadmap.steps.map((step) => ({
      id: createId(),
      title: step.title,
      requirements: step.requirements.map((item) => createRoadmapItem(item.text)),
      tasks: step.tasks.map((item) => createRoadmapItem(item.text)),
      completed: false,
    }))
    onCreateGoal(roadmap.title, steps)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="import-text-title" className="my-auto max-h-[calc(100dvh-2rem)] w-[95vw] max-w-lg overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600"><WandSparkles size={14} /> AI assisted, no API key</div>
            <h2 id="import-text-title" className="mt-2 text-xl font-bold tracking-tight text-slate-900">Import from AI / Text</h2>
            <p className="mt-1 text-sm text-slate-500">Ask any AI to draft a plan, then paste it here to make it interactive.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close importer" className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-1 gap-0">
          <section className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">1</span><h3 className="text-sm font-bold text-slate-800">Get AI Help</h3></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Enter the outcome you want. Copy a ready-to-use prompt into Gemini, ChatGPT, or another AI tool.</p>
            <label htmlFor="ai-goal" className="mt-5 block text-xs font-semibold text-slate-700">Your goal</label>
            <input id="ai-goal" value={goalIdea} onChange={(event) => { setGoalIdea(event.target.value); setCopied(false); setError('') }} placeholder="e.g. Open a small coffee shop" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            <button type="button" onClick={handleCopyPrompt} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"><span>{copied ? <Check size={15} /> : <Copy size={15} />}</span>{copied ? 'Copied!' : 'Copy Prompt for AI'}</button>
            <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"><Sparkles size={12} /> Prompt format</p>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] leading-5 text-slate-500">{'Goal: [Goal Name]\nStep 1: [Step Title]\n- Req: [Requirement]\n- Task: [Sub-step]'}</pre>
            </div>
          </section>

          <section className="px-6 py-6 sm:px-8">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">2</span><h3 className="text-sm font-bold text-slate-800">Paste &amp; Build</h3></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Paste the AI response or type your own outline. Blank lines and minor formatting variations are fine.</p>
            <label htmlFor="roadmap-text" className="sr-only">Roadmap text</label>
            <textarea id="roadmap-text" value={rawText} onChange={(event) => { setRawText(event.target.value); setError('') }} placeholder={'Goal: Open a small coffee shop\n\nStep 1: Research the market\n- Req: Local demographic data\n- Task: Compare nearby cafes'} className="mt-4 min-h-[200px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 sm:min-h-[240px]" />
            {error && <p role="alert" className="mt-2 text-xs leading-5 text-rose-600">{error}</p>}
            <button type="button" onClick={buildRoadmap} disabled={!rawText.trim()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><FileText size={16} /> Build Roadmap</button>
          </section>
        </div>
      </div>
    </div>
  )
}
