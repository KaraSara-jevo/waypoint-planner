import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCircle2,
  GripVertical,
  LockKeyhole,
  Minus,
  Plus,
  Paperclip,
  RotateCcw,
  Scan,
  Trash2,
} from 'lucide-react'
import ResourceVault from '../shared/ResourceVault'

const ROOT_X = 38
const ROOT_WIDTH = 250
const STEP_X = 405
const STEP_WIDTH = 330
const BRANCH_X = 860
const CANVAS_WIDTH = 1380
const STEP_HEIGHT = 160

function curvedConnector(from, fromWidth, fromHeight, to, toWidth, toHeight) {
  const forward = to.x >= from.x
  const startX = forward ? from.x + fromWidth : from.x
  const endX = forward ? to.x : to.x + toWidth
  const startY = from.y + fromHeight / 2
  const endY = to.y + toHeight / 2
  const bend = Math.max(42, Math.abs(endX - startX) * 0.42)
  const controlOneX = startX + (forward ? bend : -bend)
  const controlTwoX = endX - (forward ? bend : -bend)
  return `M ${startX} ${startY} C ${controlOneX} ${startY}, ${controlTwoX} ${endY}, ${endX} ${endY}`
}

function groupHeight(items, withResources = false) {
  const itemHeights = items.reduce((total, item) => {
    const wrappedLines = Math.ceil((item.text?.length ?? 0) / 54)
    const resourceHeight = withResources
      ? 46 + ((item.notes?.length ?? 0) + (item.attachments?.length ?? 0) > 0 ? 38 : 0)
      : 0
    return total + Math.max(44, wrappedLines * 20 + 16) + resourceHeight
  }, 0)
  return Math.max(160, 42 + 48 + (items.length ? itemHeights : 32))
}

