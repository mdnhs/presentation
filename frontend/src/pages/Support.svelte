<script>
  // Support: a client sees and opens its own tickets; the team works the shared inbox.
  // ?t=<id> opens a ticket in a side sheet, so a ticket has a link you can share with the team.
  import { auth, can } from '../lib/stores/auth.svelte.js'
  import { data } from '../lib/stores/data.svelte.js'
  import { support, STATUSES, PRIORITIES } from '../lib/stores/support.svelte.js'
  import { route, navigate } from '../lib/router.svelte.js'
  import Icon from '../lib/components/Icon.svelte'
  import NewTicketSheet from '../lib/components/NewTicketSheet.svelte'
  import TicketSheet from '../lib/components/TicketSheet.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'

  const ALL = '__all'
  let filter = $state('active') // active | open | in_progress | waiting | resolved | all
  let q = $state('')
  let clientId = $state(ALL)
  let mineOnly = $state(false)
  let creating = $state(false)

  const staff = $derived(!can.client)
  const canCreate = $derived(can.client || (can.edit && !can.client))
  const openId = $derived(route.query.t || '')

  const counts = $derived({
    active: support.tickets.filter((t) => t.status !== 'resolved').length,
    open: support.tickets.filter((t) => t.status === 'open').length,
    in_progress: support.tickets.filter((t) => t.status === 'in_progress').length,
    waiting: support.tickets.filter((t) => t.status === 'waiting').length,
    resolved: support.tickets.filter((t) => t.status === 'resolved').length,
    all: support.tickets.length,
  })

  const rows = $derived.by(() => {
    const s = q.trim().toLowerCase()
    return support.tickets
      .filter((t) => (filter === 'all' ? true : filter === 'active' ? t.status !== 'resolved' : t.status === filter))
      .filter((t) => clientId === ALL || t.client === clientId)
      .filter((t) => !mineOnly || t.assignee === auth.user?.id)
      .filter((t) => !s || t.subject.toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s) || (t.expand?.client?.name || '').toLowerCase().includes(s))
  })

  const FILTERS = $derived([
    ['active', staff ? 'Active' : 'Open tickets'],
    ['open', 'Open'],
    ['in_progress', 'In progress'],
    ['waiting', staff ? 'Waiting on client' : 'Waiting on you'],
    ['resolved', 'Resolved'],
    ['all', 'All'],
  ])

  const name = (u) => u?.name || u?.email?.split('@')[0] || ''
  function ago(v) {
    if (!v) return ''
    const mins = Math.round((Date.now() - new Date(v.replace(' ', 'T'))) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const h = Math.round(mins / 60)
    if (h < 24) return `${h} h ago`
    const d = Math.round(h / 24)
    return d < 30 ? `${d} d ago` : new Date(v.replace(' ', 'T')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  const open = (t) => navigate(`/support?t=${t.id}`)
</script>

<div class="p-[var(--gutter)]">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">Support</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {staff ? 'Questions and requests from your clients.' : 'Ask us anything about your projects. Replies arrive here.'}
      </p>
    </div>
    {#if canCreate}
      <Button class="h-10 rounded-full px-4" onclick={() => (creating = true)}><Icon name="plus" size={16} /> New ticket</Button>
    {/if}
  </div>

  <!-- Stats double as filters -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each [['active', staff ? 'Active' : 'Open', 'support'], ['waiting', staff ? 'Waiting on client' : 'Waiting on you', 'pause'], ['resolved', 'Resolved', 'check']] as [key, label, icon] (key)}
      <button
        type="button"
        class="flex items-center gap-3 rounded-card bg-cotton p-4 text-left shadow-card transition-shadow duration-150 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-focus {filter === key ? 'ring-2 ring-brand/50' : ''}"
        onclick={() => (filter = key)}
        aria-pressed={filter === key}
      >
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-brand-2"><Icon name={icon} size={18} /></span>
        <span class="min-w-0">
          <span class="block truncate text-xs font-medium text-muted-foreground">{label}</span>
          <span class="fig block text-2xl leading-tight font-semibold text-ink">{support.loading ? '–' : counts[key]}</span>
        </span>
      </button>
    {/each}
    <div class="flex items-center gap-3 rounded-card bg-cotton p-4 shadow-card">
      <span class="grid size-10 shrink-0 place-items-center rounded-xl {support.unreadCount ? 'bg-brand text-brand-ink' : 'bg-paper-3 text-muted-foreground'}"><Icon name="send" size={17} /></span>
      <span class="min-w-0">
        <span class="block truncate text-xs font-medium text-muted-foreground">Unread replies</span>
        <span class="fig block text-2xl leading-tight font-semibold text-ink">{support.loading ? '–' : support.unreadCount}</span>
      </span>
    </div>
  </div>

  <section class="mt-5 overflow-hidden rounded-card bg-cotton shadow-card">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2 px-5 py-3.5">
      <div class="flex flex-wrap items-center gap-1 rounded-lg bg-paper-2 p-1">
        {#each FILTERS as [value, label] (value)}
          <button
            type="button"
            class="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus
              {filter === value ? 'bg-cotton text-ink shadow-stock' : 'text-muted-foreground hover:text-ink'}"
            aria-pressed={filter === value}
            onclick={() => (filter = value)}
          >{label}<span class="fig text-xs opacity-70">{counts[value]}</span></button>
        {/each}
      </div>
      <div class="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {#if staff}
          <Button variant={mineOnly ? 'secondary' : 'outline'} size="sm" aria-pressed={mineOnly} onclick={() => (mineOnly = !mineOnly)}><Icon name="user" size={13} /> Assigned to me</Button>
          {#if data.clientRecords.length}
            <Select.Root type="single" bind:value={clientId}>
              <Select.Trigger size="sm" class="w-40">{clientId === ALL ? 'All clients' : data.clientRecords.find((c) => c.id === clientId)?.name}</Select.Trigger>
              <Select.Content>
                <Select.Item value={ALL} label="All clients">All clients</Select.Item>
                {#each data.clientRecords as c (c.id)}<Select.Item value={c.id} label={c.name}>{c.name}</Select.Item>{/each}
              </Select.Content>
            </Select.Root>
          {/if}
        {/if}
        <div class="relative flex-1 sm:w-56 sm:flex-none">
          <Icon name="search" size={15} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input class="peer h-8 rounded-full bg-paper-2 pl-9 sm:pr-9" type="search" placeholder="Search tickets…" aria-label="Search tickets" aria-keyshortcuts="/" data-search="page" bind:value={q} />
          <kbd class="kbd-hint">/</kbd>
        </div>
      </div>
    </div>

    <!-- Tickets -->
    {#if support.loading}
      <div class="space-y-2 px-5 pb-5">{#each Array(4) as _, i (i)}<div class="h-16 animate-pulse rounded-lg bg-paper-3"></div>{/each}</div>
    {:else}
      <ul class="divide-y divide-rule border-t border-rule">
        {#each rows as t (t.id)}
          {@const unread = support.isUnread(t)}
          <li>
            <button type="button" class="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-paper-2/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus {openId === t.id ? 'bg-mint/40' : ''}" onclick={() => open(t)}>
              <span class="size-2 shrink-0 rounded-full {unread ? 'bg-brand' : 'bg-transparent'}" aria-label={unread ? 'Unread' : undefined}></span>
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-2">
                  <span class="truncate text-sm {unread ? 'font-semibold' : 'font-medium'} text-ink">{t.subject}</span>
                  <span class="fig shrink-0 text-xs text-muted-foreground">#{t.id.slice(0, 6)}</span>
                </p>
                <p class="mt-0.5 truncate text-xs text-muted-foreground">
                  {#if staff}<span class="font-medium text-ink-2">{t.expand?.client?.name}</span>{/if}
                  {#if t.expand?.project}<span>{staff ? ', ' : ''}{t.expand.project.name}</span>{/if}
                  {#if t.description}<span class="ml-1">{(staff || t.expand?.project) ? '. ' : ''}{t.description.slice(0, 120)}</span>{/if}
                </p>
              </div>
              <span class="hidden h-6 shrink-0 items-center rounded-md px-2 text-xs font-semibold md:inline-flex {PRIORITIES[t.priority]?.tone}">{PRIORITIES[t.priority]?.label}</span>
              <span class="inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-semibold {STATUSES[t.status]?.tone}">{t.status === 'waiting' && !staff ? 'Waiting on you' : STATUSES[t.status]?.label}</span>
              {#if staff}
                <span class="hidden w-28 shrink-0 truncate text-xs text-muted-foreground lg:block">{t.assignee ? name(t.expand?.assignee) : 'Unassigned'}</span>
              {/if}
              <span class="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:block">{ago(t.last_message_at || t.created)}</span>
              <Icon name="chevron" size={16} class="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          </li>
        {:else}
          <li class="px-5 py-16 text-center">
            <p class="text-sm text-muted-foreground">{support.tickets.length ? 'No tickets match these filters.' : staff ? 'No tickets yet. Clients can open one from their portal.' : 'No tickets yet.'}</p>
            {#if !support.tickets.length && canCreate}<Button variant="outline" class="mt-3" onclick={() => (creating = true)}><Icon name="plus" size={14} /> New ticket</Button>{/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

{#if creating}
  <NewTicketSheet onclose={() => (creating = false)} oncreated={open} />
{/if}
{#if openId}
  {#key openId}
    <TicketSheet ticketId={openId} onclose={() => navigate('/support')} />
  {/key}
{/if}
