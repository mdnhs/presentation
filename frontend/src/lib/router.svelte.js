// Minimal hash router: #/board, #/share?token=abc, ...

function parse() {
  const [path, qs = ''] = location.hash.replace(/^#/, '').split('?')
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) }
}

export const route = $state(parse())

window.addEventListener('hashchange', () => Object.assign(route, parse()))

export function navigate(path) {
  location.hash = path
}
