<script>
  // 2x2 stat tiles: an icon in a mint square, the label, the figure and a one-line qualifier.
  import Icon from './Icon.svelte'

  /** stats: [{ label, value, hint, icon, tone: 'up' | 'warn' | 'muted' }] */
  let { stats } = $props()

  const HINT = { up: 'text-brand-2', warn: 'text-error', muted: 'text-muted-foreground' }
</script>

<div class="grid grid-cols-2 gap-3">
  {#each stats as s (s.label)}
    <div class="rounded-xl bg-paper-2 p-4">
      <span class="grid size-9 place-items-center rounded-lg bg-mint text-brand-2"><Icon name={s.icon} size={17} /></span>
      <p class="mt-3 truncate text-xs font-medium text-muted-foreground">{s.label}</p>
      <p class="fig mt-0.5 text-[length:var(--text-figure)] leading-tight font-semibold {s.tone === 'warn' ? 'text-error' : 'text-ink'}">{s.value}</p>
      {#if s.hint}
        <p class="mt-1 flex items-center gap-1 truncate text-xs font-medium {HINT[s.tone] ?? 'text-muted-foreground'}">
          {#if s.tone === 'up'}<Icon name="arrowUp" size={12} />{/if}
          {s.hint}
        </p>
      {/if}
    </div>
  {/each}
</div>
