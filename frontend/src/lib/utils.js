// Small helpers shared by components.

/** PocketBase date string ("2026-10-25 00:00:00.000Z") → Date | null */
export function toDate(value) {
  if (!value) return null
  const d = new Date(value.replace(' ', 'T'))
  return isNaN(d) ? null : d
}

/** PocketBase date → "YYYY-MM-DD" for <input type="date">, in local time like every other date shown. */
export function toInputDate(value) {
  const d = toDate(value)
  if (!d) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "YYYY-MM-DD" → PocketBase date string at local midnight ('' clears the field), so it reads back as the same day. */
export function fromInputDate(value) {
  if (!value) return ''
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toISOString().replace('T', ' ')
}

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDate(value, opts = { month: 'short', day: 'numeric' }) {
  const d = toDate(value)
  return d ? d.toLocaleDateString(undefined, opts) : ''
}

/** Overdue = due date before today and not in a "done" status. */
export function isOverdue(project, statusById) {
  const due = toDate(project.due_date)
  if (!due || statusById[project.status]?.is_done) return false
  return due < startOfToday()
}

/** Hex color with alpha, e.g. alpha('#3B82F6', 0.12) */
export function alpha(hex, a) {
  const n = parseInt((hex || '#94A3B8').slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/** Editor field may contain HTML (e.g. seed data); show it as plain text. */
export function plainText(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

export const PRIORITIES = ['low', 'medium', 'high']

export function randomToken(len = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')
}
