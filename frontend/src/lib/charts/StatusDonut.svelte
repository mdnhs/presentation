<script>
  // Parts of a whole: one stacked bar plus a ledger of the statuses, in workflow order.
  /** rows: [{ status, count }] in workflow order */
  let { rows, fill = false } = $props()

  const total = $derived(rows.reduce((s, r) => s + r.count, 0))
  const share = (n) => (total ? Math.round((n / total) * 100) : 0)
</script>

{#if total}
  <div class="flex flex-col {fill ? 'gap-3' : 'gap-5'}">
    <!-- Fill (the 16:9 stage) drops the total: the KPI strip above already shows it. -->
    <div class="flex items-baseline gap-2 {fill ? 'hidden' : ''}">
      <span class="fig text-[length:var(--text-figure)] leading-none font-medium text-ink">{total}</span>
      <span class="text-sm text-muted-foreground">projects across {rows.length} statuses</span>
    </div>

    <div class="flex h-2.5 gap-0.5 overflow-hidden rounded-[3px]" role="img" aria-label="Projects by status">
      {#each rows.filter((r) => r.count) as r (r.status.id)}
        <span class="h-full first:rounded-l-[3px] last:rounded-r-[3px]" style="flex: {r.count} 1 0; background: {r.status.color}"></span>
      {/each}
    </div>

    <ul class="divide-y divide-rule">
      {#each rows as r (r.status.id)}
        <li class="flex items-center gap-3 text-sm {fill ? 'py-1.5' : 'py-2'}">
          <span class="size-2.5 shrink-0 rounded-[3px]" style="background: {r.status.color}" aria-hidden="true"></span>
          <span class="min-w-0 flex-1 truncate text-ink-2">{r.status.name}</span>
          <span class="fig w-8 text-right text-ink">{r.count}</span>
          <span class="fig w-11 text-right text-muted-foreground">{share(r.count)}%</span>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <div class="grid h-60 place-items-center text-sm text-muted-foreground">No projects yet</div>
{/if}
