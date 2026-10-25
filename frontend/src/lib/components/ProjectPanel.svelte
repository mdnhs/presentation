<script>
  import { data } from '../stores/data.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import { PRIORITIES, fromInputDate, plainText, toInputDate } from '../utils.js'
  import Icon from './Icon.svelte'
  import DatePicker from './DatePicker.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Slider } from '$lib/components/ui/slider/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
  import { can } from '../stores/auth.svelte.js'

  /** project: existing record, or a draft without `id` for "new project" */
  let { project, onclose } = $props()

  const isNew = !project.id
  // Selected priority chip, tinted like Synchro's "Urgent".
  const PRIORITY_ON = {
    high: 'data-[state=on]:border-error/25 data-[state=on]:bg-error/10 data-[state=on]:text-error',
    medium: 'data-[state=on]:border-warn/30 data-[state=on]:bg-warn/10 data-[state=on]:text-warn',
    low: 'data-[state=on]:border-rule-2 data-[state=on]:bg-paper-2 data-[state=on]:text-ink-2',
  }
  const COLORS = ['', '#8E9BD6', '#D99AB3', '#72B5B0', '#E0A07A', '#A795CF', '#7EB3D6']

  let form = $state({
    name: project.name ?? '',
    client: project.client ?? '',
    description: plainText(project.description),
    status: project.status ?? data.sortedStatuses[0]?.id,
    progress: project.progress ?? 0,
    priority: project.priority || 'medium',
    start_date: toInputDate(project.start_date),
    due_date: toInputDate(project.due_date),
    color: project.color ?? '',
  })
  let saving = $state(false)

  // Moving a card into a "done" status bumps progress to 100%.
  $effect(() => {
    if (data.statusById[form.status]?.is_done) form.progress = 100
  })

  async function save(e) {
    e.preventDefault()
    saving = true
    const payload = {
      ...form,
      progress: Number(form.progress),
      start_date: fromInputDate(form.start_date),
      due_date: fromInputDate(form.due_date),
    }
    try {
      if (isNew) {
        const inColumn = data.projects.filter((p) => p.status === payload.status)
        payload.order = inColumn.length ? Math.max(...inColumn.map((p) => p.order || 0)) + 1 : 0
        await data.createProject(payload)
        toast('Project created')
      } else {
        await data.updateProject(project.id, payload)
        toast('Project saved')
      }
      onclose()
    } catch (err) {
      toastError(err)
    } finally {
      saving = false
    }
  }

  // `autofocus` is unreliable on elements mounted after load; focus after the open click settles.
  function focusIfNew(node) {
    if (isNew) requestAnimationFrame(() => node.focus())
  }

  async function remove() {
    try {
      await data.deleteProject(project.id)
      toast('Project deleted')
      onclose()
    } catch (err) {
      toastError(err)
    }
  }
</script>

