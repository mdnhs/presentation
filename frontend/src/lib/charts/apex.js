// ApexCharts, tree-shaken to the chart types and features this app uses.
import ApexCharts from 'apexcharts/core'
import 'apexcharts/area'
import 'apexcharts/bar'
import 'apexcharts/features/legend'

/** Read a design token (tokens.css) so charts follow the theme and the light/dark switch. */
export const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Shared look: the body face, no toolbar, recessive solid grid, theme-aware ink. */
export function baseOptions(dark) {
  return {
    chart: {
      fontFamily: token('--font-body'),
      foreColor: token('--color-muted-foreground'),
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches, speed: 500 },
      parentHeightOffset: 0,
    },
    theme: { mode: dark ? 'dark' : 'light' },
    grid: {
      borderColor: token('--color-rule'),
      strokeDashArray: 0,
      padding: { left: 4, right: 8 },
    },
    dataLabels: { enabled: false },
    legend: {
      fontSize: '13px',
      fontWeight: 500,
      labels: { colors: token('--color-ink-2') },
      markers: { size: 5, shape: 'square', strokeWidth: 0 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: { theme: dark ? 'dark' : 'light', style: { fontSize: '12px' } },
    states: { active: { filter: { type: 'none' } } },
  }
}

/** Deep merge for plain option objects (arrays are replaced, not merged). */
function merge(a, b) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof a?.[k] === 'object' ? merge(a[k], v) : v
  }
  return out
}

/**
 * Svelte action: use:apex={{ options, dark }}
 * Re-renders from scratch when the theme flips (cleanest way to restyle),
 * otherwise updates in place so data changes animate.
 */
export function apex(node, params) {
  let chart
  let dark = params.dark

  const render = () => {
    chart?.destroy()
    chart = new ApexCharts(node, merge(baseOptions(dark), params.options))
    chart.render()
  }
  render()

  return {
    update(next) {
      if (next.dark !== dark) {
        dark = next.dark
        params = next
        render()
      } else {
        params = next
        chart.updateOptions(merge(baseOptions(dark), next.options), true, true)
      }
    },
    destroy() {
      chart?.destroy()
    },
  }
}
