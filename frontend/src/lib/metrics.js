// Pure functions that turn store data into KPI numbers and chart series.
// Shared by the overview page, presentation mode and the share view.

import { isOverdue, startOfToday, toDate } from './utils.js'

const DAY = 864e5

export function kpis(projects, statuses, activity) {
  const byId = Object.fromEntries(statuses.map((s) => [s.id, s]))
  const first = [...statuses].sort((a, b) => a.order - b.order)[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  // Distinct projects that entered a "done" status this month and still exist.
  const ids = new Set(projects.map((p) => p.id))
  const completedThisMonth = new Set(
    activity.filter((a) => a.completed && toDate(a.at) >= monthStart && ids.has(a.project)).map((a) => a.project),
  ).size

  const total = projects.length
  const done = projects.filter((p) => byId[p.status]?.is_done).length
  return {
    total,
    done,
    inProgress: projects.filter((p) => !byId[p.status]?.is_done && p.status !== first?.id).length,
    completedThisMonth,
    overdue: projects.filter((p) => isOverdue(p, byId)).length,
    avgProgress: total ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / total) : 0,
    completionPct: total ? Math.round((done / total) * 100) : 0,
  }
}

/** Donut: one slice per status (in workflow order). */
export function byStatus(projects, sortedStatuses) {
  return sortedStatuses.map((s) => ({
    status: s,
    count: projects.filter((p) => p.status === s.id).length,
  }))
}

/** Monday 00:00 of the week containing `d`. */
function weekStart(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

/** Completions per week for the last `weeks` weeks (current week last), plus a running total. */
export function completionTrend(activity, weeks = 12) {
  const thisWeek = weekStart(startOfToday())
  const buckets = Array.from({ length: weeks }, (_, i) => new Date(thisWeek.getTime() - (weeks - 1 - i) * 7 * DAY))
  const counts = buckets.map(() => 0)
  for (const a of activity) {
    if (!a.completed) continue
    const t = toDate(a.at)
    const i = buckets.findIndex((b, idx) => t >= b && (idx === weeks - 1 || t < buckets[idx + 1]))
    if (i >= 0) counts[i]++
  }
  let run = 0
  return {
    weeks: buckets.map((b) => b.getTime()),
    perWeek: counts,
    cumulative: counts.map((c) => (run += c)),
  }
}
