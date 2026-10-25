<script>
  import { dragHandle, dragHandleZone } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import { data } from '../stores/data.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'

  const FLIP_MS = 160
  // Muted defaults that sit calmly on the sage theme.
  const PALETTE = ['#A9B4BE', '#7EA6D3', '#E2B56C', '#6DAE91', '#A795CF', '#D99AB3', '#72B5B0', '#E0A07A', '#D98C8C']

  let items = $state([])
  let dragging = $state(false)
  let deleting = $state(null) // { status, moveTo }

  // Local copy for drag & drop; resynced from the store when not dragging.
  $effect(() => {
    const list = data.sortedStatuses
    if (!dragging) items = list.map((s) => ({ ...s }))
  })

  const countFor = (id) => data.projects.filter((p) => p.status === id).length

  function consider(e) {
    dragging = true
    items = e.detail.items
  }

  async function finalize(e) {
    items = e.detail.items
    dragging = false
    try {
      await data.saveStatusOrder(items.map((s) => s.id))
    } catch (err) {
      toastError(err, 'Could not save the new order.')
    }
  }

  async function save(status, patch) {
    try {
      await data.updateStatus(status.id, patch)
    } catch (err) {
      toastError(err)
    }
  }

  async function add() {
    try {
      const color = PALETTE[data.statuses.length % PALETTE.length]
      await data.createStatus({ name: 'New status', color, is_done: false })
    } catch (err) {
      toastError(err)
    }
  }

  function askDelete(status) {
    const others = data.sortedStatuses.filter((s) => s.id !== status.id)
    deleting = { status, count: countFor(status.id), moveTo: others[0]?.id ?? '' }
  }

  async function confirmDelete() {
    try {
      await data.deleteStatus(deleting.status.id, deleting.moveTo)
      toast(`Deleted "${deleting.status.name}"`)
      deleting = null
    } catch (err) {
      toastError(err)
    }
  }
</script>

<div
  class="space-y-2"
  use:dragHandleZone={{ items, flipDurationMs: FLIP_MS, type: 'status', dropTargetStyle: {} }}
  onconsider={consider}
  onfinalize={finalize}
>
  {#each items as s (s.id)}
    <div animate:flip={{ duration: FLIP_MS }} class="flex items-center gap-3 rounded-stock bg-cotton px-3 py-2 shadow-card">
      <span use:dragHandle class="cursor-grab text-muted-foreground hover:text-ink active:cursor-grabbing" aria-label="Drag to reorder {s.name}"><Icon name="grip" size={16} /></span>

      <label class="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-input ring-1 ring-ink/10 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus" style="background: {s.color}" title="Change color">
        <input type="color" class="absolute inset-0 cursor-pointer opacity-0" value={s.color} onchange={(e) => save(s, { color: e.currentTarget.value.toUpperCase() })} />
      </label>

      <Input
        class="max-w-60 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-rule-2 focus-visible:bg-cotton"
        aria-label="Status name"
        value={s.name}
        maxlength={50}
        onchange={(e) => e.currentTarget.value.trim() && save(s, { name: e.currentTarget.value.trim() })}
        onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />

      <span class="text-xs whitespace-nowrap text-muted-foreground"><span class="fig">{countFor(s.id)}</span> project{countFor(s.id) === 1 ? '' : 's'}</span>

      <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm whitespace-nowrap text-muted-foreground select-none" title="Projects in this status count as completed">
        <Checkbox checked={s.is_done} onCheckedChange={(v) => save(s, { is_done: v })} />
        Counts as done
      </label>

      <Button variant="ghost" size="icon" class="text-muted-foreground hover:text-error" onclick={() => askDelete(s)} title="Delete status" aria-label="Delete status {s.name}" disabled={data.statuses.length <= 1}>
        <Icon name="trash" size={16} />
      </Button>
    </div>
  {/each}
</div>

<Button variant="outline" class="mt-3" onclick={add}><Icon name="plus" size={16} /> Add status</Button>

{#if !data.sortedStatuses.some((s) => s.is_done)}
  <p class="mt-3 flex items-center gap-2 rounded-input border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-ink-2">
    <Icon name="alert" size={15} class="shrink-0 text-warn" />
    No status counts as done, so the completion charts will stay at zero.
  </p>
{/if}

<AlertDialog.Root open={!!deleting} onOpenChange={(open) => !open && (deleting = null)}>
  <AlertDialog.Content>
    {#if deleting}
      {@const others = data.sortedStatuses.filter((x) => x.id !== deleting.status.id)}
      <AlertDialog.Header>
        <AlertDialog.Title>Delete "{deleting.status.name}"?</AlertDialog.Title>
        {#if deleting.count}
          <AlertDialog.Description>
            Move its <span class="fig">{deleting.count}</span> project{deleting.count === 1 ? '' : 's'} to another status first.
          </AlertDialog.Description>
        {/if}
      </AlertDialog.Header>
      {#if deleting.count}
        <Select.Root type="single" value={deleting.moveTo} onValueChange={(v) => (deleting.moveTo = v)}>
          <Select.Trigger class="w-full" aria-label="Move projects to">
            {others.find((o) => o.id === deleting.moveTo)?.name ?? 'Choose a status'}
          </Select.Trigger>
          <Select.Content>
            {#each others as o (o.id)}<Select.Item value={o.id} label={o.name}>{o.name}</Select.Item>{/each}
          </Select.Content>
        </Select.Root>
      {/if}
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action variant="destructive" onclick={confirmDelete}>{deleting.count ? 'Move & delete' : 'Delete'}</AlertDialog.Action>
      </AlertDialog.Footer>
    {/if}
  </AlertDialog.Content>
</AlertDialog.Root>