function MindMapView({ goal, onToggleItem, onCompleteStep, onAddItem, onDeleteItem, onAddNote, onUpdateNote, onDeleteNote, onAddAttachment, onDeleteAttachment, onUpdateNodePosition, onResetLayout }) {
  const [collapsedSteps, setCollapsedSteps] = useState({})
  const layout = useMemo(() => {
    const result = goal.steps.reduce((layoutState, step, index) => {
      const { top, rows } = layoutState
      const collapsed = Boolean(collapsedSteps[step.id])
      const requirementsHeight = collapsed ? 0 : groupHeight(step.requirements, true)
      const tasksHeight = collapsed ? 0 : groupHeight(step.tasks, true)
      const rowHeight = collapsed
        ? STEP_HEIGHT + 26
        : Math.max(STEP_HEIGHT + 26, requirementsHeight + tasksHeight + 22)
      const requirementTop = top
      const taskTop = requirementTop + requirementsHeight + 16
      const stepTop = top + (rowHeight - STEP_HEIGHT) / 2
      const row = {
        step,
        index,
        stepTop,
        stepCenter: stepTop + STEP_HEIGHT / 2,
        requirementsTop: requirementTop,
        requirementsHeight,
        tasksTop: taskTop,
        tasksHeight,
      }
      return { rows: [...rows, row], top: top + rowHeight + 24 }
    }, { rows: [], top: 34 })

    return { rows: result.rows, height: Math.max(440, result.top + 10) }
  }, [goal.steps, collapsedSteps])

  const defaultPositions = useMemo(() => {
    const positions = { root: { x: ROOT_X, y: layout.height / 2 - 70 } }
    for (const row of layout.rows) {
      positions[`step:${row.step.id}`] = { x: STEP_X, y: row.stepTop }
      positions[`requirements:${row.step.id}`] = { x: BRANCH_X, y: row.requirementsTop }
      positions[`tasks:${row.step.id}`] = { x: BRANCH_X, y: row.tasksTop }
    }
    return positions
  }, [layout])
  const [draggedPositions, setDraggedPositions] = useState({})
  const positions = useMemo(() => ({ ...defaultPositions, ...(goal.mindMapPositions ?? {}), ...draggedPositions }), [defaultPositions, goal.mindMapPositions, draggedPositions])
  const canvasSize = useMemo(() => {
    const right = Math.max(CANVAS_WIDTH, ...Object.entries(positions).map(([id, position]) => position.x + (id.startsWith('step:') ? STEP_WIDTH : id.startsWith('requirements:') || id.startsWith('tasks:') ? 470 : ROOT_WIDTH)))
    const bottom = Math.max(layout.height, ...Object.entries(positions).map(([id, position]) => position.y + (id.startsWith('step:') ? STEP_HEIGHT : id.startsWith('requirements:') ? layout.rows.find((row) => id === `requirements:${row.step.id}`)?.requirementsHeight ?? 100 : id.startsWith('tasks:') ? layout.rows.find((row) => id === `tasks:${row.step.id}`)?.tasksHeight ?? 100 : 140)))
    return { width: right + 30, height: bottom + 30 }
  }, [layout, positions])
  const [attachmentExpansion, setAttachmentExpansion] = useState({ version: 0, expanded: false })

  const [scale, setScale] = useState(0.88)
  const [offset, setOffset] = useState({ x: 18, y: 18 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef(null)
  const nodeDrag = useRef(null)
  const touchStart = useRef(null)
  const hasCenteredRef = useRef(false)
  const completedCount = goal.steps.filter((step) => step.completed).length
  const progress = goal.steps.length ? Math.round((completedCount / goal.steps.length) * 100) : 0
  const activeIndex = goal.steps.findIndex((step) => !step.completed)
  const canvasRef = useCallback((viewport) => {
    if (!viewport || hasCenteredRef.current) return
    hasCenteredRef.current = true
    const activeRow = layout.rows[activeIndex]
    const activePosition = activeRow ? positions[`step:${activeRow.step.id}`] : { x: STEP_X, y: layout.height / 2 - STEP_HEIGHT / 2 }
    const rootPosition = positions.root
    const focusX = (rootPosition.x + ROOT_WIDTH / 2 + activePosition.x + STEP_WIDTH / 2) / 2
    const focusY = (rootPosition.y + 70 + activePosition.y + STEP_HEIGHT / 2) / 2
    setOffset({
      x: viewport.clientWidth / 2 - focusX * scale,
      y: viewport.clientHeight / 2 - focusY * scale,
    })
  }, [activeIndex, layout, positions, scale])

  function startPan(event) {
    if (event.target.closest('[data-map-interactive], input, textarea, select, [contenteditable="true"]')) return
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  function startNodeDrag(event, nodeId) {
    event.preventDefault()
    event.stopPropagation()
    const position = positions[nodeId] ?? { x: 0, y: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    nodeDrag.current = { nodeId, startX: event.clientX, startY: event.clientY, origin: position, position }
    setIsDragging(true)
  }

  function movePan(event) {
    if (nodeDrag.current) {
      const { nodeId, startX, startY, origin } = nodeDrag.current
      const position = { x: Math.max(0, origin.x + (event.clientX - startX) / scale), y: Math.max(0, origin.y + (event.clientY - startY) / scale) }
      nodeDrag.current.position = position
      setDraggedPositions((current) => ({ ...current, [nodeId]: position }))
      return
    }
    if (!dragStart.current) return
    setOffset({
      x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
      y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
    })
  }

  function stopPan() {
    if (nodeDrag.current) {
      const { nodeId, position } = nodeDrag.current
      onUpdateNodePosition?.(nodeId, position)
      nodeDrag.current = null
      setIsDragging(false)
      return
    }
    dragStart.current = null
    setIsDragging(false)
  }

  function startTouchPan(event) {
    if (event.target.closest('[data-map-interactive], input, textarea, select, [contenteditable="true"]')) return
    const touch = event.touches[0]
    if (!touch) return
    touchStart.current = { x: touch.clientX, y: touch.clientY, offsetX: offset.x, offsetY: offset.y }
    setIsDragging(true)
  }

  function moveTouchPan(event) {
    if (!touchStart.current) return
    const touch = event.touches[0]
    if (!touch) return
    if (event.cancelable) event.preventDefault()
    setOffset({
      x: touchStart.current.offsetX + touch.clientX - touchStart.current.x,
      y: touchStart.current.offsetY + touch.clientY - touchStart.current.y,
    })
  }

  function stopTouchPan() {
    touchStart.current = null
    setIsDragging(false)
  }

  function updateZoom(change) {
    const viewport = canvasRef.current
    const nextScale = Math.min(1.6, Math.max(0.35, Number((scale + change).toFixed(2))))
    if (viewport) {
      setOffset((current) => ({
        x: viewport.clientWidth / 2 - (viewport.clientWidth / 2 - current.x) * nextScale / scale,
        y: viewport.clientHeight / 2 - (viewport.clientHeight / 2 - current.y) * nextScale / scale,
      }))
    }
    setScale(nextScale)
  }

  function resetView() {
    const viewport = canvasRef.current
    const width = viewport?.clientWidth ?? 900
    const height = viewport?.clientHeight ?? 620
    const nextScale = Math.max(0.35, Math.min(1, (width - 48) / canvasSize.width, (height - 70) / canvasSize.height))
    setScale(nextScale)
    setOffset({
      x: (width - canvasSize.width * nextScale) / 2,
      y: (height - canvasSize.height * nextScale) / 2,
    })
  }

  function resetLayout() {
    setDraggedPositions({})
    onResetLayout?.()
  }

  return (
    <section aria-label="Roadmap mind map" className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_12px_rgba(15,23,42,0.025)]">
      <div className="absolute bottom-3 right-3 z-40 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur" aria-label="Mind map canvas controls">
        <button type="button" data-map-interactive onClick={() => setAttachmentExpansion((current) => ({ version: current.version + 1, expanded: !current.expanded }))} aria-label={attachmentExpansion.expanded ? 'Collapse all attachments' : 'Expand all attachments'} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"><Paperclip size={13} /> {attachmentExpansion.expanded ? 'Collapse all' : 'Expand all'}</button>
        <button type="button" data-map-interactive onClick={resetLayout} aria-label="Reset layout" title="Reset node positions" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"><RotateCcw size={13} /> Reset Layout</button>
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <button type="button" data-map-interactive onClick={() => updateZoom(-0.1)} aria-label="Zoom out" title="Zoom out" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><Minus size={15} /></button>
        <span className="min-w-11 text-center text-[11px] font-bold tabular-nums text-slate-600">{Math.round(scale * 100)}%</span>
        <button type="button" data-map-interactive onClick={() => updateZoom(0.1)} aria-label="Zoom in" title="Zoom in" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><Plus size={15} /></button>
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <button type="button" data-map-interactive onClick={resetView} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"><Scan size={14} /> Fit to Screen</button>
      </div>
      <div
        ref={canvasRef}
        className={`relative h-[78dvh] min-h-[360px] max-h-[1000px] touch-none overflow-hidden bg-[radial-gradient(#e2e8f0_0.75px,transparent_0.75px)] [background-size:18px_18px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onLostPointerCapture={stopPan}
        onTouchStart={startTouchPan}
        onTouchMove={moveTouchPan}
        onTouchEnd={stopTouchPan}
        onTouchCancel={stopTouchPan}
      >
        <div className={`absolute left-0 top-0 ${isDragging ? '' : 'transition-transform duration-150 ease-out'}`} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'top left' }}>
          <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0 overflow-visible" width={canvasSize.width} height={canvasSize.height}>
            {layout.rows.map((row) => <path key={`root-connector-${row.step.id}`} d={curvedConnector(positions.root, ROOT_WIDTH, 140, positions[`step:${row.step.id}`], STEP_WIDTH, STEP_HEIGHT)} fill="none" stroke="#cbd5e1" strokeWidth="2" />)}
            {layout.rows.map((row) => {
              if (collapsedSteps[row.step.id]) return null
              const step = positions[`step:${row.step.id}`]
              return (
                <g key={`branch-connectors-${row.step.id}`} fill="none" stroke="#cbd5e1" strokeWidth="2">
                  <path d={curvedConnector(step, STEP_WIDTH, STEP_HEIGHT, positions[`requirements:${row.step.id}`], 470, row.requirementsHeight)} />
                  <path d={curvedConnector(step, STEP_WIDTH, STEP_HEIGHT, positions[`tasks:${row.step.id}`], 470, row.tasksHeight)} />
                </g>
              )
            })}
          </svg>

          <div data-map-interactive className="absolute z-10" style={{ left: positions.root.x, top: positions.root.y, width: ROOT_WIDTH }}>
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-[0_8px_24px_rgba(79,70,229,0.08)]">
              <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-600"><span className="h-2 w-2 rounded-full bg-violet-500" /> Main Goal</div><button type="button" data-map-interactive onPointerDown={(event) => startNodeDrag(event, 'root')} onTouchStart={(event) => event.stopPropagation()} aria-label="Drag goal node" title="Drag to move goal" className="flex h-9 w-9 cursor-grab items-center justify-center rounded-lg text-violet-400 hover:bg-white/80 hover:text-violet-700 active:cursor-grabbing"><GripVertical size={15} /></button></div>
              <h3 className="mt-2 line-clamp-3 text-sm font-bold leading-5 text-slate-800">{goal.title || 'Untitled Goal'}</h3>
              <div className="mt-4 flex items-center justify-between text-[10px] font-medium text-slate-500"><span>{completedCount} of {goal.steps.length} steps</span><span className="font-bold text-violet-700">{progress}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>

          {layout.rows.map((row) => {
            const { step, index } = row
            const isActive = !step.completed && index === activeIndex
            const locked = !step.completed && index !== activeIndex
            const collapsed = Boolean(collapsedSteps[step.id])
            const allItems = [...step.requirements, ...step.tasks]
            const allChecked = allItems.every((item) => item.checked)
            const nodeTone = step.completed
              ? 'border-emerald-300 bg-emerald-50/80'
              : isActive
                ? 'border-indigo-400 bg-indigo-50/80 shadow-[0_8px_24px_rgba(79,70,229,0.08)]'
                : 'border-slate-200 bg-slate-50'
            const badgeTone = step.completed
              ? 'bg-emerald-100 text-emerald-700'
              : isActive
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-200 text-slate-500'

            return (
              <div key={step.id}>
                <div data-map-interactive className={`absolute z-20 w-[330px] rounded-2xl border p-5 shadow-sm transition ${nodeTone} ${locked ? 'opacity-55' : ''}`} style={{ left: positions[`step:${step.id}`].x, top: positions[`step:${step.id}`].y, minHeight: STEP_HEIGHT }}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${badgeTone}`}>
                      {step.completed ? <CheckCircle2 size={16} /> : locked ? <LockKeyhole size={14} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Step {index + 1}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${badgeTone}`}>{step.completed ? 'Done' : isActive ? 'Active' : 'Locked'}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-800">{step.title}</p>
                    </div>
                    <button type="button" data-map-interactive onPointerDown={(event) => startNodeDrag(event, `step:${step.id}`)} onTouchStart={(event) => event.stopPropagation()} aria-label={`Drag step ${index + 1}`} title="Drag to move step" className="-mt-1 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-white/80 hover:text-indigo-700 active:cursor-grabbing"><GripVertical size={15} /></button>
                    <button type="button" data-map-interactive onClick={() => setCollapsedSteps((current) => ({ ...current, [step.id]: !current[step.id] }))} aria-label={`${collapsed ? 'Expand' : 'Collapse'} branches for step ${index + 1}`} title={collapsed ? 'Expand branches' : 'Collapse branches'} className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/80 hover:text-indigo-700">{collapsed ? <Plus size={15} /> : <Minus size={15} />}</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2 text-[9px] text-slate-500"><span>{step.requirements.length} requirements · {step.tasks.length} sub-steps</span><span>{allItems.filter((item) => item.checked).length}/{allItems.length} done</span></div>
                  {isActive && (
                    <button type="button" data-map-interactive disabled={!allChecked} onClick={() => onCompleteStep(step.id)} className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${allChecked ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>
                      <Check size={12} /> Complete Step
                    </button>
                  )}
                </div>

                {!collapsed && (
                  <>
                    <ChecklistBranch title="Requirements" items={step.requirements} tone="amber" left={positions[`requirements:${step.id}`].x} top={positions[`requirements:${step.id}`].y} height={row.requirementsHeight} nodeId={`requirements:${step.id}`} onStartDrag={startNodeDrag} locked={locked} section="requirements" stepId={step.id} onToggle={(itemId) => onToggleItem(step.id, 'requirements', itemId)} onAddItem={onAddItem} onDeleteItem={onDeleteItem} renderResources={(item, children) => (
                      <ResourceVault item={item} globalExpansion={attachmentExpansion} onAddNote={(text) => onAddNote(step.id, 'requirement', item.id, text)} onUpdateNote={(noteId, text) => onUpdateNote(step.id, 'requirement', item.id, noteId, text)} onDeleteNote={(noteId) => onDeleteNote(step.id, 'requirement', item.id, noteId)} onAddAttachment={(attachment) => onAddAttachment(step.id, 'requirement', item.id, attachment)} onDeleteAttachment={(attachmentId) => onDeleteAttachment(step.id, 'requirement', item.id, attachmentId)}>{children}</ResourceVault>
                    )} />
                    <ChecklistBranch title="Sub-steps" items={step.tasks} tone="indigo" left={positions[`tasks:${step.id}`].x} top={positions[`tasks:${step.id}`].y} height={row.tasksHeight} nodeId={`tasks:${step.id}`} onStartDrag={startNodeDrag} locked={locked} section="tasks" stepId={step.id} onToggle={(itemId) => onToggleItem(step.id, 'tasks', itemId)} onAddItem={onAddItem} onDeleteItem={onDeleteItem} renderResources={(item, children) => (
                      <ResourceVault item={item} globalExpansion={attachmentExpansion} onAddNote={(text) => onAddNote(step.id, 'substep', item.id, text)} onUpdateNote={(noteId, text) => onUpdateNote(step.id, 'substep', item.id, noteId, text)} onDeleteNote={(noteId) => onDeleteNote(step.id, 'substep', item.id, noteId)} onAddAttachment={(attachment) => onAddAttachment(step.id, 'substep', item.id, attachment)} onDeleteAttachment={(attachmentId) => onDeleteAttachment(step.id, 'substep', item.id, attachmentId)}>{children}</ResourceVault>
                    )} />
                  </>
                )}
              </div>
            )
          })}

          {goal.steps.length === 0 && <div className="absolute left-[370px] top-[184px] rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-xs text-slate-500">Add a step to start mapping this goal.</div>}
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-medium text-slate-500 shadow-md backdrop-blur">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-emerald-400 bg-emerald-100" /> Completed</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-indigo-400 bg-indigo-100" /> Active</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-100" /> Locked</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-amber-700"><i className="h-2.5 w-2.5 rounded-sm bg-amber-200" /> Requirements</span>
        <span className="inline-flex items-center gap-1.5 text-indigo-700"><i className="h-2.5 w-2.5 rounded-sm bg-indigo-200" /> Sub-steps</span>
      </div>
    </section>
  )
}

function ChecklistBranch({ title, items, tone, left, top, height, locked, section, stepId, nodeId, onStartDrag, onToggle, onAddItem, onDeleteItem, renderResources }) {
  const [draft, setDraft] = useState('')
  const amber = tone === 'amber'
  const colors = amber
    ? { card: 'border-amber-200 bg-amber-50/70', heading: 'text-amber-800', item: 'border-amber-100 bg-white/90', checkbox: 'border-amber-300 text-amber-700', checked: 'border-amber-500 bg-amber-500' }
    : { card: 'border-indigo-200 bg-indigo-50/70', heading: 'text-indigo-800', item: 'border-indigo-100 bg-white/90', checkbox: 'border-indigo-300 text-indigo-700', checked: 'border-indigo-500 bg-indigo-500' }

  return (
    <div data-map-interactive className={`absolute z-10 w-[470px] max-h-[72vh] touch-pan-y overflow-y-auto rounded-xl border p-3.5 ${colors.card} ${locked ? 'opacity-55' : ''}`} style={{ left, top, height: Math.max(160, height) }} onPointerDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <div className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] ${colors.heading}`}><span className={`h-1.5 w-1.5 rounded-full ${amber ? 'bg-amber-500' : 'bg-indigo-500'}`} />{title}<button type="button" data-map-interactive onPointerDown={(event) => onStartDrag(event, nodeId)} onTouchStart={(event) => event.stopPropagation()} aria-label={`Drag ${title.toLowerCase()} branch`} title="Drag to move branch" className="ml-auto flex h-9 w-9 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-white/80 hover:text-indigo-700 active:cursor-grabbing"><GripVertical size={15} /></button><span className="text-[10px] font-medium normal-case tracking-normal opacity-70">{items.length}</span></div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className={`group rounded-lg border px-2.5 py-1.5 ${colors.item}`}>
              {renderResources ? renderResources(item, (
                <div className="flex min-h-10 items-start gap-2">
                  <button type="button" disabled={locked} onClick={(event) => { event.stopPropagation(); onToggle(item.id) }} aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.text}`} className={`-ml-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${item.checked ? colors.checked + ' text-white' : colors.checkbox + ' bg-white'}`}>{item.checked && <Check size={10} strokeWidth={3} />}</span>
                  </button>
                  <span className={`min-w-0 flex-1 pt-1 text-xs leading-5 ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                  <button type="button" disabled={locked} onClick={(event) => { event.stopPropagation(); onDeleteItem(stepId, section, item.id) }} aria-label={`Delete ${item.text}`} title="Delete requirement" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-100 transition hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"><Trash2 size={14} /></button>
                </div>
              )) : (
                <div className="flex min-h-10 items-start gap-2">
                  <button type="button" disabled={locked} onClick={(event) => { event.stopPropagation(); onToggle(item.id) }} aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.text}`} className={`-ml-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${item.checked ? colors.checked + ' text-white' : colors.checkbox + ' bg-white'}`}>{item.checked && <Check size={10} strokeWidth={3} />}</span>
                  </button>
                  <span className={`min-w-0 flex-1 pt-1 text-xs leading-5 ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                  <button type="button" disabled={locked} onClick={(event) => { event.stopPropagation(); onDeleteItem(stepId, section, item.id) }} aria-label={`Delete ${item.text}`} title="Delete sub-step" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-100 transition hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"><Trash2 size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="rounded-lg border border-dashed border-white/80 px-2 py-1.5 text-[9px] text-slate-400">No {title.toLowerCase()} added.</p>}
      <form className="mt-2 flex gap-1.5" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); const text = draft.trim(); if (!text || locked) return; onAddItem(stepId, section, text); setDraft('') }}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onPointerDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} disabled={locked} aria-label={`New ${title.toLowerCase().slice(0, -1)}`} placeholder={`Add a ${section === 'requirements' ? 'requirement' : 'sub-step'}...`} className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/90 bg-white/90 px-2.5 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
        <button type="submit" disabled={locked || !draft.trim()} onPointerDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className={`inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[10px] font-semibold ${amber ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400`}><Plus size={13} /> Add {section === 'requirements' ? 'Requirement' : 'Sub-step'}</button>
      </form>
    </div>
  )
}

export default MindMapView
