<script>
  import { data } from '../lib/stores/data.svelte.js'
  import ClientPanel from '../lib/components/ClientPanel.svelte'
  import Icon from '../lib/components/Icon.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import SkTable from '$lib/components/skeletons/SkTable.svelte'

  let search = $state('')
  let editing = $state(null)

  // Per-client project stats, by name (projects store the client as text).
  const stats = $derived.by(() => {
    const out = {}
    for (const p of data.projects) {
      if (!p.client) continue
      const s = (out[p.client] ??= { total: 0, active: 0 })
      s.total++
      if (!data.statusById[p.status]?.is_done) s.active++
    }
    return out
  })

  const rows = $derived.by(() => {
    const q = search.trim().toLowerCase()
    return [...data.clientRecords]
      .filter((c) => !q || [c.name, c.contact_name, c.email].some((v) => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  // Clicks on the contact links shouldn't also open the edit panel.
  const stop = (e) => e.stopPropagation()
</script>

<div class="p-[var(--gutter)]">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">Clients</h1>
      <p class="mt-1 text-sm text-muted-foreground"><span class="fig">{data.clientRecords.length}</span> clients and their contact details.</p>
    </div>
    <Button class="h-10 rounded-full px-4" onclick={() => (editing = {})}>
      <Icon name="plus" size={16} /> New client
    </Button>
  </div>

  <Card.Root class="card rounded-card block gap-0 overflow-hidden py-0 ring-0">
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <h2 class="text-sm font-semibold text-ink">All clients</h2>
      <div class="relative min-w-56 sm:w-72">
        <Icon name="search" size={15} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
        <Input class="peer h-8 pl-9 sm:pr-9" type="search" placeholder="Search clients…" aria-label="Search clients" aria-keyshortcuts="/" data-search="page" bind:value={search} />
        <kbd class="kbd-hint">/</kbd>
      </div>
    </div>

    {#if data.loading}
      <SkTable rows={5} columns={[{ kind: 'avatar' }, { kind: 'dates' }, { kind: 'short' }, { kind: 'chip' }, { kind: 'check', head: false, class: 'w-10' }]} />
    {:else}
      <Table.Root>
          <Table.Header>
            <Table.Row class="border-0 bg-paper-2 text-left text-xs hover:bg-paper-2">
              <Table.Head class="h-10 pr-4 pl-5 text-muted-foreground">Client</Table.Head>
              <Table.Head class="h-10 px-4 text-muted-foreground">Contact</Table.Head>
              <Table.Head class="h-10 px-4 text-muted-foreground">Phone</Table.Head>
              <Table.Head class="h-10 px-4 text-muted-foreground">Projects</Table.Head>
              <Table.Head class="h-10 w-10 px-4"><span class="sr-only">Open</span></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rows as c (c.id)}
              {@const s = stats[c.name] ?? { total: 0, active: 0 }}
              <Table.Row class="group cursor-pointer border-rule hover:bg-paper-2" onclick={() => (editing = c)}>
                <Table.Cell class="py-3 pr-4 pl-5 whitespace-normal">
                  <div class="flex items-center gap-3">
                    <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-mint text-xs font-semibold text-brand-2" aria-hidden="true">{initials(c.name)}</span>
                    <div class="min-w-0">
                      <Button variant="link" class="h-auto p-0 text-left text-sm font-semibold whitespace-normal text-ink no-underline hover:no-underline">{c.name}</Button>
                      {#if c.website}
                        <a href={c.website} target="_blank" rel="noopener" class="block truncate text-xs text-muted-foreground hover:text-ink hover:underline" onclick={stop}>{c.website.replace(/^https?:\/\//, '')}</a>
                      {/if}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell class="px-4 py-3 whitespace-normal">
                  {#if c.contact_name || c.email}
                    <div class="text-ink">{c.contact_name || ''}</div>
                    {#if c.email}<a href="mailto:{c.email}" class="text-xs text-muted-foreground hover:text-ink hover:underline" onclick={stop}>{c.email}</a>{/if}
                  {:else}
                    <span class="text-muted-foreground">Not set</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="px-4 py-3">
                  {#if c.phone}<a href="tel:{c.phone}" class="fig text-ink-2 hover:text-ink hover:underline" onclick={stop}>{c.phone}</a>{:else}<span class="text-muted-foreground">Not set</span>{/if}
                </Table.Cell>
                <Table.Cell class="px-4 py-3">
                  {#if s.total}
                    <Badge href="#/list?client={encodeURIComponent(c.name)}" variant="secondary" class="h-6 gap-1.5 rounded-md bg-paper-2 px-2 text-muted-foreground shadow-groove hover:text-ink" onclick={stop}>
                      <Icon name="folder" size={12} />
                      <span class="fig">{s.total}</span> total · <span class="fig">{s.active}</span> active
                    </Badge>
                  {:else}
                    <span class="text-muted-foreground">None</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="px-4 py-3 text-muted-foreground"><Icon name="chevron" size={16} /></Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row class="hover:bg-transparent">
                <Table.Cell colspan={5} class="px-5 py-16 text-center whitespace-normal text-muted-foreground">
                  {#if search}No clients match “{search}”.{:else}No clients yet. Add the first one with New client.{/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
      </Table.Root>
    {/if}
  </Card.Root>
</div>

{#if editing}
  <ClientPanel client={editing} onclose={() => (editing = null)} />
{/if}
