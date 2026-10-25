<script>
  // Overview's project table (WorkHub's "Attendance History"): Active / Completed / All tabs,
  // a quick search, and rows with avatar, start date chip, timeline, progress and status.
  import { data } from '../stores/data.svelte.js'
  import { isOverdue, startOfToday, toDate } from '../utils.js'
  import Icon from './Icon.svelte'
  import ProjectAvatar from './ProjectAvatar.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import StatusBadge from './StatusBadge.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'

  /** onopen: open a row for editing (null when the role or view is read-only); limit: rows to show */
  let { onopen, limit = 6, fill = false } = $props()

  let tab = $state('active')
  let q = $state('')
  let client = $state('') // '' = all clients
  const ALL = '__all' // shadcn Select items can't have an empty value

  const DAY = 86400000
  const isDone = (p) => !!data.statusById[p.status]?.is_done

  const rows = $derived.by(() => {
    const s = q.trim().toLowerCase()
    return data.projects
      .filter((p) => (tab === 'all' ? true : tab === 'done' ? isDone(p) : !isDone(p)))
      .filter((p) => !client || p.client === client)
      .filter((p) => !s || p.name.toLowerCase().includes(s) || (p.client || '').toLowerCase().includes(s))
      .sort((a, b) => (toDate(a.due_date)?.getTime() ?? Infinity) - (toDate(b.due_date)?.getTime() ?? Infinity))
  })

  const weekday = (v) => toDate(v)?.toLocaleDateString(undefined, { weekday: 'short' }) ?? ''
  const short = (v) => toDate(v)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) ?? ''
  const range = (p) => [p.start_date, p.due_date].map((v) => toDate(v)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).filter(Boolean).join(' to ')

  function left(p) {
    const due = toDate(p.due_date)
    if (!due) return 'No due date'
    if (isDone(p)) return 'Delivered'
    const n = Math.round((due - startOfToday()) / DAY)
    if (n < 0) return `${-n} day${n === -1 ? '' : 's'} overdue`
    if (n === 0) return 'Due today'
    return `${n} day${n === 1 ? '' : 's'} left`
  }

  const TABS = [['active', 'Active'], ['done', 'Completed'], ['all', 'All']]
</script>

<div class="flex flex-wrap items-center gap-2 {fill ? 'hidden' : ''}">
  <ToggleGroup.Root type="single" spacing={1} value={tab} onValueChange={(v) => v && (tab = v)} class="rounded-input bg-cotton p-1 shadow-groove" aria-label="Show">
    {#each TABS as [value, label] (value)}
      <ToggleGroup.Item
        {value}
        class="h-7 flex-1 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-ink data-[state=on]:bg-mint data-[state=on]:text-brand-2"
      >{label}</ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
  {#if data.clients.length}
    <Select.Root type="single" value={client || ALL} onValueChange={(v) => (client = v === ALL ? '' : v)}>
      <Select.Trigger class="ml-auto h-9 rounded-full bg-paper-2" aria-label="Filter by client">{client || 'All clients'}</Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label="All clients" />
        {#each data.clients as c (c)}<Select.Item value={c} label={c} />{/each}
      </Select.Content>
    </Select.Root>
  {/if}
  <div class="relative w-full sm:w-60 {data.clients.length ? '' : 'ml-auto'}">
    <Icon name="search" size={15} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
    <Input class="peer h-9 rounded-full bg-paper-2 pl-9 sm:pr-9" type="search" placeholder="Search projects…" aria-label="Search projects" aria-keyshortcuts="/" data-search="page" bind:value={q} />
    <kbd class="kbd-hint">/</kbd>
  </div>
</div>

<div class="mt-4 {fill ? 'mt-0' : ''}">
  <Table.Root>
    <Table.Header class="[&_tr]:border-0">
      <Table.Row class="text-left text-xs hover:bg-transparent">
        <Table.Head class="h-auto rounded-l-lg bg-paper-2 py-2.5 pl-3 text-muted-foreground">Project</Table.Head>
        <Table.Head class="h-auto bg-paper-2 px-3 py-2.5 text-muted-foreground">Start</Table.Head>
        <Table.Head class="h-auto bg-paper-2 px-3 py-2.5 text-muted-foreground">Timeline</Table.Head>
        <Table.Head class="h-auto bg-paper-2 px-3 py-2.5 text-muted-foreground">Progress</Table.Head>
        <Table.Head class="h-auto bg-paper-2 px-3 py-2.5 text-muted-foreground">Status</Table.Head>
        <Table.Head class="h-auto w-8 rounded-r-lg bg-paper-2"><span class="sr-only">Open</span></Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each rows.slice(0, limit) as p (p.id)}
        {@const overdue = isOverdue(p, data.statusById)}
        <Table.Row class="group border-rule {onopen ? 'cursor-pointer hover:bg-paper-2/60' : 'hover:bg-transparent'}" onclick={() => onopen?.(p)}>
          <Table.Cell class="py-3 pr-3 pl-3 whitespace-normal">
            <div class="flex items-center gap-3">
              <ProjectAvatar project={p} size={36} />
              <div class="min-w-0">
                <p class="truncate font-semibold text-ink">{p.name}</p>
                <p class="truncate text-xs text-muted-foreground">{p.client || 'No client'}</p>
              </div>
            </div>
          </Table.Cell>
          <Table.Cell class="px-3 py-3">
            {#if p.start_date}
              <span class="inline-block rounded-lg bg-paper-2 px-2.5 py-1 text-xs leading-tight shadow-groove">
                <span class="block text-muted-foreground">{weekday(p.start_date)}</span>
                <span class="fig block font-medium whitespace-nowrap text-ink-2">{short(p.start_date)}</span>
              </span>
            {:else}<span class="text-xs text-muted-foreground">Not set</span>{/if}
          </Table.Cell>
          <Table.Cell class="px-3 py-3">
            <p class="fig font-medium text-ink">{range(p) || 'Not set'}</p>
            <p class="text-xs {overdue ? 'font-medium text-error' : 'text-muted-foreground'}">{left(p)}</p>
          </Table.Cell>
          <Table.Cell class="w-40 px-3 py-3"><ProgressBar value={p.progress} color={data.statusById[p.status]?.color} /></Table.Cell>
          <Table.Cell class="px-3 py-3"><StatusBadge status={data.statusById[p.status]} /></Table.Cell>
          <Table.Cell class="p-0 pr-3 text-muted-foreground">{#if onopen}<Icon name="chevron" size={16} class="transition-transform duration-150 group-hover:translate-x-0.5" />{/if}</Table.Cell>
        </Table.Row>
      {:else}
        <Table.Row class="hover:bg-transparent"><Table.Cell colspan={6} class="py-12 text-center whitespace-normal text-muted-foreground">{q ? 'No projects match this search.' : 'Nothing here yet.'}</Table.Cell></Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

{#if rows.length > limit && !fill}
  <Button variant="link" href="#/list" class="mt-3 h-auto gap-1.5 p-0 font-medium text-brand-2">
    View all {rows.length} projects <Icon name="arrow" size={14} />
  </Button>
{/if}
