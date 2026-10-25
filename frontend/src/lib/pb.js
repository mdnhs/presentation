import PocketBase from 'pocketbase'

// Same origin in both dev (Vite proxy) and prod (served by PocketBase).
export const pb = new PocketBase('/')
pb.autoCancellation(false)

// Read-only share view: every request carries ?token=... so the
// collection rules can verify it against settings.share_token.
let shareToken = ''
export function setShareToken(token) {
  shareToken = token || ''
}
export function getShareToken() {
  return shareToken
}

pb.beforeSend = (url, options) => {
  if (shareToken) options.query = { ...options.query, token: shareToken }
  return { url, options }
}
