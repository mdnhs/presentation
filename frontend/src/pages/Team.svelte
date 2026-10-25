<script>
  // Team (admins only): who can sign in and what they may do.
  // Search, filter by role or suspension, sort, bulk role changes and suspensions, per-member actions.
  // The server enforces all of it (users rules + pb_hooks/rbac.pb.js); this page only drives it.
  import { onMount } from 'svelte'
  import { pb } from '../lib/pb.js'
  import { data } from '../lib/stores/data.svelte.js'
  import { auth, can, ROLES } from '../lib/stores/auth.svelte.js'
  import { toast, toastError } from '../lib/stores/toast.svelte.js'
  import { ROLE_INFO, PERMISSIONS } from '../lib/roles.js'
  import { formatDate } from '../lib/utils.js'
  import Icon from '../lib/components/Icon.svelte'
  import MemberDialog from '../lib/components/MemberDialog.svelte'
  import PasswordDialog from '../lib/components/PasswordDialog.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'

  let members = $state([])
  let loading = $state(true)
  let q = $state('')
  let filter = $state('all') // all | admin | editor | viewer | suspended
  let sort = $state('name')
  let selected = $state(new Set())
  let dialog = $state(null) // { kind: 'member' | 'password' | 'remove', member }
  let busy = $state(false)

  async function load() {
    try {
      members = await pb.collection('users').getFullList({ sort: 'created' })
    } catch (err) {
      toastError(err, 'Could not load the team.')
    } finally {
      loading = false
    }
  }
  onMount(() => can.admin && load())

  const isSelf = (m) => m.id === auth.user?.id
  // Client logins belong to one client and are always viewers (pb_hooks/rbac.pb.js).
  const clientName = (m) => (m.client ? (data.clientRecords.find((c) => c.id === m.client)?.name ?? 'a client') : '')
  const display = (m) => m.name || m.email.split('@')[0]
  const initials = (m) =>
    display(m)
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')

  const counts = $derived({
    all: members.length,
    admin: members.filter((m) => m.role === 'admin' && !m.suspended).length,
    editor: members.filter((m) => m.role === 'editor' && !m.suspended).length,
    viewer: members.filter((m) => m.role === 'viewer' && !m.suspended).length,
    suspended: members.filter((m) => m.suspended).length,
  })

  const SORTS = {
    name: (a, b) => display(a).localeCompare(display(b)),
    newest: (a, b) => b.created.localeCompare(a.created),
    role: (a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || display(a).localeCompare(display(b)),
  }

  const rows = $derived.by(() => {
    const s = q.trim().toLowerCase()
    return members
      .filter((m) => (filter === 'all' ? true : filter === 'suspended' ? m.suspended : m.role === filter && !m.suspended))
      .filter((m) => !s || display(m).toLowerCase().includes(s) || m.email.toLowerCase().includes(s))
      .sort(SORTS[sort])
  })

  // Selection never includes yourself: bulk actions can't demote or suspend the person using them.
  const selectable = $derived(rows.filter((m) => !isSelf(m)))
  const allSelected = $derived(selectable.length > 0 && selectable.every((m) => selected.has(m.id)))
  function toggleAll() {
    selected = allSelected ? new Set() : new Set(selectable.map((m) => m.id))
  }
  function toggle(m) {
    const next = new Set(selected)
    next.has(m.id) ? next.delete(m.id) : next.add(m.id)
    selected = next
  }

  // Applies one change to many members; reports partial failures (e.g. the last-admin guard).
  async function updateMany(ids, patch, done) {
    busy = true
    const results = await Promise.allSettled(ids.map((id) => pb.collection('users').update(id, patch)))
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length) toastError(failed[0].reason, `${failed.length} could not be updated.`)
    if (failed.length < ids.length) toast(done(ids.length - failed.length))
    selected = new Set()
    busy = false
    await load()
  }

  const setRole = (m, role) => updateMany([m.id], { role }, () => `${display(m)} is now ${ROLE_INFO[role].label.toLowerCase()}`)
  const setSuspended = (m, suspended) =>
    updateMany([m.id], { suspended }, () => `${display(m)} ${suspended ? 'suspended. They can no longer sign in.' : 'reactivated'}`)
  const bulkRole = (role) => updateMany([...selected], { role }, (n) => `${n} member${n === 1 ? '' : 's'} set to ${ROLE_INFO[role].label.toLowerCase()}`)
  const bulkSuspend = (suspended) =>
    updateMany([...selected], { suspended }, (n) => `${n} member${n === 1 ? '' : 's'} ${suspended ? 'suspended' : 'reactivated'}`)

  async function remove(m) {
    busy = true
    try {
      await pb.collection('users').delete(m.id)
      toast(`${display(m)} removed from the team`)
      dialog = null
      await load()
    } catch (err) {
      toastError(err, 'Could not remove this member.')
    } finally {
      busy = false
    }
  }

  const FILTERS = [
    ['all', 'All'],
    ['admin', 'Admins'],
    ['editor', 'Editors'],
    ['viewer', 'Viewers'],
    ['suspended', 'Suspended'],
  ]
  const STATS = [
    ['all', 'Members', 'users'],
    ['admin', 'Admins', 'shield'],
    ['editor', 'Editors', 'pencil'],
    ['viewer', 'Viewers', 'eye'],
    ['suspended', 'Suspended', 'pause'],
  ]
  const SORT_LABELS = { name: 'Name A to Z', newest: 'Newest first', role: 'By role' }

  // shadcn Card without its own padding/ring, so it keeps the app's card look.
  const CARD = 'gap-0 rounded-card py-0 shadow-card ring-0'
  const ICON_BTN = 'size-8 rounded-lg text-muted-foreground hover:bg-paper-3 hover:text-ink'
