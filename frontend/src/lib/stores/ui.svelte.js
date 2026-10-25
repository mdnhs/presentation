// UI mode flags.
//  presenting: presentation mode (no nav, no edit controls, 16:9 layout)
//  creating:   the "New project" panel opened from the sidebar
//  readonly:   share view or presentation — hide every edit/export control
//  collapsed:  sidebar shown as an icon-only rail (persisted in localStorage)
//  navOpen:    the mobile sidebar sheet (under lg) is open
function savedCollapsed() {
  try {
    return localStorage.getItem('sidebar') === 'collapsed'
  } catch (_) {
    return false
  }
}

export const ui = $state({
  presenting: false,
  share: false,
  creating: false,
  collapsed: savedCollapsed(),
  navOpen: false,
  get readonly() {
    return this.presenting || this.share
  },
})

export function toggleSidebar() {
  ui.collapsed = !ui.collapsed
  try {
    localStorage.setItem('sidebar', ui.collapsed ? 'collapsed' : 'expanded')
  } catch (_) {}
}
