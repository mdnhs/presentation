// Roles and what each may do. Mirrors the server rules in backend/pb_migrations/1761500000_rbac.js
// (and the clients rules); keep the two in step when a permission changes.

export const ROLE_INFO = {
  admin: { label: 'Admin', about: 'Full access, including settings, statuses and the team.', tone: 'bg-mint text-brand-2' },
  editor: { label: 'Editor', about: 'Creates, edits and moves projects and clients. Cannot delete or change settings.', tone: 'bg-[oklch(95%_0.03_250)] text-[oklch(45%_0.09_250)]' },
  viewer: { label: 'Viewer', about: 'Read only: sees every project, chart and client.', tone: 'bg-paper-3 text-ink-2' },
}

/** [what, admin, editor, viewer] */
export const PERMISSIONS = [
  ['View projects, board, charts and clients', true, true, true],
  ['Create and edit projects', true, true, false],
  ['Move cards on the board', true, true, false],
  ['Create and edit clients', true, true, false],
  ['Delete projects and clients', true, false, false],
  ['Workflow statuses', true, false, false],
  ['Branding and the client share link', true, false, false],
  ['Manage the team', true, false, false],
  ['Give clients portal access (a viewer that sees only its own projects)', true, true, false],
]

/** A readable random password: 14 characters, no look-alikes (0/O, 1/l/I). */
export function generatePassword(length = 14) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.getRandomValues(new Uint32Array(length)), (n) => chars[n % chars.length]).join('')
}
