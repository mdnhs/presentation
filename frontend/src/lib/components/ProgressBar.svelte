<script>
  let { value = 0, color = 'var(--color-ink)', showLabel = true } = $props()

  const pct = $derived(Math.min(100, Math.max(0, value || 0)))
</script>

<div class="flex items-center gap-2.5">
  <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-3">
    <div class="h-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none" style="transform: scaleX({pct / 100}); background: {color}"></div>
  </div>
  {#if showLabel}
    <span class="fig w-9 text-right text-xs text-muted-foreground">{value || 0}%</span>
  {/if}
</div>
