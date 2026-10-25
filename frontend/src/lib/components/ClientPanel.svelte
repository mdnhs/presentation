<script>
  import { data } from '../stores/data.svelte.js'
  import { can } from '../stores/auth.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import Icon from './Icon.svelte'
  import ClientAccess from './ClientAccess.svelte'
  import Credentials from './Credentials.svelte'
  import { generatePassword } from '../roles.js'
  import { createLogin } from '../clientLogin.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'

  /** client: existing record, or `{}` for "new client" */
  let { client, onclose } = $props()

  const isNew = !client.id
  const projectCount = $derived(isNew ? 0 : data.projects.filter((p) => p.client === client.name).length)

  let form = $state({
    name: client.name ?? '',
    contact_name: client.contact_name ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    website: client.website ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
  })
  let saving = $state(false)
  // New clients can get their portal login in the same step.
  let portal = $state({ enabled: false, email: '', password: generatePassword() })
  let issued = $state(null) // { email, password } once the login exists

  async function save(e) {
    e.preventDefault()
    if (isNew && portal.enabled && !(portal.email || form.email).trim()) {
      return toastError(null, 'Add a login email (or a contact email) to give portal access.')
    }
    saving = true
    const payload = { ...form, name: form.name.trim() }
    try {
      if (isNew) {
        const record = await data.createClient(payload)
        if (portal.enabled) {
          try {
            const email = (portal.email || form.email).trim()
            await createLogin(record, { email, password: portal.password })
            issued = { email, password: portal.password }
            toast('Client and portal login created')
            return // stay open to show the sign-in details once
          } catch (err) {
            toastError(err, 'The client was created, but its login could not be (is the email already in use?). Add it from Edit client.')
          }
        } else {
          toast('Client created')
        }
      } else {
        await data.updateClient(client.id, payload)
        toast('Client saved')
      }
      onclose()
    } catch (err) {
      toastError(err, err?.response?.data?.name ? 'A client with this name already exists.' : undefined)
    } finally {
      saving = false
    }
  }

  function focusIfNew(node) {
    if (isNew) requestAnimationFrame(() => node.focus())
  }

  async function remove() {
    try {
      await data.deleteClient(client.id)
      toast('Client deleted')
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
      <Dialog.Title class="text-base font-semibold text-ink">{issued ? 'Client created' : isNew ? 'New client' : 'Edit client'}</Dialog.Title>
      <Button variant="outline" size="icon-sm" class="text-muted-foreground" onclick={onclose} aria-label="Close"><Icon name="x" size={16} /></Button>
    </Dialog.Header>

    {#if issued}
      <div class="px-6 py-4">
        <p class="mb-3 text-sm text-ink-2">{form.name} can now sign in and follow the progress of their projects.</p>
        <Credentials email={issued.email} password={issued.password} />
      </div>
      <div class="flex justify-end border-t border-rule px-6 py-4"><Button onclick={onclose}>Done</Button></div>
    {:else}
    <form id="client-form" onsubmit={save} class="flex-1 overflow-y-auto px-6 py-4">
      <input
        class="-mx-1.5 mb-4 w-[calc(100%+0.75rem)] rounded-md border-0 bg-transparent px-1.5 py-1 text-xl font-semibold text-ink placeholder:text-muted-foreground/70"
        placeholder="Client name"
        aria-label="Client name"
        required
        maxlength="120"
        autocomplete="organization"
        bind:value={form.name}
        use:focusIfNew
      />
      {#if !isNew && projectCount && form.name.trim() !== client.name}
        <p class="-mt-2 mb-4 text-xs text-muted-foreground">Renaming also updates its <span class="fig">{projectCount}</span> project(s).</p>
      {/if}

      <div class="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 max-sm:[&>*:nth-child(odd):not(:first-child)]:mt-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-y-2.5 text-sm">
        <Label for="c-contact" class="font-normal text-muted-foreground"><Icon name="user" size={15} /> Contact</Label>
        <Input id="c-contact" maxlength={120} autocomplete="name" placeholder="Contact person" bind:value={form.contact_name} />

        <Label for="c-email" class="font-normal text-muted-foreground"><Icon name="text" size={15} /> Email</Label>
        <Input id="c-email" type="email" autocomplete="email" placeholder="name@company.com" bind:value={form.email} />

        <Label for="c-phone" class="font-normal text-muted-foreground"><Icon name="text" size={15} /> Phone</Label>
        <Input id="c-phone" type="tel" maxlength={40} autocomplete="tel" bind:value={form.phone} />

        <Label for="c-website" class="font-normal text-muted-foreground"><Icon name="link" size={15} /> Website</Label>
        <Input id="c-website" type="url" placeholder="https://" bind:value={form.website} />

        <Label for="c-address" class="font-normal text-muted-foreground"><Icon name="building" size={15} /> Address</Label>
        <Input id="c-address" maxlength={300} autocomplete="street-address" bind:value={form.address} />

        <Label for="c-notes" class="self-start font-normal sm:pt-2 text-muted-foreground"><Icon name="text" size={15} /> Notes</Label>
        <Textarea id="c-notes" rows={3} class="min-h-0 resize-y" maxlength={5000} placeholder="Add notes" bind:value={form.notes} />
      </div>

      {#if isNew}
        <section class="mt-5 border-t border-rule pt-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <Label for="c-portal" class="text-sm font-semibold text-ink">Portal access</Label>
              <p class="text-xs text-muted-foreground">Let the client sign in as a viewer and follow only their own projects.</p>
            </div>
            <Switch id="c-portal" bind:checked={portal.enabled} />
          </div>
          {#if portal.enabled}
            <div class="mt-3 grid gap-3 rounded-lg bg-paper-2 p-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <Label for="c-login-email" class="text-xs">Login email</Label>
                <Input id="c-login-email" type="email" autocomplete="off" placeholder={form.email || 'name@company.com'} bind:value={portal.email} />
                <p class="text-xs text-muted-foreground">Leave empty to use the contact email.</p>
              </div>
              <div class="space-y-1.5">
                <Label for="c-login-password" class="text-xs">Password</Label>
                <div class="flex gap-1.5">
                  <Input id="c-login-password" class="fig" autocomplete="new-password" minlength={8} required bind:value={portal.password} />
                  <Button variant="outline" size="icon" onclick={() => (portal.password = generatePassword())} aria-label="Generate a new password" title="Generate"><Icon name="refresh" size={14} /></Button>
                </div>
              </div>
            </div>
          {/if}
        </section>
      {/if}
      {#if !isNew && can.edit}<ClientAccess {client} />{/if}
    </form>

    <div class="flex flex-wrap items-center gap-2 border-t border-rule px-6 py-4">
      {#if !isNew}
        {#if projectCount}
          <span class="text-xs text-muted-foreground">Has <span class="fig">{projectCount}</span> project(s), so it can't be deleted.</span>
        {:else}
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" class="text-error hover:text-error"><Icon name="trash" size={16} /> Delete</Button>
              {/snippet}
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Delete this client?</AlertDialog.Title>
                <AlertDialog.Description>“{client.name}” and its contact details will be removed. This can't be undone.</AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Keep</AlertDialog.Cancel>
                <AlertDialog.Action class="bg-error text-white hover:bg-error/90" onclick={remove}>Delete</AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        {/if}
      {/if}
      <div class="ml-auto flex gap-2">
        <Button variant="outline" onclick={onclose}>Cancel</Button>
        <Button type="submit" form="client-form" class="min-w-20" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create' : 'Save'}</Button>
      </div>
    </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
