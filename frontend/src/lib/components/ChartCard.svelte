<script>
  import Exportable from './Exportable.svelte'

  let { title, subtitle = '', class: cls = '', actions, children } = $props()

  const filename = $derived(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
</script>

<Exportable {filename} class="flex flex-col p-5 {cls}">
  <div class="mb-4 flex items-start justify-between gap-3 pr-10">
    <div class="min-w-0">
      <h2 class="text-sm font-semibold text-ink">{title}</h2>
      {#if subtitle}<p class="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>{/if}
    </div>
    {#if actions}<div class="no-export">{@render actions()}</div>{/if}
  </div>
  <div class="min-h-0 flex-1">
    {@render children()}
  </div>
</Exportable>
