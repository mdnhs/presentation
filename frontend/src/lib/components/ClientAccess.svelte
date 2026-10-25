<script>
  // "Portal access" for a saved client: its login (a viewer that sees only this client's projects).
  // Create it, reset its password, disable/enable it, or remove it (admins only).
  import { onMount } from 'svelte'
  import { can } from '../stores/auth.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import { generatePassword } from '../roles.js'
  import { createLogin, findLogin, removeLogin, setLoginDisabled, setLoginPassword } from '../clientLogin.js'
  import Icon from './Icon.svelte'
  import Credentials from './Credentials.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'

  let { client } = $props()

  let login = $state(null)
  let loading = $state(true)
  let busy = $state(false)
  let creating = $state(false)
  let email = $state(client.email ?? '')
  let password = $state(generatePassword())
  let issued = $state(null) // { email, password } just created or reset

  onMount(async () => {
    try {
      login = await findLogin(client.id)
    } catch (err) {
      toastError(err, 'Could not load portal access.')
    } finally {
      loading = false
    }
  })

  async function run(fn, done) {
    busy = true
    try {
      await fn()
      if (done) toast(done)
    } catch (err) {
      toastError(err)
    } finally {
      busy = false
    }
  }

  const create = () =>
    run(async () => {
      login = await createLogin(client, { email, password })
      issued = { email: login.email, password }
      creating = false
    }, `${client.name} can now sign in`)

  const reset = () =>
    run(async () => {
      const pw = generatePassword()
      await setLoginPassword(login, pw)
      issued = { email: login.email, password: pw }
    }, 'New password set')

  const toggle = () =>
    run(async () => {
      login = await setLoginDisabled(login, !login.suspended)
    }, login?.suspended ? 'Portal access enabled' : 'Portal access disabled')

  const remove = () =>
    run(async () => {
      await removeLogin(login)
      login = null
      issued = null
    }, 'Login removed')
</script>

<section class="mt-5 border-t border-rule pt-4">
  <div class="mb-3 flex items-center justify-between gap-3">
    <div>
      <h3 class="text-sm font-semibold text-ink">Portal access</h3>
      <p class="text-xs text-muted-foreground">The client signs in as a viewer and sees only their own projects.</p>
    </div>
    {#if login}
      <span class="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium {login.suspended ? 'bg-paper-3 text-muted-foreground' : 'bg-mint text-brand-2'}">
        {#if login.suspended}<Icon name="pause" size={11} /> Disabled{:else}<span class="size-1.5 rounded-full bg-brand"></span> Active{/if}
      </span>
    {/if}
  </div>

  {#if loading}
    <div class="h-10 animate-pulse rounded-lg bg-paper-3"></div>
  {:else if login}
    <div class="flex flex-wrap items-center gap-2 rounded-lg bg-paper-2 px-3 py-2">
      <Icon name="user" size={15} class="text-muted-foreground" />
      <span class="min-w-0 flex-1 truncate text-sm font-medium text-ink">{login.email}</span>
      <Button variant="outline" size="sm" disabled={busy} onclick={reset}><Icon name="refresh" size={13} /> New password</Button>
      <Button variant="outline" size="sm" disabled={busy} onclick={toggle}>
        <Icon name={login.suspended ? 'play' : 'pause'} size={13} /> {login.suspended ? 'Enable' : 'Disable'}
      </Button>
      {#if can.admin}
        <Button variant="ghost" size="icon-sm" class="text-muted-foreground hover:text-error" disabled={busy} onclick={remove} aria-label="Remove login" title="Remove login"><Icon name="trash" size={14} /></Button>
      {/if}
    </div>
    {#if issued}<div class="mt-3"><Credentials email={issued.email} password={issued.password} /></div>{/if}
  {:else if creating}
    <div class="grid gap-3 rounded-lg bg-paper-2 p-3 sm:grid-cols-2">
      <div class="space-y-1.5">
        <Label for="ca-email" class="text-xs">Login email</Label>
        <Input id="ca-email" type="email" autocomplete="off" required bind:value={email} />
      </div>
      <div class="space-y-1.5">
        <Label for="ca-password" class="text-xs">Password</Label>
        <div class="flex gap-1.5">
          <Input id="ca-password" class="fig" autocomplete="new-password" minlength={8} required bind:value={password} />
          <Button variant="outline" size="icon" onclick={() => (password = generatePassword())} aria-label="Generate a new password" title="Generate"><Icon name="refresh" size={14} /></Button>
        </div>
      </div>
      <div class="flex gap-2 sm:col-span-2">
        <Button size="sm" disabled={busy || !email.trim() || password.length < 8} onclick={create}>{busy ? 'Creating…' : 'Create login'}</Button>
        <Button variant="ghost" size="sm" onclick={() => (creating = false)}>Cancel</Button>
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-rule-2 px-3 py-2.5">
      <span class="text-sm text-muted-foreground">No login yet.</span>
      <Button variant="outline" size="sm" onclick={() => (creating = true)}><Icon name="plus" size={13} /> Give access</Button>
    </div>
  {/if}
</section>
