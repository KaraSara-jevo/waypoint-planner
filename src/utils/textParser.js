function createParsedItem(text, id) {
  return { id, text, checked: false }
}

/** Parse a plain-text roadmap into the app's roadmap shape without mutating input. */
export function parseRoadmapText(rawText) {
  const roadmap = {
    id: 'imported-roadmap',
    title: 'Imported Roadmap',
    steps: [],
  }

  if (typeof rawText !== 'string') return roadmap

  const lines = rawText.split(/\r?\n/)
  for (const rawLine of lines) {
    let line = rawLine.trim()
    if (!line || /^```/.test(line)) continue

    line = line.replace(/^#+\s*/, '').replace(/^(?:[-*•]\s*)+/, '').trim()
    if (!line) continue

    const goalMatch = line.match(/^goal\s*:\s*(.*)$/i)
    if (goalMatch) {
      if (goalMatch[1].trim()) roadmap.title = goalMatch[1].trim()
      continue
    }

    const stepMatch = line.match(/^step\s*(?:#?\d+)?\s*[:.)\-–—]\s*(.+)$/i)
      ?? line.match(/^step\s+#?\d+\s+(.+)$/i)
      ?? line.match(/^step\s*:\s*(.+)$/i)
    if (stepMatch?.[1]?.trim()) {
      const index = roadmap.steps.length + 1
      roadmap.steps.push({
        id: `imported-step-${index}`,
        title: stepMatch[1].trim(),
        requirements: [],
        tasks: [],
        completed: false,
      })
      continue
    }

    const requirementMatch = line.match(/^req(?:s|uirements?)?\s*:\s*(.+)$/i)
    if (requirementMatch?.[1]?.trim() && roadmap.steps.length) {
      const step = roadmap.steps[roadmap.steps.length - 1]
      step.requirements.push(createParsedItem(requirementMatch[1].trim(), `imported-req-${roadmap.steps.length}-${step.requirements.length + 1}`))
      continue
    }

    const taskMatch = line.match(/^(?:sub[- ]?step|tasks?)\s*:\s*(.+)$/i)
    if (taskMatch?.[1]?.trim() && roadmap.steps.length) {
      const step = roadmap.steps[roadmap.steps.length - 1]
      step.tasks.push(createParsedItem(taskMatch[1].trim(), `imported-task-${roadmap.steps.length}-${step.tasks.length + 1}`))
    }
  }

  return roadmap
}
