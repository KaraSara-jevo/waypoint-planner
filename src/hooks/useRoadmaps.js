import { useEffect, useState } from 'react'
import { createId, createRoadmapItem, sampleRoadmaps, STORAGE_KEY } from '../data/sampleData'
import { WaypointFileVault } from '../utils/fileVaultDB'

function getAttachmentIds(roadmaps) {
  return roadmaps.flatMap((goal) => goal.steps.flatMap((step) =>
    [...(step.requirements ?? []), ...(step.tasks ?? [])].flatMap((item) => (item.attachments ?? []).map((attachment) => attachment.id)),
  )).filter(Boolean)
}

function resourceSection(type) {
  return type === 'requirement' || type === 'requirements' ? 'requirements' : 'tasks'
}

function normalizeRoadmaps(roadmaps) {
  return roadmaps.map((goal) => ({
    ...goal,
    steps: (goal.steps ?? []).map((step) => ({
      ...step,
      requirements: (step.requirements ?? []).map((item) => ({ ...item, notes: item.notes ?? [], attachments: item.attachments ?? [] })),
      tasks: (step.tasks ?? []).map((item) => ({ ...item, notes: item.notes ?? [], attachments: item.attachments ?? [] })),
    })),
  }))
}

function removeOrphanedFiles(previousRoadmaps, nextRoadmaps) {
  const retainedIds = new Set(getAttachmentIds(nextRoadmaps))
  for (const id of getAttachmentIds(previousRoadmaps)) {
    if (!retainedIds.has(id)) WaypointFileVault.deleteFile(id).catch(() => {})
  }
}

function readRoadmaps() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return sampleRoadmaps
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? normalizeRoadmaps(parsed) : sampleRoadmaps
  } catch {
    return sampleRoadmaps
  }
}

