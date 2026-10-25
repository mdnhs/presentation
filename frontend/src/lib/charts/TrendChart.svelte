<script>
  import { apex, token } from './apex.js'
  import { theme } from '../stores/theme.svelte.js'

  /** trend: { weeks: ms[], perWeek: number[], cumulative: number[] }, mode: 'cumulative' | 'weekly' */
  let { trend, mode = 'cumulative', color } = $props()

  const dark = $derived(theme.mode === 'dark')
  const weekly = $derived(mode === 'weekly')
  const values = $derived(weekly ? trend.perWeek : trend.cumulative)
  const fmt = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const options = $derived.by(() => {
    void dark // re-read the tokens when the theme flips
    return {
    chart: { type: weekly ? 'bar' : 'area', height: '100%' },
    series: [{ name: weekly ? 'Completed that week' : 'Completed (running total)', data: values }],
    colors: [color],
    xaxis: {
      categories: trend.weeks.map(fmt),
      tickAmount: 6,
      labels: { rotate: 0, hideOverlappingLabels: true },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    // Floor of 3 keeps sparse weeks from rendering as full-height bars.
    yaxis: { min: 0, max: (m) => Math.max(3, Math.ceil(m)), tickAmount: 3, labels: { formatter: (v) => (Number.isInteger(v) ? v : '') } },
    stroke: weekly ? { width: 0 } : { width: 2, curve: 'monotoneCubic' },
    fill: weekly
      ? { type: 'solid', opacity: 1 }
      : { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: dark ? 0.16 : 0.28, opacityTo: 0, stops: [0, 95] } },
    plotOptions: { bar: { columnWidth: '52%', borderRadius: 2, borderRadiusApplication: 'end' } },
    markers: { size: 0, strokeWidth: 2, strokeColors: token('--color-cotton'), hover: { size: 6 } },
    tooltip: { x: { formatter: (_, { dataPointIndex }) => `Week of ${fmt(trend.weeks[dataPointIndex])}` } },
    }
  })
</script>

<!-- Fills the card so it matches the timeline card next to it. -->
<div class="h-full min-h-[280px]" use:apex={{ options, dark }}></div>
