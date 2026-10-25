<script>
  // My account: anyone signed in can edit their own name and password.
  // Email, role and client are set by an admin (the users rules forbid changing them yourself).
  import { pb } from '../lib/pb.js'
  import { auth, can, login } from '../lib/stores/auth.svelte.js'
  import { data } from '../lib/stores/data.svelte.js'
  import { toast, toastError } from '../lib/stores/toast.svelte.js'
  import { ROLE_INFO } from '../lib/roles.js'
  import Icon from '../lib/components/Icon.svelte'
  import VerticalTabs from '../lib/components/VerticalTabs.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'

  const TABS = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'password', label: 'Password', icon: 'lock' },
  ]
  let tab = $state('profile')

  let name = $state(auth.user?.name ?? '')
  let savingName = $state(false)
  let pw = $state({ old: '', next: '', confirm: '' })
  let savingPw = $state(false)

  const user = $derived(auth.user)
  const client = $derived(can.client ? data.clientRecords?.find((c) => c.id === can.client) : null)
  const initials = $derived(
    (user?.name || user?.email?.split('@')[0] || '?')
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(''),
  )

  async function saveName(e) {
    e.preventDefault()
    savingName = true
    try {
      await pb.collection('users').update(user.id, { name: name.trim() })
      await pb.collection('users').authRefresh() // refresh the stored record so the top bar updates
      toast('Name updated')
    } catch (err) {
      toastError(err, 'Could not update your name.')
    } finally {
      savingName = false
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pw.next !== pw.confirm) return toastError(null, 'The new passwords do not match.')
    savingPw = true
    try {
      await pb.collection('users').update(user.id, { oldPassword: pw.old, password: pw.next, passwordConfirm: pw.confirm })
      // A new password ends every session, this one included: sign straight back in with it.
      await login(user.email, pw.next)
      pw = { old: '', next: '', confirm: '' }
      toast('Password changed. Other devices have been signed out.')
    } catch (err) {
      toastError(err, err?.response?.data?.oldPassword ? 'Your current password is not correct.' : 'Could not change the password (8+ characters).')
    } finally {
      savingPw = false
    }
  }
</script>

<div class="max-w-5xl p-4 sm:p-[var(--gutter)]">
  <h1 class="text-2xl leading-tight font-semibold text-ink sm:text-[1.75rem]">My account</h1>
  <p class="mt-1 text-sm text-muted-foreground">Your profile and password.</p>

  {#if user}
    <!-- Profile summary -->
    <!-- Phones: avatar and name on one line, badges on their own line below (they used to squeeze the name). -->
    <section class="mt-5 flex flex-col gap-3 rounded-card bg-cotton p-4 shadow-card sm:mt-6 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <span class="grid size-12 shrink-0 place-items-center rounded-full bg-mint text-base font-semibold text-brand-2 sm:size-14 sm:text-lg" aria-hidden="true">{initials}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-semibold text-ink sm:text-lg">{user.name || user.email.split('@')[0]}</p>
          <p class="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold {ROLE_INFO[can.role]?.tone}">{ROLE_INFO[can.role]?.label}</span>
        {#if client}<span class="inline-flex h-7 items-center gap-1.5 rounded-md bg-paper-2 px-2.5 text-xs font-medium text-ink-2"><Icon name="building" size={13} /> {client.name}</span>{/if}
      </div>
    </section>
    <p class="mt-2 px-1 text-xs text-muted-foreground">
      {can.client ? 'You can follow the progress of your projects here. You have view-only access.' : ROLE_INFO[can.role]?.about}
    </p>

    <div class="mt-6 sm:mt-8">
    <VerticalTabs tabs={TABS} bind:value={tab} id="account" label="Account sections">
    {#if tab === 'profile'}
    <form class="rounded-card bg-cotton p-4 shadow-card sm:p-5" onsubmit={saveName}>
      <h2 class="text-sm font-semibold text-ink">Profile</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <Label for="a-name">Full name</Label>
          <Input id="a-name" autocomplete="name" maxlength={120} bind:value={name} />
        </div>
        <div class="space-y-1.5">
          <Label for="a-email">Email</Label>
          <Input id="a-email" value={user.email} readonly disabled />
          <p class="text-xs text-muted-foreground">Ask an admin to change your sign-in email.</p>
        </div>
      </div>
      <div class="mt-4 border-t border-rule pt-4">
        <Button type="submit" class="w-full sm:w-auto" disabled={savingName || name.trim() === (user.name ?? '')}>{savingName ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>

    {:else}
    <form class="rounded-card bg-cotton p-4 shadow-card sm:p-5" onsubmit={savePassword}>
      <h2 class="text-sm font-semibold text-ink">Password</h2>
      <p class="mt-0.5 text-xs text-muted-foreground">Changing it signs you out on every other device.</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <div class="space-y-1.5">
          <Label for="a-old">Current password</Label>
          <Input id="a-old" type="password" autocomplete="current-password" required bind:value={pw.old} />
        </div>
        <div class="space-y-1.5">
          <Label for="a-new">New password</Label>
          <Input id="a-new" type="password" autocomplete="new-password" minlength={8} required bind:value={pw.next} />
        </div>
        <div class="space-y-1.5">
          <Label for="a-confirm">Confirm new password</Label>
          <Input id="a-confirm" type="password" autocomplete="new-password" minlength={8} required bind:value={pw.confirm} aria-invalid={pw.confirm && pw.confirm !== pw.next ? true : undefined} />
        </div>
      </div>
      <div class="mt-4 border-t border-rule pt-4">
        <Button type="submit" class="w-full sm:w-auto" disabled={savingPw}>{savingPw ? 'Changing…' : 'Change password'}</Button>
      </div>
    </form>
    {/if}
    </VerticalTabs>
    </div>
  {/if}
</div>
