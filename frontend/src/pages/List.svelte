<script>
  import { data } from '../lib/stores/data.svelte.js'
  import { route } from '../lib/router.svelte.js'
  import { can } from '../lib/stores/auth.svelte.js'
  import { PRIORITIES, formatDate, isOverdue, toDate } from '../lib/utils.js'
  import StatusBadge from '../lib/components/StatusBadge.svelte'
  import PriorityBadge from '../lib/components/PriorityBadge.svelte'
  import ProgressBar from '../lib/components/ProgressBar.svelte'
  import ProjectPanel from '../lib/components/ProjectPanel.svelte'
  import Icon from '../lib/components/Icon.svelte'
  import ViewSwitch from '../lib/components/ViewSwitch.svelte'
  import ProjectAvatar from '../lib/components/ProjectAvatar.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import SkTable from '$lib/components/skeletons/SkTable.svelte'

  let search = $state(route.query.q ?? '')
  // The top bar's search lands here as ?q=.
  $effect(() => {
    if (route.query.q !== undefined) search = route.query.q
  })
  let status = $state(route.query.status ?? '')
  // The sidebar's Workflow links land here as ?status=; plain #/list clears it.
  $effect(() => {
    status = route.query.status ?? ''
  })
  let client = $state(route.query.client ?? '')
  // The Clients page links here as ?client=; plain #/list clears it.
  $effect(() => {
    client = route.query.client ?? ''
  })
  let priority = $state('')
  let overdueOnly = $state(false)
  let sortKey = $state('due_date')
  let sortDir = $state(1)
  let editing = $state(null)

  const COLUMNS = [
    { key: 'name', label: 'Project' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress' },
    { key: 'priority', label: 'Priority' },
    { key: 'start_date', label: 'Start' },
    { key: 'due_date', label: 'Due' },
  ]

  // Sort value per column (missing dates sort last).
  function sortValue(p, key) {
    if (key === 'status') return data.statusById[p.status]?.order ?? 999
    if (key === 'priority') return PRIORITIES.indexOf(p.priority)
    if (key === 'start_date' || key === 'due_date') return toDate(p[key])?.getTime() ?? Infinity
    if (key === 'progress') return p.progress || 0
    return (p[key] || '').toLowerCase()
  }

  const rows = $derived.by(() => {
    const q = search.trim().toLowerCase()
    return data.projects
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.client || '').toLowerCase().includes(q))
      .filter((p) => !status || p.status === status)
      .filter((p) => !client || p.client === client)
      .filter((p) => !priority || p.priority === priority)
      .filter((p) => !overdueOnly || isOverdue(p, data.statusById))
      .sort((a, b) => {
        const va = sortValue(a, sortKey)
        const vb = sortValue(b, sortKey)
        return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir
      })
  })

  const filtered = $derived(search || status || client || priority || overdueOnly)

  function sortBy(key) {
    if (sortKey === key) sortDir = -sortDir
    else {
      sortKey = key
      sortDir = 1
    }
  }

  // shadcn Select items can't have an empty value: '__all' stands for "no filter".
  const ALL = '__all'
  const pick = (v) => (v === ALL ? '' : v)

  function reset() {
    search = status = client = priority = ''
    overdueOnly = false
  }
</script>

