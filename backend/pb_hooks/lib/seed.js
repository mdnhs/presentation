/// <reference path="../../pb_data/types.d.ts" />

// Demo data: 13 projects across 4 clients + backdated activity_log history.
// Dates are relative to "today" so the charts always look current.

const DAY = 24 * 60 * 60 * 1000

// [name, client, stage, progress, priority, startOffsetDays, dueOffsetDays, completedWeeksAgo]
// stage: 0 = first status (To-Do) ... "done" = the is_done status
const PROJECTS = [
  ["Website Redesign", "Northwind Logistics", "done", 100, "high", -80, -20, 4],
  ["Fleet Tracking App", "Northwind Logistics", 1, 55, "high", -40, 25],
  ["Driver Onboarding Portal", "Northwind Logistics", 0, 0, "medium", 5, 60],
  ["Patient Portal v2", "Acme Health", 2, 90, "high", -60, 3],
  ["HIPAA Compliance Audit", "Acme Health", "done", 100, "medium", -70, -35, 7],
  ["Telehealth Integration", "Acme Health", 1, 35, "high", -25, -2],
  ["Mobile Banking Refresh", "Blue Harbor Bank", 1, 70, "high", -50, 14],
  ["Fraud Analytics Dashboard", "Blue Harbor Bank", "done", 100, "medium", -75, -10, 2],
  ["Data Warehouse Migration", "Blue Harbor Bank", "done", 100, "low", -110, -65, 10],
  ["Branch Locator API", "Blue Harbor Bank", 0, 0, "low", 10, 45],
  ["E-commerce Replatform", "Lumen Retail", 2, 85, "high", -90, -5],
  ["Loyalty Program Launch", "Lumen Retail", "done", 100, "medium", -55, -8, 1],
  ["Inventory Forecasting", "Lumen Retail", 1, 20, "medium", -15, 50],
]

function iso(ms) {
  return new Date(ms).toISOString()
}

function wipe(app) {
  // activity_log first (it references projects).
  app.truncateCollection(app.findCollectionByNameOrId("activity_log"))
  app.truncateCollection(app.findCollectionByNameOrId("projects"))
}

function seed(app) {
  const statuses = app.findRecordsByFilter("statuses", "", "order", 0, 0)
  const notDone = statuses.filter((s) => !s.getBool("is_done"))
  const done = statuses.find((s) => s.getBool("is_done"))
  if (!notDone.length || !done) {
    throw new Error("Need at least one regular status and one status marked is_done.")
  }
  // Workflow path a project walks through: regular statuses in order, then done.
  const path = [...notDone, done]

  const projectsCol = app.findCollectionByNameOrId("projects")
  const activityCol = app.findCollectionByNameOrId("activity_log")
  const now = Date.now()
  const orderPerStatus = {}
  const created = []

  // Pass 1: projects. Saving fires the activity hook ("now" entries), which
  // pass 2 replaces with a realistic backdated history.
  for (const [name, client, stage, progress, priority, startOff, dueOff] of PROJECTS) {
    const target = stage === "done" ? path.length - 1 : Math.min(stage, notDone.length - 1)
    const status = path[target]

    const p = new Record(projectsCol)
    p.load({
      name,
      client,
      description: `<p>${name} for ${client}.</p>`,
      status: status.id,
      progress,
      priority,
      start_date: iso(now + startOff * DAY),
      due_date: iso(now + dueOff * DAY),
      order: (orderPerStatus[status.id] = (orderPerStatus[status.id] ?? -1) + 1),
    })
    app.save(p)
    created.push(p)
  }

  app.truncateCollection(activityCol)

  // Pass 2: backdated history.
  PROJECTS.forEach(([name, , stage, progress, , startOff, , doneWeeksAgo], idx) => {
    const p = created[idx]
    const target = stage === "done" ? path.length - 1 : Math.min(stage, notDone.length - 1)

    // History window: from project start (or a few days ago, if starting in the
    // future) up to completion (done) or ~1-3 days ago (still active).
    const end = stage === "done"
      ? now - doneWeeksAgo * 7 * DAY + (name.length % 3) * DAY
      : now - (1 + (name.length % 3)) * DAY
    const t0 = Math.min(now + startOff * DAY, end - DAY)

    const add = (from, to, prog, at) => {
      const r = new Record(activityCol)
      r.load({
        project: p.id,
        from_status: from ? from.id : "",
        to_status: to.id,
        progress: prog,
        completed: from !== to && to.getBool("is_done"),
        at: iso(at),
      })
      app.save(r)
    }

    for (let i = 0; i <= target; i++) {
      const at = target === 0 ? t0 : t0 + ((end - t0) * i) / target
      const prog = i === target ? progress : Math.round((progress * i) / Math.max(target, 1))
      add(i ? path[i - 1] : null, path[i], prog, at)
      // A progress-only update halfway through each working stage.
      if (i >= 1 && i < target) {
        const next = t0 + ((end - t0) * (i + 1)) / target
        const nextProg = Math.round((progress * (i + 1)) / target)
        add(path[i], path[i], Math.round((prog + nextProg) / 2), (at + next) / 2)
      }
    }
  })

  return PROJECTS.length
}

module.exports = { seed, wipe }
