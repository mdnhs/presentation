<script>
  // One ticket in a right-hand sheet: details, the conversation (live), and a reply box.
  // Staff editors/admins set status, priority and assignee and can post internal notes;
  // a client can reply and resolve/reopen. The server enforces all of it.
  import { onMount, tick } from 'svelte'
  import { auth, can } from '../stores/auth.svelte.js'
  import { support, fileUrl, STATUSES, PRIORITIES } from '../stores/support.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import { formatDate } from '../utils.js'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'

  let { ticketId, onclose } = $props()

  const UNASSIGNED = '__none'
  const staffEditor = $derived(can.edit && !can.client)
  const ticket = $derived(support.tickets.find((t) => t.id === ticketId))

  let messages = $state([])
  let loading = $state(true)
  let body = $state('')
  let files = $state([])
  let internal = $state(false)
  let sending = $state(false)
  let scroller = $state()

  const name = (u) => u?.name || u?.email?.split('@')[0] || 'Someone'
  const when = (v) => formatDate(v, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const mine = (m) => m.author === auth.user?.id
  const fromClient = (m) => !!m.expand?.author?.client

  async function toBottom() {
    await tick()
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }

  onMount(() => {
    let unsub
    ;(async () => {
      try {
        messages = await support.messages(ticketId)
        unsub = await support.watchMessages(ticketId, ({ action, record }) => {
          const i = messages.findIndex((m) => m.id === record.id)
          if (action === 'delete') messages = messages.filter((m) => m.id !== record.id)
          else if (i >= 0) messages[i] = record
          else messages = [...messages, record]
          toBottom()
        })
      } catch (err) {
        toastError(err, 'Could not load the conversation.')
      } finally {
        loading = false
        toBottom()
      }
    })()
    return () => unsub?.()
  })

  // Opening (or watching) a ticket marks it read.
  $effect(() => {
    if (ticket && support.isUnread(ticket)) support.markRead(ticket)
  })

  async function send(e) {
    e?.preventDefault()
    if (!body.trim() && !files.length) return
    sending = true
    try {
      const msg = await support.send(ticketId, { body: body.trim(), internal, files })
      if (!messages.some((m) => m.id === msg.id)) messages = [...messages, msg]
      body = ''
      files = []
      internal = false
      toBottom()
    } catch (err) {
      toastError(err, 'Could not send (attachments: up to 5 files, 10 MB each).')
    } finally {
      sending = false
    }
  }

  async function set(patch, done) {
    try {
      await support.update(ticketId, patch)
      if (done) toast(done)
    } catch (err) {
      toastError(err)
    }
  }

  function pick(e) {
    files = [...files, ...e.currentTarget.files].slice(0, 5)
    e.currentTarget.value = ''
  }
</script>

<Sheet.Root open onOpenChange={(o) => !o && onclose()}>
  <Sheet.Content side="right" showCloseButton={false} class="gap-0 bg-cotton p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
    {#if ticket}
      <Sheet.Header class="gap-3 border-b border-rule px-6 py-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground">
              <span class="fig">#{ticket.id.slice(0, 6)}</span>
              {#if !can.client}<span class="mx-1">for</span><span class="font-medium text-ink-2">{ticket.expand?.client?.name}</span>{/if}
            </p>
            <Sheet.Title class="mt-0.5 text-lg leading-snug font-semibold text-ink">{ticket.subject}</Sheet.Title>
            <Sheet.Description class="mt-1 text-xs text-muted-foreground">
              Opened {when(ticket.created)} by {name(ticket.expand?.created_by)}{#if ticket.expand?.project}<span>, about {ticket.expand.project.name}</span>{/if}
            </Sheet.Description>
          </div>
          <Button variant="outline" size="icon-sm" class="shrink-0 text-muted-foreground" onclick={onclose} aria-label="Close"><Icon name="x" size={16} /></Button>
        </div>

        <!-- Ticket controls -->
        <div class="flex flex-wrap items-center gap-2">
          {#if staffEditor}
            <Select.Root type="single" value={ticket.status} onValueChange={(v) => v !== ticket.status && set({ status: v }, `Marked ${STATUSES[v].label.toLowerCase()}`)}>
              <Select.Trigger size="sm" class="h-7 gap-1 border-0 px-2.5 text-xs font-semibold {STATUSES[ticket.status]?.tone}" aria-label="Status">{STATUSES[ticket.status]?.label}</Select.Trigger>
              <Select.Content>{#each Object.entries(STATUSES) as [v, s] (v)}<Select.Item value={v} label={s.label}>{s.label}</Select.Item>{/each}</Select.Content>
            </Select.Root>
            <Select.Root type="single" value={ticket.priority} onValueChange={(v) => v !== ticket.priority && set({ priority: v })}>
              <Select.Trigger size="sm" class="h-7 gap-1 border-0 px-2.5 text-xs font-semibold {PRIORITIES[ticket.priority]?.tone}" aria-label="Priority">{PRIORITIES[ticket.priority]?.label} priority</Select.Trigger>
              <Select.Content>{#each Object.entries(PRIORITIES) as [v, p] (v)}<Select.Item value={v} label={p.label}>{p.label}</Select.Item>{/each}</Select.Content>
            </Select.Root>
            <Select.Root type="single" value={ticket.assignee || UNASSIGNED} onValueChange={(v) => set({ assignee: v === UNASSIGNED ? '' : v }, v === UNASSIGNED ? 'Unassigned' : 'Assigned')}>
              <Select.Trigger size="sm" class="h-7 gap-1 border-0 bg-paper-2 px-2.5 text-xs font-medium text-ink-2" aria-label="Assignee">
                <Icon name="user" size={12} /> {ticket.assignee ? name(ticket.expand?.assignee) : 'Unassigned'}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value={UNASSIGNED} label="Unassigned">Unassigned</Select.Item>
                <Select.Item value={auth.user.id} label="Me">Me ({name(auth.user)})</Select.Item>
                {#if ticket.assignee && ticket.assignee !== auth.user.id}<Select.Item value={ticket.assignee} label={name(ticket.expand?.assignee)}>{name(ticket.expand?.assignee)}</Select.Item>{/if}
              </Select.Content>
            </Select.Root>
          {:else}
            <span class="inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold {STATUSES[ticket.status]?.tone}">{STATUSES[ticket.status]?.label}</span>
            <span class="inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold {PRIORITIES[ticket.priority]?.tone}">{PRIORITIES[ticket.priority]?.label} priority</span>
            {#if ticket.assignee}<span class="inline-flex h-7 items-center gap-1 rounded-md bg-paper-2 px-2.5 text-xs text-ink-2"><Icon name="user" size={12} /> {name(ticket.expand?.assignee)}</span>{/if}
          {/if}
          {#if can.client}
            {#if ticket.status === 'resolved'}
              <Button variant="outline" size="sm" class="ml-auto" onclick={() => set({ status: 'open' }, 'Ticket reopened')}><Icon name="refresh" size={13} /> Reopen</Button>
            {:else}
              <Button variant="outline" size="sm" class="ml-auto" onclick={() => set({ status: 'resolved' }, 'Marked resolved. Thanks!')}><Icon name="check" size={13} /> Mark resolved</Button>
            {/if}
          {/if}
        </div>
      </Sheet.Header>

      <!-- Conversation -->
      <div bind:this={scroller} class="min-h-0 flex-1 space-y-4 overflow-y-auto bg-paper-2/50 px-6 py-5">
        <!-- The opening request -->
        <article class="rounded-xl bg-cotton p-4 shadow-card">
          <p class="mb-2 text-xs text-muted-foreground"><span class="font-semibold text-ink-2">{name(ticket.expand?.created_by)}</span> · {when(ticket.created)}</p>
          {#if ticket.description}<p class="text-sm whitespace-pre-wrap text-ink">{ticket.description}</p>{:else}<p class="text-sm text-muted-foreground italic">No details given.</p>{/if}
          {#if ticket.attachments?.length}
            <ul class="mt-3 flex flex-wrap gap-1.5">
              {#each ticket.attachments as f (f)}
                <li><a href={fileUrl(ticket, f)} target="_blank" rel="noopener" class="inline-flex h-7 items-center gap-1.5 rounded-md bg-paper-2 px-2 text-xs text-ink-2 hover:text-ink"><Icon name="paperclip" size={12} /> <span class="max-w-48 truncate">{f}</span></a></li>
              {/each}
            </ul>
          {/if}
        </article>

        {#if loading}
          <div class="h-16 animate-pulse rounded-xl bg-paper-3"></div>
        {:else}
          {#each messages as m (m.id)}
            {@const me = mine(m)}
            <article class="flex {me ? 'justify-end' : 'justify-start'}">
              <div
                class="max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-card
                  {m.internal ? 'border border-dashed border-warn/60 bg-warn/10' : me ? 'bg-brand text-brand-ink' : 'bg-cotton text-ink'}"
              >
                <p class="mb-1 flex flex-wrap items-center gap-x-1.5 text-xs {me && !m.internal ? 'text-brand-ink/80' : 'text-muted-foreground'}">
                  <span class="font-semibold">{me ? 'You' : name(m.expand?.author)}</span>
                  {#if !me && !fromClient(m) && can.client}<span>(team)</span>{/if}
                  <span>{when(m.created)}</span>
                  {#if m.internal}<span class="inline-flex items-center gap-1 font-semibold text-ink-2"><Icon name="lock" size={11} /> Internal note</span>{/if}
                </p>
                {#if m.body}<p class="whitespace-pre-wrap">{m.body}</p>{/if}
                {#if m.attachments?.length}
                  <ul class="mt-2 flex flex-wrap gap-1.5">
                    {#each m.attachments as f (f)}
                      <li><a href={fileUrl(m, f)} target="_blank" rel="noopener" class="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs {me && !m.internal ? 'bg-brand-ink/15 text-brand-ink' : 'bg-paper-2 text-ink-2 hover:text-ink'}"><Icon name="paperclip" size={12} /> <span class="max-w-40 truncate">{f}</span></a></li>
                    {/each}
                  </ul>
                {/if}
              </div>
            </article>
          {:else}
            <p class="py-6 text-center text-sm text-muted-foreground">{can.client ? 'No reply yet. We will answer here.' : 'No replies yet.'}</p>
          {/each}
        {/if}
      </div>

      <!-- Reply -->
      {#if staffEditor || can.client}
        <form class="space-y-2 border-t border-rule px-6 py-4" onsubmit={send}>
          <Textarea
            rows={3}
            class="resize-none {internal ? 'border-warn/60 bg-warn/5' : ''}"
            placeholder={internal ? 'Internal note, only the team sees this' : can.client ? 'Write a reply…' : 'Reply to the client…'}
            aria-label="Message"
            bind:value={body}
            onkeydown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send(e)}
          />
          {#if files.length}
            <ul class="flex flex-wrap gap-1.5">
              {#each files as f, i (f.name + i)}
                <li class="inline-flex h-7 items-center gap-1.5 rounded-md bg-paper-2 pr-1 pl-2 text-xs text-ink-2">
                  <span class="max-w-40 truncate">{f.name}</span>
                  <button type="button" class="grid size-5 place-items-center rounded text-muted-foreground hover:text-ink" onclick={() => (files = files.filter((_, j) => j !== i))} aria-label="Remove {f.name}"><Icon name="x" size={11} /></button>
                </li>
              {/each}
            </ul>
          {/if}
          <div class="flex flex-wrap items-center gap-3">
            <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-paper-2 hover:text-ink has-focus-visible:outline-2 has-focus-visible:outline-focus">
              <Icon name="paperclip" size={14} /> Attach
              <input type="file" multiple class="sr-only" onchange={pick} />
            </label>
            {#if staffEditor}
              <div class="flex items-center gap-2">
                <Switch id="t-internal" bind:checked={internal} />
                <Label for="t-internal" class="text-xs font-normal text-muted-foreground"><Icon name="lock" size={12} /> Internal note</Label>
              </div>
            {/if}
            <span class="ml-auto hidden text-xs text-muted-foreground sm:inline">Ctrl/⌘ + Enter to send</span>
            <Button type="submit" size="sm" disabled={sending || (!body.trim() && !files.length)}>
              <Icon name="send" size={13} /> {sending ? 'Sending…' : internal ? 'Add note' : 'Send'}
            </Button>
          </div>
        </form>
      {:else}
        <p class="border-t border-rule px-6 py-4 text-xs text-muted-foreground">Your role can read tickets but not reply.</p>
      {/if}
    {:else}
      <Sheet.Header class="px-6 py-5"><Sheet.Title>Ticket not found</Sheet.Title></Sheet.Header>
      <p class="px-6 text-sm text-muted-foreground">It may have been deleted, or you no longer have access.</p>
    {/if}
  </Sheet.Content>
</Sheet.Root>
