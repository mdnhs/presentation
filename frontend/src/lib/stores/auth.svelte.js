import { pb } from '../pb.js'
import { ui } from './ui.svelte.js'

// Reactive view of PocketBase's auth store.
export const auth = $state({
  user: pb.authStore.record,
  isValid: pb.authStore.isValid,
})

pb.authStore.onChange(() => {
  auth.user = pb.authStore.record
  auth.isValid = pb.authStore.isValid
})

// What the signed-in user's role allows. The server enforces the same rules (pb_migrations/1761500000_rbac.js);
// these only decide what the UI shows. Read-only views (share link, presentation) never edit.
export const ROLES = ['admin', 'editor', 'viewer']
export const can = {
  get role() {
    return auth.user?.role || 'viewer'
  },
  get edit() {
    return !ui.readonly && (this.role === 'admin' || this.role === 'editor')
  },
  get admin() {
    return !ui.readonly && this.role === 'admin'
  },
  /** The client id when this is a client login (a viewer scoped to one client), else ''. */
  get client() {
    return auth.user?.client || ''
  },
}

export async function login(email, password) {
  await pb.collection('users').authWithPassword(email, password)
}

export function logout() {
  pb.authStore.clear()
}

// Refresh the token on startup so an expired session drops to the login page.
if (pb.authStore.isValid) {
  pb.collection('users').authRefresh().catch(() => pb.authStore.clear())
}
