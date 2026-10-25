<script>
  // A board column: header plus a dnd-kit drop target, so cards can land in it even when it is empty.
  import { createDroppable } from '@dnd-kit/svelte'
  import { CollisionPriority } from '@dnd-kit/abstract'
  import { alpha } from '../utils.js'
  import Icon from './Icon.svelte'
  import SortableCard from './SortableCard.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'

  /** ids: project ids in this column, in order; byId: project lookup */
  /** readonly: cards cannot be dragged (viewer role); onadd/onopen are null then too */
  let { status, ids, byId, onadd, onopen, readonly = false } = $props()

  const droppable = createDroppable({
    get id() {
      return status.id
    },
    get disabled() {
      return readonly
    },
    type: 'column',
    accept: 'project',
    // Cards win collisions over the column itself, so sorting within a column stays precise.
    collisionPriority: CollisionPriority.Low,
  })
</script>

<section class="relative flex max-h-[calc(100dvh-260px)] min-w-[280px] flex-1 flex-col rounded-2xl bg-lane p-2">
  <header class="mb-2.5 flex h-10 items-center gap-2 rounded-lg bg-cotton/70 pr-1.5 pl-2">
    <Badge variant="secondary" class="h-6 gap-1.5 rounded-md px-2 text-sm text-ink" style="background: {alpha(status.color, 0.16)}">
      <span class="size-2 rounded-full" style="background: {status.color}" aria-hidden="true"></span>
      {status.name}
    </Badge>
    <Badge variant="secondary" class="fig h-6 min-w-6 rounded-md bg-paper-3 px-1 text-ink-2">{ids.length}</Badge>
    {#if onadd}
      <Button variant="ghost" size="icon-sm" class="ml-auto size-7 rounded-md text-muted-foreground hover:bg-paper-3 hover:text-ink" onclick={() => onadd(status)} title="Add project to {status.name}" aria-label="Add project to {status.name}">
        <Icon name="plus" size={16} />
      </Button>
    {/if}
  </header>

  <div
    {@attach droppable.attach}
    class="flex min-h-32 flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-0.5 transition-colors duration-150
      {droppable.isDropTarget ? 'bg-mint/60 outline-2 outline-offset-2 outline-brand/40 outline-dashed' : ''}"
  >
    {#each ids as id, index (id)}
      {#if byId[id]}
        <SortableCard project={byId[id]} {index} group={status.id} {onopen} disabled={readonly} />
      {/if}
    {/each}
    {#if !ids.length}
      <p class="pointer-events-none grid h-24 place-items-center rounded-xl border border-dashed border-rule-2 text-sm text-muted-foreground">{readonly ? 'No projects' : 'Drop projects here'}</p>
    {/if}
  </div>
</section>