export function useRoadmaps() {
  const [goals, setGoals] = useState(readRoadmaps)
  const [activeGoalId, setActiveGoalId] = useState(null)
  const activeGoal = goals.find((goal) => goal.id === activeGoalId) ?? goals[0] ?? null

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
    } catch {
      // Keep the planner usable when browser storage is unavailable.
    }
  }, [goals])

  function selectGoal(goalId) {
    setActiveGoalId(goalId)
  }

  function createGoal(title = 'Untitled Goal', steps = []) {
    const goal = { id: createId(), title, steps }
    setGoals((current) => [...current, goal])
    setActiveGoalId(goal.id)
    return goal
  }

  function deleteGoal(goalId) {
    const remaining = goals.filter((goal) => goal.id !== goalId)
    removeOrphanedFiles(goals, remaining)
    setGoals(remaining)
    if (activeGoal?.id === goalId) setActiveGoalId(remaining[0]?.id ?? null)
  }

  function duplicateGoal(goalId = activeGoal?.id) {
    const source = goals.find((goal) => goal.id === goalId)
    if (!source) return null

    const duplicate = {
      id: createId(),
      title: `${source.title || 'Untitled Goal'} (Copy)`,
      steps: source.steps.map((step) => ({
        id: createId(),
        title: step.title,
        requirements: step.requirements.map((item) => ({
          ...createRoadmapItem(item.text),
          notes: (item.notes ?? []).map((note) => ({ ...note, id: createId() })),
          attachments: [...(item.attachments ?? [])],
        })),
        tasks: step.tasks.map((item) => ({
          ...createRoadmapItem(item.text),
          notes: (item.notes ?? []).map((note) => ({ ...note, id: createId() })),
          attachments: [...(item.attachments ?? [])],
        })),
        completed: false,
      })),
    }

    setGoals((current) => [...current, duplicate])
    setActiveGoalId(duplicate.id)
    return duplicate
  }

  function updateGoal(goalId, updater) {
    setGoals((current) => current.map((goal) => goal.id === goalId ? updater(goal) : goal))
  }

  function updateGoalTitle(title) {
    if (activeGoal) updateGoal(activeGoal.id, (goal) => ({ ...goal, title }))
  }

  function updateMindMapNodePosition(nodeId, position) {
    if (!activeGoal || !nodeId || !position) return
    updateGoal(activeGoal.id, (goal) => ({
      ...goal,
      mindMapPositions: {
        ...(goal.mindMapPositions ?? {}),
        [nodeId]: { x: Math.max(0, Number(position.x) || 0), y: Math.max(0, Number(position.y) || 0) },
      },
    }))
  }

  function resetMindMapLayout() {
    if (!activeGoal) return
    updateGoal(activeGoal.id, (goal) => {
      const resetGoal = { ...goal }
      delete resetGoal.mindMapPositions
      return resetGoal
    })
  }

  function updateActiveGoal(updater) {
    if (activeGoal) updateGoal(activeGoal.id, updater)
  }

  function addStep(title = 'New step') {
    if (!activeGoal) return null
    const step = { id: createId(), title, requirements: [], tasks: [], completed: false }
    updateActiveGoal((goal) => ({ ...goal, steps: [...goal.steps, step] }))
    return step
  }

  function updateStep(stepId, updater) {
    updateActiveGoal((goal) => ({
      ...goal,
      steps: goal.steps.map((step) => step.id === stepId ? updater(step) : step),
    }))
  }

  function deleteStep(stepId) {
    if (!activeGoal) return
    const nextGoals = goals.map((goal) => goal.id === activeGoal.id
      ? { ...goal, steps: goal.steps.filter((step) => step.id !== stepId) }
      : goal)
    removeOrphanedFiles(goals, nextGoals)
    setGoals(nextGoals)
  }

  function addChecklistItem(stepId, section, text) {
    updateStep(stepId, (step) => ({ ...step, [section]: [...step[section], createRoadmapItem(text)] }))
  }

  function deleteChecklistItem(stepId, section, itemId) {
    if (!activeGoal) return
    const nextGoals = goals.map((goal) => goal.id === activeGoal.id ? {
      ...goal,
      steps: goal.steps.map((step) => step.id === stepId
        ? { ...step, [section]: step[section].filter((item) => item.id !== itemId) }
        : step),
    } : goal)
    removeOrphanedFiles(goals, nextGoals)
    setGoals(nextGoals)
  }

  function updateResourceItem(stepId, type, itemId, updater) {
    const section = resourceSection(type)
    updateStep(stepId, (step) => ({
      ...step,
      [section]: (step[section] ?? []).map((item) => item.id === itemId ? updater(item) : item),
    }))
  }

  function addNote(stepId, type, itemId, text) {
    const now = new Date().toISOString()
    const note = { id: createId(), text, createdAt: now, updatedAt: now }
    updateResourceItem(stepId, type, itemId, (item) => ({ ...item, notes: [...(item.notes ?? []), note] }))
    return note
  }

  function updateNote(stepId, type, itemId, noteId, text) {
    updateResourceItem(stepId, type, itemId, (item) => ({
      ...item,
      notes: (item.notes ?? []).map((note) => note.id === noteId ? { ...note, text, updatedAt: new Date().toISOString() } : note),
    }))
  }

  function deleteNote(stepId, type, itemId, noteId) {
    updateResourceItem(stepId, type, itemId, (item) => ({ ...item, notes: (item.notes ?? []).filter((note) => note.id !== noteId) }))
  }

  function addAttachment(stepId, type, itemId, attachment) {
    updateResourceItem(stepId, type, itemId, (item) => ({ ...item, attachments: [...(item.attachments ?? []), attachment] }))
  }

  function deleteAttachment(stepId, type, itemId, attachmentId) {
    if (!activeGoal) return
    const section = resourceSection(type)
    const nextGoals = goals.map((goal) => goal.id === activeGoal.id ? {
      ...goal,
      steps: goal.steps.map((step) => step.id === stepId ? {
        ...step,
        [section]: (step[section] ?? []).map((item) => item.id === itemId
          ? { ...item, attachments: (item.attachments ?? []).filter((attachment) => attachment.id !== attachmentId) }
          : item),
      } : step),
    } : goal)
    removeOrphanedFiles(goals, nextGoals)
    setGoals(nextGoals)
  }

  const addRequirementNote = (stepId, itemId, text) => addNote(stepId, 'requirement', itemId, text)
  const updateRequirementNote = (stepId, itemId, noteId, text) => updateNote(stepId, 'requirement', itemId, noteId, text)
  const deleteRequirementNote = (stepId, itemId, noteId) => deleteNote(stepId, 'requirement', itemId, noteId)
  const addRequirementAttachment = (stepId, itemId, attachment) => addAttachment(stepId, 'requirement', itemId, attachment)
  const deleteRequirementAttachment = (stepId, itemId, attachmentId) => deleteAttachment(stepId, 'requirement', itemId, attachmentId)

  function toggleChecklistItem(stepId, section, itemId) {
    updateStep(stepId, (step) => ({
      ...step,
      [section]: step[section].map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item),
    }))
  }

  function completeStep(stepId) {
    if (!activeGoal) return false
    const activeIndex = activeGoal.steps.findIndex((step) => !step.completed)
    const stepIndex = activeGoal.steps.findIndex((step) => step.id === stepId)
    if (stepIndex !== activeIndex || stepIndex < 0) return false

    const step = activeGoal.steps[stepIndex]
    const items = [...step.requirements, ...step.tasks]
    if (items.some((item) => !item.checked)) return false

    updateStep(stepId, (current) => ({ ...current, completed: true }))
    return true
  }

  function exportBackup() {
    const backup = {
      format: 'waypoint-roadmap-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      goals,
    }

    try {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `waypoint-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    } catch {
      return { success: false, error: 'The backup could not be downloaded in this browser.' }
    }
  }

  function importBackup(jsonData) {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const incomingGoals = Array.isArray(parsed) ? parsed : parsed?.goals
      if (!Array.isArray(incomingGoals)) {
        return { success: false, error: 'This file does not contain a roadmap backup.' }
      }

      const restoredGoals = incomingGoals.map((goal) => {
        if (!goal || typeof goal !== 'object' || !Array.isArray(goal.steps)) {
          throw new Error('A goal in this backup has an invalid structure.')
        }

        return {
          id: createId(),
          title: typeof goal.title === 'string' && goal.title.trim() ? goal.title : 'Untitled Goal',
          mindMapPositions: goal.mindMapPositions && typeof goal.mindMapPositions === 'object' ? goal.mindMapPositions : undefined,
          steps: goal.steps.map((step) => {
            if (!step || typeof step !== 'object') {
              throw new Error('A step in this backup has an invalid structure.')
            }

            const restoreItems = (items) => {
              if (items === undefined) return []
              if (!Array.isArray(items)) throw new Error('A checklist in this backup has an invalid structure.')
              return items.map((item) => {
                const text = typeof item === 'string' ? item : item?.text
                if (typeof text !== 'string') throw new Error('A checklist item in this backup has no text.')
                const record = typeof item === 'object' && item !== null ? item : {}
                const notes = Array.isArray(record.notes) ? record.notes.filter((note) => note && typeof note.text === 'string').map((note) => ({
                  id: typeof note.id === 'string' ? note.id : createId(),
                  text: note.text,
                  createdAt: note.createdAt ?? new Date().toISOString(),
                  updatedAt: note.updatedAt ?? note.createdAt ?? new Date().toISOString(),
                })) : []
                const attachments = Array.isArray(record.attachments) ? record.attachments.filter((attachment) => attachment && typeof attachment === 'object').map((attachment) => ({
                  id: typeof attachment.id === 'string' ? attachment.id : createId(),
                  fileName: typeof attachment.fileName === 'string' ? attachment.fileName : 'Attachment',
                  fileType: typeof attachment.fileType === 'string' ? attachment.fileType : 'application/octet-stream',
                  fileSize: Number(attachment.fileSize) || 0,
                  createdAt: attachment.createdAt ?? new Date().toISOString(),
                })) : []
                return { ...createRoadmapItem(text), checked: Boolean(record.checked), notes, attachments }
              })
            }

            return {
              id: createId(),
              title: typeof step.title === 'string' && step.title.trim() ? step.title : 'Untitled Step',
              requirements: restoreItems(step.requirements),
              tasks: restoreItems(step.tasks),
              completed: Boolean(step.completed),
            }
          }),
        }
      })

      removeOrphanedFiles(goals, restoredGoals)
      setGoals(restoredGoals)
      setActiveGoalId(restoredGoals[0]?.id ?? null)
      return { success: true, count: restoredGoals.length }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'The backup file could not be read.' }
    }
  }

  return {
    goals,
    activeGoal,
    activeGoalId: activeGoal?.id ?? null,
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
    addRequirementNote,
    updateRequirementNote,
    deleteRequirementNote,
    addRequirementAttachment,
    deleteRequirementAttachment,
    exportBackup,
    importBackup,
  }
}
