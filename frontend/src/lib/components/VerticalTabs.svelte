<script>
  // Section tabs: a vertical list on the left from md up, a scrolling row on phones.
  // The caller renders the active panel in `children`, wrapped in a tabpanel with matching ids.
  import Icon from './Icon.svelte'

  /** tabs: { id, label, icon }[]; value: the active tab id; id: prefix for tab/panel ids */
  let { tabs, value = $bindable(), id, label, children } = $props()

  // Arrow keys move between tabs (Up/Down on the vertical list, Left/Right on the phone row).
  function onkeydown(e) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const i = (tabs.findIndex((t) => t.id === value) + step + tabs.length) % tabs.length
    value = tabs[i].id
    document.getElementById(`${id}-tab-${value}`)?.focus()
  }
</script>

<div class="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
  <div role="tablist" aria-orientation="vertical" aria-label={label} tabindex="-1" {onkeydown}
    class="flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col md:self-start">
    {#each tabs as t (t.id)}
      <button
        type="button"
        role="tab"
        id="{id}-tab-{t.id}"
        aria-selected={value === t.id}
        aria-controls="{id}-panel-{t.id}"
        tabindex={value === t.id ? 0 : -1}
        onclick={() => (value = t.id)}
        class="flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150
          hover:bg-paper-3 hover:text-ink aria-selected:bg-mint aria-selected:text-brand-2"
      >
        <Icon name={t.icon} size={16} />
        {t.label}
      </button>
    {/each}
  </div>

  <div role="tabpanel" id="{id}-panel-{value}" aria-labelledby="{id}-tab-{value}" class="min-w-0">
    {@render children?.()}
  </div>
</div>
