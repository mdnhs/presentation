// Keyboard shortcuts for the search boxes: ⌘K / Ctrl+K jumps to the top bar search, "/" to the
// page's own search (falling back to the top bar), Esc leaves either one.
// Search inputs opt in with data-search="global" (TopNav) or data-search="page".

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const MOD_KEY = isMac ? '⌘K' : 'Ctrl K'

const visible = (el) => el && el.offsetParent !== null

function typing(el) {
  return el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? '')
}

function focus(...selectors) {
  for (const sel of selectors) {
    const el = [...document.querySelectorAll(sel)].find(visible)
    if (el) {
      el.focus()
      el.select()
      return true
    }
  }
  return false
}

export function onSearchKey(e) {
  if (e.key === 'Escape' && e.target?.matches?.('[data-search]')) {
    e.target.blur()
    return
  }
  // A dialog or sheet is open: leave its keys alone.
  if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    if (focus('[data-search="global"]', '[data-search="page"]')) e.preventDefault()
  } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target)) {
    if (focus('[data-search="page"]', '[data-search="global"]')) e.preventDefault()
  }
}
