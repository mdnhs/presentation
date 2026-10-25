<script>
  // WorkHub's attendance row, for deliveries: one circle per day of the current month.
  // Green check: a project was completed that day. Orange: something is due. Red: due and missed.
  // Click a day with something on it to list its projects below the strip.
  import { slide } from 'svelte/transition'
  import { data } from '../stores/data.svelte.js'
  import { ui } from '../stores/ui.svelte.js'
  import { isOverdue, startOfToday, toDate } from '../utils.js'
  import Icon from './Icon.svelte'
  import ProjectAvatar from './ProjectAvatar.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import StatusBadge from './StatusBadge.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'

  /** onopen(project): open a project from the day details (omitted in read-only views) */
  let { onopen = null } = $props()

  const today = startOfToday()
  const year = today.getFullYear()
  const month = today.getMonth()
  const count = new Date(year, month + 1, 0).getDate()
  const key = (d) => (d && d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null)

  const days = $derived.by(() => {
    const out = Array.from({ length: count }, (_, i) => ({ day: i + 1, done: [], due: [], missed: [] }))
    const byId = Object.fromEntries(data.projects.map((p) => [p.id, p]))
    for (const a of data.activity) {
      const k = a.completed && key(toDate(a.at))
      const p = k && byId[a.project]
      if (p && !out[k - 1].done.includes(p)) out[k - 1].done.push(p)
    }
    for (const p of data.projects) {
      const k = key(toDate(p.due_date))
      if (!k || data.statusById[p.status]?.is_done) continue
      ;(isOverdue(p, data.statusById) ? out[k - 1].missed : out[k - 1].due).push(p)
    }
    return out
  })

  const todayN = today.getDate()
  const total = (d) => d.done.length + d.due.length + d.missed.length
  const names = (list) => list.map((p) => p.name).join(', ')
  const title = (d) =>
    [d.done.length && `Completed: ${names(d.done)}`, d.due.length && `Due: ${names(d.due)}`, d.missed.length && `Missed: ${names(d.missed)}`]
      .filter(Boolean)
      .join('\n') || 'Nothing that day'

  let selected = $state(null) // day number
  const picked = $derived(selected ? days[selected - 1] : null)
  const toggle = (d) => (selected = selected === d.day ? null : d.day)

  const dayLabel = (n) => new Date(year, month, n).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const GROUPS = [
    ['missed', 'Missed deadline', 'bg-error/15 text-error'],
    ['due', 'Due', 'bg-warn/25 text-ink-2'],
    ['done', 'Completed', 'bg-mint text-brand-2'],
  ]
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (selected = null)} />

<ul class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
  <li class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-brand"></span>Completed</li>
  <li class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-warn/60"></span>Due</li>
  <li class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-error/50"></span>Missed</li>
  <li class="flex items-center gap-1.5"><span class="size-2.5 rounded-full border-2 border-brand"></span>Today</li>
  {#if !ui.presenting}<li class="ml-auto hidden sm:block">Click a marked day for its projects</li>{/if}
</ul>

<div class="overflow-x-auto pb-1">
  <div class="grid min-w-[640px] gap-y-2" style="grid-template-columns: repeat({count}, minmax(0, 1fr))">
    {#each days as d (d.day)}
      <span class="text-center text-[11px] font-medium {d.day === todayN || d.day === selected ? 'text-brand-2' : 'text-muted-foreground'}">{String(d.day).padStart(2, '0')}</span>
    {/each}
    {#each days as d (d.day)}
      {@const n = total(d)}
      <span class="grid place-items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          class="grid size-7 place-items-center rounded-full p-0 transition-[box-shadow,transform] duration-150 hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 disabled:opacity-100
            {n ? 'cursor-pointer hover:scale-110 motion-reduce:hover:scale-100' : 'cursor-default'}
            {selected === d.day ? 'ring-2 ring-brand ring-offset-2 ring-offset-cotton' : ''}"
          onclick={() => n && toggle(d)}
          disabled={!n}
          aria-pressed={n ? selected === d.day : undefined}
          aria-label="{dayLabel(d.day)}: {n ? title(d).replaceAll('\n', '. ') : 'nothing'}"
          title={title(d)}
        >
          {#if d.missed.length}
            <span class="grid size-6 place-items-center rounded-full bg-error/15 text-[11px] font-semibold text-error">!</span>
          {:else if d.done.length}
            <span class="grid size-6 place-items-center rounded-full bg-brand/85 text-brand-ink">
              {#if n > 1}<span class="fig text-[11px] font-semibold">{n}</span>{:else}<Icon name="check" size={13} strokeWidth={2.5} />{/if}
            </span>
          {:else if d.due.length}
            <span class="fig grid size-6 place-items-center rounded-full bg-warn/25 text-[11px] font-semibold text-ink-2">{d.due.length > 1 ? d.due.length : 'D'}</span>
          {:else}
            <span class="size-6 rounded-full border-2 {d.day === todayN ? 'border-brand' : d.day > todayN ? 'border-rule' : 'border-rule-2 bg-paper-2'}"></span>
          {/if}
        </Button>
      </span>
    {/each}
  </div>
</div>

{#if picked}
  <div class="mt-4 rounded-xl bg-paper-2 p-4" transition:slide={{ duration: 180 }}>
    <div class="mb-3 flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-ink">{dayLabel(picked.day)}</p>
      <Button variant="ghost" size="icon-sm" class="size-7 rounded-full text-muted-foreground hover:bg-paper-3 hover:text-ink" onclick={() => (selected = null)} aria-label="Close day details">
        <Icon name="x" size={14} />
      </Button>
    </div>
    <ul class="flex flex-col gap-2">
      {#each GROUPS as [kind, label, tone] (kind)}
        {#each picked[kind] as p (p.id)}
          <li>
            <Button
              variant="ghost"
              class="flex h-auto w-full items-center justify-start gap-3 rounded-lg bg-cotton p-2.5 text-left font-normal whitespace-normal shadow-card transition-shadow duration-150 hover:bg-cotton active:not-aria-[haspopup]:translate-y-0
                {onopen ? 'hover:shadow-lift' : 'pointer-events-none'}"
              onclick={() => onopen?.(p)}
              tabindex={onopen ? 0 : -1}
            >
              <ProjectAvatar project={p} size={36} />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink">{p.name}</p>
                <p class="truncate text-xs text-muted-foreground">{p.client || 'No client'}</p>
              </div>
              <Badge variant="secondary" class="hidden h-6 shrink-0 rounded-md px-2 sm:inline-flex {tone}">{label}</Badge>
              <span class="hidden shrink-0 md:block"><StatusBadge status={data.statusById[p.status]} /></span>
              <span class="hidden w-32 shrink-0 lg:block"><ProgressBar value={p.progress} color={data.statusById[p.status]?.color} /></span>
              {#if onopen}<Icon name="chevron" size={16} class="shrink-0 text-muted-foreground" />{/if}
            </Button>
          </li>
        {/each}
      {/each}
    </ul>
  </div>
{/if}
