<script>
  // Presentation mode: a fixed 1920×1080 stage scaled to fit the window, so a
  // full-screen screenshot pastes into a 16:9 slide pixel-perfect.
  import { onMount } from 'svelte'
  import { pb } from '../pb.js'
  import { data } from '../stores/data.svelte.js'
  import { ui } from '../stores/ui.svelte.js'
  import OverviewGrid from './OverviewGrid.svelte'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'

  const W = 1920
  const H = 1080

  let scale = $state(1)
  const fit = () => (scale = Math.min(window.innerWidth / W, window.innerHeight / H))

  const logoUrl = $derived(data.settings?.logo ? pb.files.getURL(data.settings, data.settings.logo, { thumb: '0x120' }) : '')
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  function exit() {
    ui.presenting = false
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  onMount(() => {
    fit()
    document.documentElement.requestFullscreen?.().catch(() => {})
    // Leaving browser fullscreen (Esc) also leaves presentation mode.
    const onFs = () => !document.fullscreenElement && (ui.presenting = false)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  })
</script>

<svelte:window onresize={fit} onkeydown={(e) => e.key === 'Escape' && exit()} />

<div class="fixed inset-0 z-[var(--z-modal)] overflow-hidden bg-paper">
  <div
    class="absolute top-1/2 left-1/2 flex flex-col bg-paper px-12 py-10"
    style="width: {W}px; height: {H}px; transform: translate(-50%, -50%) scale({scale})"
  >
    <header class="mb-7 flex items-center gap-5 border-b border-rule pb-6">
      {#if logoUrl}
        <img src={logoUrl} alt="" class="h-12 w-auto max-w-56 object-contain" />
      {/if}
      <div class="min-w-0">
        <h1 class="max-w-none truncate text-3xl font-semibold text-ink">
          {data.settings?.dashboard_title || 'Project Progress'}
        </h1>
        {#if data.settings?.company_name}
          <p class="mt-1 text-lg text-muted-foreground">{data.settings.company_name}</p>
        {/if}
      </div>
      <time class="ml-auto text-right text-lg font-medium text-muted-foreground">{today}</time>
    </header>

    <div class="min-h-0 flex-1">
      <OverviewGrid fill />
    </div>
  </div>

  <!-- Exit hint: invisible until hovered, so screenshots stay clean. -->
  <Button size="sm" class="fixed top-3 right-3 z-10 h-8 text-xs opacity-0 hover:opacity-100 focus-visible:opacity-100" onclick={exit}>
    <Icon name="x" size={14} /> Exit (Esc)
  </Button>
</div>

<style>
  h1 { overflow-wrap: break-word; min-width: 0; text-wrap: balance; }
</style>
