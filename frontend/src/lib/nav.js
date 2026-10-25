// Main destinations, shared by the sidebar and the top bar.
// `admin`: admins only. `staff`: hidden from client logins (they see only their own client).
export const NAV = [
  { path: '/', label: 'Overview', icon: 'overview' },
  { path: '/board', label: 'Board', icon: 'board' },
  { path: '/list', label: 'Projects', icon: 'list' },
  { path: '/clients', label: 'Clients', icon: 'building', staff: true },
  { path: '/support', label: 'Support', icon: 'support' },
  { path: '/team', label: 'Team', icon: 'users', admin: true },
  { path: '/settings', label: 'Settings', icon: 'settings', admin: true },
]

/** Whether the signed-in user may see a nav entry. */
export const allowed = (n, can) => (!n.admin || can.admin) && (!n.staff || !can.client)
