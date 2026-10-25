<script>
  import { DragDropProvider } from '@dnd-kit/svelte'
  import { move } from '@dnd-kit/helpers'
  import { data } from '../lib/stores/data.svelte.js'
  import { can } from '../lib/stores/auth.svelte.js'
  import { toastError } from '../lib/stores/toast.svelte.js'
  import BoardColumn from '../lib/components/BoardColumn.svelte'
  import ProjectPanel from '../lib/components/ProjectPanel.svelte'
  import Icon from '../lib/components/Icon.svelte'
  import ViewSwitch from '../lib/components/ViewSwitch.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Select from '$lib/components/ui/select/index.js'

  // Column state for dnd-kit: { [statusId]: projectId[] } in display order.
  // Rebuilt from the store whenever data changes and no drag (or its save) is in progress.
  let items = $state({})
  let dragging = $state(false)
  let editing = $state(null)
  let client = $state('') // '' = all clients
  const ALL = '__all' // shadcn Select items can't have an empty value
  let before = {} // the columns as they were when the drag started

  const byId = $derived(Object.fromEntries(data.projects.map((p) => [p.id, p])))
  const visible = $derived(client ? data.projects.filter((p) => p.client === client) : data.projects)
  const columnIds = (statusId) =>
    data.projects
      .filter((p) => p.status === statusId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((p) => p.id)

  $effect(() => {
    const statuses = data.sortedStatuses
    const shown = new Set(visible.map((p) => p.id))
    if (dragging) return
    items = Object.fromEntries(statuses.map((s) => [s.id, columnIds(s.id).filter((id) => shown.has(id))]))
  })

  function onDragStart() {
    dragging = true
    before = $state.snapshot(items)
  }

  const columnOf = (id) => Object.keys(items).find((col) => items[col].includes(id))

  // Cards reorder live while dragging, across columns too.
  function onDragOver(event) {
    const { source, target } = event.operation
    if (!source || !target || source.id === target.id) return
    const from = columnOf(source.id)
    const to = items[target.id] ? target.id : columnOf(target.id) // over a column, or over a card in it
    if (!from || !to || from === to) {
      items = move(items, event)
      return
    }
    // Into another column: place by the pointer, not by the dragged card's centre (dnd-kit's default),
    // so hovering the top half of the first card puts it first even when the card was grabbed by its title.
    const pointer = source.manager?.dragOperation.position.current
    let index = items[to].length // over the column's empty space: last
    if (!items[target.id]) {
      const below = pointer && target.shape ? pointer.y > target.shape.center.y : false
      index = items[to].indexOf(target.id) + (below ? 1 : 0)
    }
    items = {
      ...items,
      [from]: items[from].filter((id) => id !== source.id),
      [to]: [...items[to].slice(0, index), source.id, ...items[to].slice(index)],
    }
  }

  async function onDragEnd(event) {
    if (event.canceled) {
      items = before
      dragging = false
      return
    }
    // Save only the columns whose order or membership changed.
    const changed = Object.keys(items).filter((id) => items[id].join() !== (before[id] ?? []).join())
    try {
      await Promise.all(changed.map((id) => data.saveColumn(id, withHidden(id, items[id]))))
    } catch (err) {
      toastError(err, 'Could not save the new order.')
    } finally {
      dragging = false // resync from the store
    }
  }

  // While filtered, the board shows only some cards: keep each hidden card in its old slot and
  // fill the visible slots, in order, with the column's new visible order.
  function withHidden(statusId, shownIds) {
    const shown = new Set(visible.map((p) => p.id))
    const queue = [...shownIds]
    const merged = []
    for (const id of columnIds(statusId)) {
      if (!shown.has(id)) merged.push(id)
      else if (queue.length) merged.push(queue.shift())
    }
    return [...merged, ...queue]
  }

  function addProject(status) {
    editing = { status: status.id, progress: status.is_done ? 100 : 0 }
  }
  const open = (p) => (editing = data.projects.find((x) => x.id === p.id) ?? p)
</script>

<div class="p-[var(--gutter)]">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">Board</h1>
      <p class="mt-1 text-sm text-muted-foreground">{can.edit ? 'Drag cards between columns to update their status.' : 'View only. Your role can see projects but not change them.'}</p>
    </div>
    {#if can.edit}
      <Button class="h-10 rounded-full px-4" onclick={() => addProject(data.sortedStatuses[0])} disabled={!data.sortedStatuses.length}>
        <Icon name="plus" size={16} /> New project
      </Button>
    {/if}
  </div>

  <Card.Root class="card rounded-card block gap-0 overflow-visible py-0 ring-0">
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <h2 class="text-sm font-semibold text-ink">{client || 'All projects'}</h2>
      <div class="flex items-center gap-2">
        {#if data.clients.length}
          <Select.Root type="single" value={client || ALL} onValueChange={(v) => (client = v === ALL ? '' : v)}>
            <Select.Trigger size="sm" aria-label="Filter by client">{client || 'All clients'}</Select.Trigger>
            <Select.Content>
              <Select.Item value={ALL} label="All clients" />
              {#each data.clients as c (c)}<Select.Item value={c} label={c} />{/each}
            </Select.Content>
          </Select.Root>
        {/if}
        <ViewSwitch />
      </div>
    </div>

    {#if data.loading}
      <div class="flex gap-4 overflow-hidden px-5 pb-5">
        {#each Array(4) as _, i (i)}
          <div class="min-w-[280px] flex-1 space-y-3">
            <Skeleton class="h-10 rounded-input bg-paper-3" />
            <Skeleton class="h-36 rounded-input bg-paper-3" />
            <Skeleton class="h-36 rounded-input bg-paper-3" />
          </div>
        {/each}
      </div>
    {:else if !data.sortedStatuses.length}
      <div class="grid place-items-center px-5 pt-10 pb-16 text-center">
        <p class="text-muted-foreground">No statuses yet. Add some in <Button variant="link" href="#/settings" class="h-auto p-0 font-medium text-ink underline underline-offset-2">Settings</Button>.</p>
      </div>
    {:else}
      <DragDropProvider {onDragStart} {onDragOver} {onDragEnd}>
        <div class="flex gap-4 overflow-x-auto px-5 pb-5">
          {#each data.sortedStatuses as status (status.id)}
            <BoardColumn {status} ids={items[status.id] ?? []} {byId} onadd={can.edit ? addProject : null} onopen={can.edit ? open : null} readonly={!can.edit} />
          {/each}
        </div>
      </DragDropProvider>
    {/if}
  </Card.Root>
</div>

{#if editing}
  <ProjectPanel project={editing} onclose={() => (editing = null)} />
{/if}
