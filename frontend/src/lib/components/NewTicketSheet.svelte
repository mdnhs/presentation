<script>
  // New support ticket, in a right-hand sheet. A client login files it for its own client; staff pick the client.
  import { data } from '../stores/data.svelte.js'
  import { can } from '../stores/auth.svelte.js'
  import { support, PRIORITIES } from '../stores/support.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'

  let { onclose, oncreated } = $props()

  const NONE = '__none' // shadcn Select items can't have an empty value
  let form = $state({ subject: '', description: '', client: can.client || '', project: NONE, priority: 'normal' })
  let files = $state([])
  let saving = $state(false)

  const clientRecord = $derived(data.clientRecords.find((c) => c.id === form.client))
  const projects = $derived(clientRecord ? data.projects.filter((p) => p.client === clientRecord.name) : [])

  function pick(e) {
    files = [...files, ...e.currentTarget.files].slice(0, 5)
    e.currentTarget.value = ''
  }

  async function save(e) {
    e.preventDefault()
    if (!form.client) return toastError(null, 'Choose the client this ticket is for.')
    saving = true
    try {
      const ticket = await support.create({
        subject: form.subject.trim(),
        description: form.description.trim(),
        client: form.client,
        project: form.project === NONE ? '' : form.project,
        priority: form.priority,
        attachments: files,
      })
      toast(can.client ? 'Ticket sent. We will get back to you here.' : 'Ticket created')
      oncreated?.(ticket)
      onclose()
    } catch (err) {
      toastError(err, 'Could not create the ticket (attachments: up to 5 files, 10 MB each).')
    } finally {
      saving = false
    }
  }
</script>

<Sheet.Root open onOpenChange={(o) => !o && onclose()}>
  <Sheet.Content side="right" showCloseButton={false} class="gap-0 bg-cotton p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
    <Sheet.Header class="flex-row items-start justify-between gap-3 border-b border-rule px-6 py-5">
      <div>
        <Sheet.Title class="text-base font-semibold text-ink">{can.client ? 'How can we help?' : 'New ticket'}</Sheet.Title>
        <Sheet.Description class="text-xs text-muted-foreground">{can.client ? 'Tell us what you need. You can follow the reply here.' : 'Open a ticket on behalf of a client.'}</Sheet.Description>
      </div>
      <Button variant="outline" size="icon-sm" class="text-muted-foreground" onclick={onclose} aria-label="Close"><Icon name="x" size={16} /></Button>
    </Sheet.Header>

    <form id="ticket-form" onsubmit={save} class="flex-1 space-y-4 overflow-y-auto px-6 py-5">
      <div class="space-y-1.5">
        <Label for="t-subject">Subject</Label>
        <Input id="t-subject" required maxlength={200} placeholder="A short summary" bind:value={form.subject} />
      </div>

      <div class="grid gap-4">
        {#if !can.client}
          <div class="space-y-1.5">
            <Label>Client</Label>
            <Select.Root type="single" bind:value={form.client} onValueChange={() => (form.project = NONE)}>
              <Select.Trigger class="w-full">{clientRecord?.name ?? 'Choose a client'}</Select.Trigger>
              <Select.Content>
                {#each data.clientRecords as c (c.id)}<Select.Item value={c.id} label={c.name}>{c.name}</Select.Item>{/each}
              </Select.Content>
            </Select.Root>
          </div>
        {/if}
        <div class="space-y-1.5">
          <Label>Project</Label>
          <Select.Root type="single" bind:value={form.project} disabled={!form.client}>
            <Select.Trigger class="w-full">{projects.find((p) => p.id === form.project)?.name ?? 'Not about one project'}</Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE} label="Not about one project">Not about one project</Select.Item>
              {#each projects as p (p.id)}<Select.Item value={p.id} label={p.name}>{p.name}</Select.Item>{/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="space-y-1.5">
          <Label>Priority</Label>
          <Select.Root type="single" bind:value={form.priority}>
            <Select.Trigger class="w-full">{PRIORITIES[form.priority].label}</Select.Trigger>
            <Select.Content>
              {#each Object.entries(PRIORITIES) as [value, p] (value)}<Select.Item {value} label={p.label}>{p.label}</Select.Item>{/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <div class="space-y-1.5">
        <Label for="t-description">Details</Label>
        <Textarea id="t-description" rows={6} class="resize-y" maxlength={10000} placeholder="What happened, what you expected, any links or steps." bind:value={form.description} />
      </div>

      <div>
        <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-rule-2 px-3 py-2 text-sm text-muted-foreground hover:bg-paper-2 hover:text-ink has-focus-visible:outline-2 has-focus-visible:outline-focus">
          <Icon name="paperclip" size={15} /> Attach files
          <input type="file" multiple class="sr-only" onchange={pick} />
        </label>
        <span class="ml-2 text-xs text-muted-foreground">Up to 5 files, 10 MB each.</span>
        {#if files.length}
          <ul class="mt-2 flex flex-wrap gap-1.5">
            {#each files as f, i (f.name + i)}
              <li class="inline-flex h-7 items-center gap-1.5 rounded-md bg-paper-2 pr-1 pl-2 text-xs text-ink-2">
                <span class="max-w-48 truncate">{f.name}</span>
                <button type="button" class="grid size-5 place-items-center rounded text-muted-foreground hover:text-ink" onclick={() => (files = files.filter((_, j) => j !== i))} aria-label="Remove {f.name}"><Icon name="x" size={11} /></button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </form>

    <div class="flex justify-end gap-2 border-t border-rule px-6 py-4">
      <Button variant="outline" onclick={onclose}>Cancel</Button>
      <Button type="submit" form="ticket-form" disabled={saving}>{saving ? 'Sending…' : can.client ? 'Send ticket' : 'Create ticket'}</Button>
    </div>
  </Sheet.Content>
</Sheet.Root>