<div class="p-[var(--gutter)]">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">Projects</h1>
      <p class="mt-1 text-sm text-muted-foreground">Showing <span class="fig">{rows.length}</span> of <span class="fig">{data.projects.length}</span> projects.</p>
    </div>
    {#if can.edit}
      <Button class="h-10 rounded-full px-4" onclick={() => (editing = {})} disabled={!data.sortedStatuses.length}>
        <Icon name="plus" size={16} /> New project
      </Button>
    {/if}
  </div>

  <Card.Root class="card rounded-card block gap-0 overflow-hidden py-0 ring-0">
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <h2 class="text-sm font-semibold text-ink">All projects</h2>
      <ViewSwitch />
    </div>

    <!-- Filters: one row above the table -->
    <div class="flex flex-wrap items-center gap-2 border-t border-rule px-5 py-3">
      <div class="relative min-w-56 flex-1 sm:max-w-xs">
        <Icon name="search" size={15} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
        <Input class="peer h-8 pl-9 sm:pr-9" type="search" placeholder="Search projects or clients…" aria-label="Search projects or clients" aria-keyshortcuts="/" data-search="page" bind:value={search} />
        <kbd class="kbd-hint">/</kbd>
      </div>
      <Select.Root type="single" value={status || ALL} onValueChange={(v) => (status = pick(v))}>
        <Select.Trigger size="sm" aria-label="Filter by status">{data.statusById[status]?.name ?? 'All statuses'}</Select.Trigger>
        <Select.Content>
          <Select.Item value={ALL} label="All statuses" />
          {#each data.sortedStatuses as s (s.id)}<Select.Item value={s.id} label={s.name} />{/each}
        </Select.Content>
      </Select.Root>
      <Select.Root type="single" value={client || ALL} onValueChange={(v) => (client = pick(v))}>
        <Select.Trigger size="sm" aria-label="Filter by client">{client || 'All clients'}</Select.Trigger>
        <Select.Content>
          <Select.Item value={ALL} label="All clients" />
          {#each data.clients as c (c)}<Select.Item value={c} label={c} />{/each}
        </Select.Content>
      </Select.Root>
      <Select.Root type="single" value={priority || ALL} onValueChange={(v) => (priority = pick(v))}>
        <Select.Trigger size="sm" class="capitalize" aria-label="Filter by priority">{priority || 'Any priority'}</Select.Trigger>
        <Select.Content>
          <Select.Item value={ALL} label="Any priority" />
          {#each PRIORITIES as p (p)}<Select.Item value={p} label={p} class="capitalize" />{/each}
        </Select.Content>
      </Select.Root>
      <Button
        variant="outline"
        size="sm"
        class={overdueOnly ? 'border-error/30 bg-error/10 text-error hover:bg-error/15 hover:text-error' : 'border-field bg-cotton text-ink-2 hover:text-ink'}
        onclick={() => (overdueOnly = !overdueOnly)}
        aria-pressed={overdueOnly}
      >
        <Icon name="alert" size={14} /> Overdue only
      </Button>
      {#if filtered}<Button variant="ghost" size="sm" class="text-muted-foreground" onclick={reset}>Clear filters</Button>{/if}
    </div>

    {#if data.loading}
      <SkTable rows={8} columns={[{ kind: 'avatar' }, { kind: 'badge' }, { kind: 'bar', class: 'w-48' }, { kind: 'badge' }, { kind: 'short' }, { kind: 'chip' }]} />
    {:else}
      <Table.Root>
          <Table.Header>
            <Table.Row class="border-0 bg-paper-2 text-left text-xs text-muted-foreground hover:bg-paper-2">
              {#each COLUMNS as col, ci (col.key)}
                <Table.Head class="h-10 px-4 text-muted-foreground {ci === 0 ? 'sticky left-0 bg-paper-2 pl-5' : ''}" aria-sort={sortKey === col.key ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'}>
                  <Button variant="link" class="h-auto gap-1 p-0 text-xs font-medium text-muted-foreground no-underline hover:text-ink hover:no-underline {sortKey === col.key ? 'text-ink' : ''}" onclick={() => sortBy(col.key)}>
                    {col.label}
                    <span class="w-2 text-[9px] {sortKey === col.key ? '' : 'opacity-0'}" aria-hidden="true">{sortDir > 0 ? '▲' : '▼'}</span>
                  </Button>
                </Table.Head>
              {/each}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rows as p (p.id)}
              {@const overdue = isOverdue(p, data.statusById)}
              <Table.Row class="group border-rule hover:bg-paper-2 {can.edit ? 'cursor-pointer' : ''}" onclick={() => can.edit && (editing = p)}>
                <Table.Cell class="sticky left-0 bg-cotton py-3 pr-4 pl-5 whitespace-normal group-hover:bg-paper-2">
                  <div class="flex items-center gap-3">
                    <ProjectAvatar project={p} size={36} />
                    <div class="min-w-0">
                      <Button variant="link" class="h-auto p-0 text-left text-sm font-semibold whitespace-normal text-ink no-underline hover:no-underline">{p.name}</Button>
                      {#if p.client}<div class="text-xs text-muted-foreground">{p.client}</div>{/if}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell class="px-4 py-3"><StatusBadge status={data.statusById[p.status]} /></Table.Cell>
                <Table.Cell class="w-48 px-4 py-3"><ProgressBar value={p.progress} color={data.statusById[p.status]?.color} /></Table.Cell>
                <Table.Cell class="px-4 py-3"><PriorityBadge priority={p.priority} /></Table.Cell>
                <Table.Cell class="px-4 py-3 text-muted-foreground"><span class="fig">{formatDate(p.start_date, { month: 'short', day: 'numeric', year: 'numeric' }) || 'Not set'}</span></Table.Cell>
                <Table.Cell class="px-4 py-3">
                  <Badge variant="secondary" class="h-6 gap-1.5 rounded-md bg-paper-2 px-2 shadow-groove {overdue ? 'text-error' : 'text-muted-foreground'}">
                    <Icon name="calendar" size={12} />
                    <span class="fig">{formatDate(p.due_date, { month: 'short', day: 'numeric', year: 'numeric' }) || 'Not set'}</span>
                  </Badge>
                  {#if overdue}<span class="ml-1.5 text-xs font-medium text-error">Overdue</span>{/if}
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row class="hover:bg-transparent">
                <Table.Cell colspan={COLUMNS.length} class="px-5 py-16 text-center whitespace-normal text-muted-foreground">
                  {#if filtered}No projects match these filters. <Button variant="link" class="h-auto p-0 font-medium text-ink underline underline-offset-2" onclick={reset}>Clear filters</Button>
                  {:else}No projects yet. Create the first one with New project.{/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
      </Table.Root>
    {/if}
  </Card.Root>
</div>

{#if editing}
  <ProjectPanel project={editing} onclose={() => (editing = null)} />
{/if}
