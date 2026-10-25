<script>
  // Square tile with a project's initials, tinted in its tag (or status) colour.
  import { alpha } from '../utils.js'
  import { data } from '../stores/data.svelte.js'

  let { project, size = 40 } = $props()

  const color = $derived(project.color || data.statusById[project.status]?.color || '#94A3B8')
  const initials = $derived(
    (project.name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(''),
  )
</script>

<span
  class="grid shrink-0 place-items-center rounded-xl font-semibold"
  style="width: {size}px; height: {size}px; font-size: {Math.round(size * 0.36)}px; background: linear-gradient(135deg, {alpha(color, 0.22)}, {alpha(color, 0.1)}); color: {color}"
  aria-hidden="true">{initials}</span
>
