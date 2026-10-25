// Light/dark theme, persisted in localStorage (light by default — better on projectors).
// index.html applies the saved class before first paint.

function saved() {
  try {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  } catch (_) {
    return 'light'
  }
}

export const theme = $state({ mode: saved() })

export function toggleTheme() {
  theme.mode = theme.mode === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.toggle('dark', theme.mode === 'dark')
  try {
    localStorage.setItem('theme', theme.mode)
  } catch (_) {}
}