</script>

<div class="p-[var(--gutter)]">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">Team</h1>
      <p class="mt-1 text-sm text-muted-foreground">Who can sign in, and what each person may do.</p>
    </div>
    {#if can.admin}
      <Button class="h-10 rounded-full px-4" onclick={() => (dialog = { kind: 'member', member: null })}>
        <Icon name="plus" size={16} /> Add member
      </Button>
    {/if}
  </div>

  {#if !can.admin}
    <Card.Root class="{CARD} flex-row items-center gap-3 p-6 text-sm text-ink-2">
      <Icon name="alert" size={18} class="shrink-0 text-muted-foreground" />
      Only admins can manage the team. Your role is {can.role}.
    </Card.Root>
  {:else}
    <!-- Stats: each tile is also a filter -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {#each STATS as [key, label, icon] (key)}
        <Button
          variant="ghost"
          class="h-auto justify-start gap-3 rounded-card bg-cotton p-4 text-left whitespace-normal shadow-card transition-shadow duration-150 hover:bg-cotton hover:shadow-lift active:not-aria-[haspopup]:translate-y-0
            {filter === key ? 'ring-2 ring-brand/50' : ''}"
          onclick={() => (filter = filter === key && key !== 'all' ? 'all' : key)}
          aria-pressed={filter === key}
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl {key === 'suspended' ? 'bg-paper-3 text-muted-foreground' : 'bg-mint text-brand-2'}"><Icon name={icon} size={18} /></span>
          <span class="min-w-0">
            <span class="block truncate text-xs font-medium text-muted-foreground">{label}</span>
            <span class="fig block text-2xl leading-tight font-semibold text-ink">{loading ? '–' : counts[key]}</span>
          </span>
        </Button>
      {/each}
    </div>

    <Card.Root class="{CARD} mt-5">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 px-5 py-3.5">
        <ToggleGroup.Root type="single" spacing={1} class="groove" bind:value={() => filter, (v) => v && (filter = v)} aria-label="Filter members">
          {#each FILTERS as [value, label] (value)}
            <ToggleGroup.Item
              {value}
              class="h-7 flex-1 gap-1.5 px-3 text-muted-foreground hover:bg-transparent hover:text-ink data-[state=on]:bg-mint data-[state=on]:text-brand-2"
            >
              {label}<span class="fig text-xs opacity-70">{loading ? '' : counts[value]}</span>
            </ToggleGroup.Item>
          {/each}
        </ToggleGroup.Root>
        <div class="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div class="relative flex-1 sm:w-64 sm:flex-none">
            <Icon name="search" size={15} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input class="peer rounded-full bg-paper-2 pl-9 sm:pr-9" type="search" placeholder="Search name or email…" aria-label="Search members" aria-keyshortcuts="/" data-search="page" bind:value={q} />
          <kbd class="kbd-hint">/</kbd>
          </div>
          <Select.Root type="single" value={sort} onValueChange={(v) => (sort = v)}>
            <Select.Trigger aria-label="Sort members">{SORT_LABELS[sort]}</Select.Trigger>
            <Select.Content>
              {#each Object.entries(SORT_LABELS) as [value, label] (value)}<Select.Item {value} {label}>{label}</Select.Item>{/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <!-- Bulk actions -->
      {#if selected.size}
        <div class="flex flex-wrap items-center gap-2 border-t border-rule bg-mint/60 px-5 py-2.5 text-sm">
          <span class="font-semibold text-ink"><span class="fig">{selected.size}</span> selected</span>
          <span class="mx-1 h-4 w-px bg-rule-2" aria-hidden="true"></span>
          <span class="text-muted-foreground">Set role</span>
          {#each ROLES as r (r)}
            <Button variant="outline" size="sm" class="px-3" disabled={busy} onclick={() => bulkRole(r)}>{ROLE_INFO[r].label}</Button>
          {/each}
          <span class="mx-1 h-4 w-px bg-rule-2" aria-hidden="true"></span>
          <Button variant="outline" size="sm" class="px-3" disabled={busy} onclick={() => bulkSuspend(true)}><Icon name="pause" size={13} /> Suspend</Button>
          <Button variant="outline" size="sm" class="px-3" disabled={busy} onclick={() => bulkSuspend(false)}><Icon name="play" size={13} /> Reactivate</Button>
          <Button variant="ghost" size="sm" class="ml-auto text-muted-foreground" onclick={() => (selected = new Set())}>Clear</Button>
        </div>
      {/if}

      <!-- Members -->
      {#if loading}
        <div class="space-y-2 p-5">{#each Array(4) as _, i (i)}<Skeleton class="h-14 rounded-input bg-paper-3" />{/each}</div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row class="border-0 bg-paper-2 text-xs text-muted-foreground hover:bg-paper-2">
              <Table.Head class="h-auto w-10 py-2.5 pl-5 text-muted-foreground">
                <Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onCheckedChange={toggleAll} disabled={!selectable.length} aria-label="Select all members shown" />
              </Table.Head>
              <Table.Head class="h-auto px-3 py-2.5 text-muted-foreground">Member</Table.Head>
              <Table.Head class="h-auto px-3 py-2.5 text-muted-foreground">Role</Table.Head>
              <Table.Head class="h-auto px-3 py-2.5 text-muted-foreground">Status</Table.Head>
              <Table.Head class="h-auto px-3 py-2.5 text-muted-foreground">Joined</Table.Head>
              <Table.Head class="h-auto py-2.5 pr-5 text-right text-muted-foreground"><span class="sr-only">Actions</span></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rows as m (m.id)}
              {@const self = isSelf(m)}
              <Table.Row class="border-rule {selected.has(m.id) ? 'bg-mint/40 hover:bg-mint/40' : 'hover:bg-paper-2/60'} {m.suspended ? 'opacity-70' : ''}">
                <Table.Cell class="py-3 pl-5">
                  <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m)} disabled={self} aria-label="Select {display(m)}" />
                </Table.Cell>
                <Table.Cell class="px-3 py-3 whitespace-normal">
                  <div class="flex items-center gap-3">
                    <span class="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold {ROLE_INFO[m.role]?.tone ?? 'bg-paper-3 text-ink-2'}" aria-hidden="true">{initials(m)}</span>
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-ink">{display(m)}{#if self}<span class="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>{/if}</p>
                      <p class="truncate text-xs text-muted-foreground">{m.email}</p>
                      {#if m.client}<p class="mt-0.5 flex items-center gap-1 text-xs font-medium text-ink-2"><Icon name="building" size={11} /> Client login: {clientName(m)}</p>{/if}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell class="px-3 py-3">
                  <Select.Root type="single" value={m.role} onValueChange={(v) => v !== m.role && setRole(m, v)} disabled={self || busy || !!m.client}>
                    <Select.Trigger
                      size="sm"
                      class="h-7 gap-1 rounded-md border-0 px-2 text-xs font-semibold {ROLE_INFO[m.role]?.tone} disabled:opacity-80"
                      title={self ? 'You cannot change your own role' : m.client ? 'Client logins are always viewers' : 'Change role'}
                      aria-label="Role for {display(m)}"
                    >
                      {ROLE_INFO[m.role]?.label ?? m.role}
                    </Select.Trigger>
                    <Select.Content>
                      {#each ROLES as r (r)}<Select.Item value={r} label={ROLE_INFO[r].label}>{ROLE_INFO[r].label}</Select.Item>{/each}
                    </Select.Content>
                  </Select.Root>
                </Table.Cell>
                <Table.Cell class="px-3 py-3">
                  {#if m.suspended}
                    <Badge variant="secondary" class="h-6 gap-1.5 rounded-md bg-paper-3 px-2 text-muted-foreground"><Icon name="pause" size={11} /> Suspended</Badge>
                  {:else}
                    <Badge variant="secondary" class="h-6 gap-1.5 rounded-md bg-mint px-2 text-brand-2"><span class="size-1.5 rounded-full bg-brand"></span> Active</Badge>
                  {/if}
                </Table.Cell>
                <Table.Cell class="fig px-3 py-3 text-muted-foreground">{formatDate(m.created, { month: 'short', day: 'numeric', year: 'numeric' })}</Table.Cell>
                <Table.Cell class="py-3 pr-5">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" class={ICON_BTN} onclick={() => (dialog = { kind: 'member', member: m })} title="Edit" aria-label="Edit {display(m)}"><Icon name="pencil" size={15} /></Button>
                    <Button variant="ghost" size="icon-sm" class={ICON_BTN} onclick={() => (dialog = { kind: 'password', member: m })} title="Set a new password" aria-label="Set a new password for {display(m)}"><Icon name="refresh" size={15} /></Button>
                    {#if !self}
                      <Button variant="ghost" size="icon-sm" class={ICON_BTN} disabled={busy} onclick={() => setSuspended(m, !m.suspended)} title={m.suspended ? 'Reactivate' : 'Suspend'} aria-label="{m.suspended ? 'Reactivate' : 'Suspend'} {display(m)}">
                        <Icon name={m.suspended ? 'play' : 'pause'} size={15} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" class="{ICON_BTN} hover:bg-error/10 hover:text-error" onclick={() => (dialog = { kind: 'remove', member: m })} title="Remove" aria-label="Remove {display(m)}"><Icon name="trash" size={15} /></Button>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row class="hover:bg-transparent"><Table.Cell colspan={6} class="px-5 py-14 text-center text-muted-foreground">{q ? 'No members match this search.' : 'No members here yet.'}</Table.Cell></Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.Root>

    <!-- What each role can do -->
    <Card.Root class="{CARD} mt-5">
      <div class="px-5 pt-4 pb-3">
        <h2 class="text-sm font-semibold text-ink">Roles and permissions</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">Enforced by the server, not just hidden in the app. Suspended members cannot sign in at all.</p>
      </div>
      <Table.Root>
        <Table.Header>
          <Table.Row class="border-0 bg-paper-2 text-xs hover:bg-paper-2">
            <Table.Head class="h-auto py-2.5 pl-5 text-muted-foreground">Permission</Table.Head>
            {#each ROLES as r (r)}<Table.Head class="h-auto w-28 px-3 py-2.5 text-center text-muted-foreground">{ROLE_INFO[r].label}</Table.Head>{/each}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each PERMISSIONS as [what, ...allowed] (what)}
            <Table.Row class="border-rule hover:bg-transparent">
              <Table.Cell class="py-2.5 pl-5 whitespace-normal text-ink-2">{what}</Table.Cell>
              {#each allowed as ok, i (i)}
                <Table.Cell class="px-3 py-2.5 text-center">
                  {#if ok}<span class="inline-grid size-6 place-items-center rounded-full bg-mint text-brand-2"><Icon name="check" size={13} strokeWidth={2.5} /><span class="sr-only">Yes</span></span>
                  {:else}<span class="inline-grid size-6 place-items-center rounded-full bg-paper-3 text-muted-foreground"><Icon name="x" size={12} /><span class="sr-only">No</span></span>{/if}
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  {/if}
</div>

{#if dialog?.kind === 'member'}
  <MemberDialog member={dialog.member} onclose={() => (dialog = null)} onsaved={load} />
{:else if dialog?.kind === 'password'}
  <PasswordDialog member={dialog.member} onclose={() => (dialog = null)} />
{/if}

<AlertDialog.Root open={dialog?.kind === 'remove'} onOpenChange={(open) => !open && (dialog = null)}>
  <AlertDialog.Content>
    {#if dialog?.kind === 'remove'}
      {@const m = dialog.member}
      <AlertDialog.Header>
        <span class="grid size-10 place-items-center rounded-full bg-error/10 text-error"><Icon name="trash" size={18} /></span>
        <AlertDialog.Title>Remove {display(m)}?</AlertDialog.Title>
        <AlertDialog.Description>They will lose access immediately and their account is deleted. To keep the account but block access, suspend them instead.</AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer class="flex-wrap">
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        {#if !m.suspended}<Button variant="outline" disabled={busy} onclick={() => { dialog = null; setSuspended(m, true) }}><Icon name="pause" size={14} /> Suspend instead</Button>{/if}
        <AlertDialog.Action variant="destructive" disabled={busy} onclick={() => remove(m)}>Remove</AlertDialog.Action>
      </AlertDialog.Footer>
    {/if}
  </AlertDialog.Content>
</AlertDialog.Root>