<Dialog.Root open onOpenChange={(o) => !o && onclose()}>
  <Dialog.Content
    showCloseButton={false}
    onOpenAutoFocus={(e) => e.preventDefault()}
    class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 rounded-2xl bg-cotton p-0 shadow-panel ring-0 sm:max-w-xl"
  >
    <Dialog.Header class="flex-row items-center justify-between px-6 pt-5 pb-1">
      <Dialog.Title class="text-base font-semibold text-ink">{isNew ? 'New project' : 'Edit project'}</Dialog.Title>
      <Button variant="outline" size="icon-sm" class="text-muted-foreground" onclick={onclose} aria-label="Close"><Icon name="x" size={16} /></Button>
    </Dialog.Header>

    <form id="project-form" onsubmit={save} class="flex-1 overflow-y-auto px-6 py-4">
      <input
        id="p-name"
        class="-mx-1.5 mb-4 w-[calc(100%+0.75rem)] rounded-md border-0 bg-transparent px-1.5 py-1 text-xl font-semibold text-ink placeholder:text-muted-foreground/70"
        placeholder="Project name"
        aria-label="Project name"
        required
        maxlength="200"
        bind:value={form.name}
        use:focusIfNew
      />

      <div class="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 max-sm:[&>*:nth-child(odd):not(:first-child)]:mt-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-y-2.5 text-sm">
        <Label for="p-status" class="font-normal text-muted-foreground"><Icon name="status" size={15} /> Status</Label>
        <Select.Root type="single" bind:value={form.status}>
          <Select.Trigger id="p-status" class="w-full">{data.statusById[form.status]?.name ?? 'Choose a status'}</Select.Trigger>
          <Select.Content>
            {#each data.sortedStatuses as s (s.id)}
              <Select.Item value={s.id} label={s.name}>
                <span class="size-2 rounded-full" style="background: {s.color}" aria-hidden="true"></span>
                {s.name}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Label for="p-client" class="font-normal text-muted-foreground"><Icon name="building" size={15} /> Client</Label>
        <div>
          <Input id="p-client" list="client-list" maxlength="120" placeholder="Add a client" bind:value={form.client} />
          <datalist id="client-list">
            {#each data.clients as c (c)}<option value={c}></option>{/each}
          </datalist>
        </div>

        <span class="flex items-center gap-2 text-muted-foreground"><Icon name="flag" size={15} /> Priority</span>
        <ToggleGroup.Root type="single" spacing={1.5} value={form.priority} onValueChange={(v) => v && (form.priority = v)} aria-label="Priority">
          {#each PRIORITIES as p (p)}
            <ToggleGroup.Item
              value={p}
              class="h-7 rounded-md border border-rule px-2.5 capitalize text-muted-foreground hover:bg-transparent hover:text-ink {PRIORITY_ON[p]}"
            >{p}</ToggleGroup.Item>
          {/each}
        </ToggleGroup.Root>

        <Label for="p-start" class="font-normal text-muted-foreground"><Icon name="calendar" size={15} /> Start date</Label>
        <DatePicker id="p-start" bind:value={form.start_date} />

        <Label for="p-due" class="font-normal text-muted-foreground"><Icon name="calendar" size={15} /> Due date</Label>
        <DatePicker id="p-due" bind:value={form.due_date} min={form.start_date} />

        <Label for="p-progress" class="font-normal text-muted-foreground"><Icon name="trend" size={15} /> Progress</Label>
        <div class="flex items-center gap-3">
          <Slider
            id="p-progress"
            type="single"
            min={0}
            max={100}
            step={5}
            bind:value={form.progress}
            aria-label="Progress"
            class="min-w-0 flex-1 [&_[data-slot=slider-range]]:bg-(--bar) [&_[data-slot=slider-thumb]]:border-(--bar)"
            style="--bar: {data.statusById[form.status]?.color || 'var(--color-ink)'}"
          />
          <span class="fig w-10 text-right font-medium text-ink">{form.progress}%</span>
        </div>

        <span class="flex items-center gap-2 text-muted-foreground"><Icon name="palette" size={15} /> Tag color</span>
        <ToggleGroup.Root type="single" spacing={2} value={form.color || '__none'} onValueChange={(v) => v && (form.color = v === '__none' ? '' : v)} aria-label="Tag color">
          {#each COLORS as c (c)}
            <ToggleGroup.Item
              value={c || '__none'}
              aria-label={c || 'No color'}
              class="grid size-6 min-w-0 place-items-center rounded-md p-0 ring-offset-2 ring-offset-cotton transition-shadow duration-150
                hover:bg-transparent data-[state=on]:ring-2 data-[state=on]:ring-ink
                {c ? 'data-[state=on]:bg-transparent' : 'border border-dashed border-rule-2'}"
              style={c ? `background: ${c}` : ''}
            >
              {#if !c}<Icon name="x" size={11} class="text-muted-foreground" />{/if}
            </ToggleGroup.Item>
          {/each}
        </ToggleGroup.Root>

        <Label for="p-desc" class="self-start font-normal sm:pt-2 text-muted-foreground"><Icon name="text" size={15} /> Description</Label>
        <Textarea id="p-desc" rows={3} class="min-h-0 resize-y" placeholder="Add a description" bind:value={form.description} />
      </div>
    </form>

    <div class="flex flex-wrap items-center gap-2 border-t border-rule px-6 py-4">
      {#if !isNew && can.admin}
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="ghost" class="text-error hover:text-error"><Icon name="trash" size={16} /> Delete</Button>
            {/snippet}
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete this project?</AlertDialog.Title>
              <AlertDialog.Description>“{project.name}” and its history will be removed. This can't be undone.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Keep</AlertDialog.Cancel>
              <AlertDialog.Action class="bg-error text-white hover:bg-error/90" onclick={remove}>Delete</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>
      {/if}
      <div class="ml-auto flex gap-2">
        <Button variant="outline" onclick={onclose}>Cancel</Button>
        <Button type="submit" form="project-form" class="min-w-20" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create' : 'Save'}</Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
