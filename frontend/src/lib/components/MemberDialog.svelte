<script>
  // Add a team member (name, email, role, password) or edit one (name, email, role).
  // After adding, shows the sign-in details once so the admin can copy and share them.
  import { pb } from '../pb.js'
  import { auth } from '../stores/auth.svelte.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import { ROLE_INFO, generatePassword } from '../roles.js'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'

  /** member: the user record to edit, or null to add someone */
  let { member = null, onclose, onsaved } = $props()

  const isNew = !member
  const self = member?.id === auth.user?.id

  let form = $state({ name: member?.name ?? '', email: member?.email ?? '', role: member?.role ?? 'editor', password: generatePassword() })
  let showPassword = $state(true)
  let busy = $state(false)
  let created = $state(null) // { email, password } after adding

  async function save(e) {
    e.preventDefault()
    busy = true
    try {
      const body = { name: form.name.trim(), email: form.email.trim(), ...(self ? {} : { role: form.role }) }
      if (isNew) {
        await pb.collection('users').create({ ...body, password: form.password, passwordConfirm: form.password, verified: true })
        created = { email: body.email, password: form.password }
      } else {
        await pb.collection('users').update(member.id, body)
        toast(`${body.name || body.email} updated`)
      }
      onsaved?.()
      if (!isNew) onclose()
    } catch (err) {
      toastError(err, isNew ? 'Could not add this member. Is the email already in use?' : 'Could not save the changes.')
    } finally {
      busy = false
    }
  }

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${what} copied`)
    } catch (_) {
      toastError(null, 'Could not copy. Select the text and copy it manually.')
    }
  }

  const signIn = $derived(created ? `Sign in at ${location.origin}${location.pathname}\nEmail: ${created.email}\nPassword: ${created.password}` : '')
</script>

<Dialog.Root open onOpenChange={(o) => !o && onclose()}>
  <Dialog.Content showCloseButton={false} class="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl bg-cotton p-0 shadow-panel ring-0 sm:max-w-lg">
    <Dialog.Header class="flex-row items-center justify-between px-6 pt-5 pb-1">
      <Dialog.Title class="text-base font-semibold text-ink">{created ? 'Member added' : isNew ? 'Add member' : 'Edit member'}</Dialog.Title>
      <Button variant="ghost" size="icon-sm" class="text-muted-foreground" onclick={onclose} aria-label="Close"><Icon name="x" size={16} /></Button>
    </Dialog.Header>

    {#if created}
      <div class="px-6 py-4">
        <div class="flex items-start gap-3 rounded-xl bg-mint p-4 text-sm text-ink-2">
          <Icon name="check" size={18} class="mt-0.5 shrink-0 text-brand-2" />
          <p>{created.email} can now sign in. This password is shown only once: copy it and share it privately.</p>
        </div>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex items-center gap-3 rounded-lg bg-paper-2 px-3 py-2">
            <dt class="w-20 text-muted-foreground">Email</dt><dd class="min-w-0 flex-1 truncate font-medium text-ink">{created.email}</dd>
            <Button variant="ghost" size="icon-sm" onclick={() => copy(created.email, 'Email')} aria-label="Copy email"><Icon name="copy" size={14} /></Button>
          </div>
          <div class="flex items-center gap-3 rounded-lg bg-paper-2 px-3 py-2">
            <dt class="w-20 text-muted-foreground">Password</dt><dd class="fig min-w-0 flex-1 truncate font-medium text-ink">{created.password}</dd>
            <Button variant="ghost" size="icon-sm" onclick={() => copy(created.password, 'Password')} aria-label="Copy password"><Icon name="copy" size={14} /></Button>
          </div>
        </dl>
      </div>
      <div class="flex justify-end gap-2 border-t border-rule px-6 py-4">
        <Button variant="outline" onclick={() => copy(signIn, 'Sign-in details')}><Icon name="copy" size={15} /> Copy all</Button>
        <Button onclick={onclose}>Done</Button>
      </div>
    {:else}
      <form id="member-form" onsubmit={save} class="space-y-4 px-6 py-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <Label class="mb-1.5 text-ink-2" for="m-name">Full name</Label>
            <Input id="m-name" name="name" autocomplete="off" maxlength={120} bind:value={form.name} />
          </div>
          <div>
            <Label class="mb-1.5 text-ink-2" for="m-email">Email</Label>
            <Input id="m-email" name="email" type="email" autocomplete="off" required bind:value={form.email} />
          </div>
        </div>

        <fieldset>
          <legend class="mb-1.5 block text-sm font-medium text-ink-2">Role</legend>
          {#if self}<p class="mb-2 text-xs text-muted-foreground">You cannot change your own role.</p>{/if}
          <RadioGroup.Root bind:value={form.role} disabled={self} name="role" class="grid gap-2 sm:grid-cols-3">
            {#each Object.entries(ROLE_INFO) as [value, info] (value)}
              <label
                class="relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors duration-150
                  has-focus-visible:outline-2 has-focus-visible:outline-focus
                  {form.role === value ? 'border-brand bg-mint/50' : 'border-rule hover:border-rule-2'}
                  {self ? 'pointer-events-none opacity-60' : ''}"
              >
                <span class="flex items-center justify-between text-sm font-semibold text-ink">
                  {info.label}
                  <RadioGroup.Item {value} class="focus-visible:ring-0" aria-label={info.label} />
                </span>
                <span class="text-xs leading-snug text-muted-foreground">{info.about}</span>
              </label>
            {/each}
          </RadioGroup.Root>
        </fieldset>

        {#if isNew}
          <div>
            <Label class="mb-1.5 text-ink-2" for="m-password">Password</Label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <Input id="m-password" class="fig pr-9" name="password" type={showPassword ? 'text' : 'password'} autocomplete="new-password" minlength={8} required bind:value={form.password} />
                <Button variant="ghost" size="icon-sm" class="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:bg-transparent" onclick={() => (showPassword = !showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={15} />
                </Button>
              </div>
              <Button variant="outline" onclick={() => (form.password = generatePassword())} title="Generate a new password"><Icon name="refresh" size={14} /> Generate</Button>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">At least 8 characters. You can copy it on the next screen.</p>
          </div>
        {/if}
      </form>
      <div class="flex justify-end gap-2 border-t border-rule px-6 py-4">
        <Button variant="outline" onclick={onclose}>Cancel</Button>
        <Button type="submit" form="member-form" class="min-w-28" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add member' : 'Save changes'}</Button>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
