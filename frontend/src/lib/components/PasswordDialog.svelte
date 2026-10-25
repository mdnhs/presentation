<script>
  // Admin sets a new password for a member (allowed by the users manageRule), then can copy it.
  import { pb } from '../pb.js'
  import { toast, toastError } from '../stores/toast.svelte.js'
  import { generatePassword } from '../roles.js'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'

  let { member, onclose } = $props()

  let password = $state(generatePassword())
  let busy = $state(false)
  let done = $state(false)

  async function save(e) {
    e.preventDefault()
    busy = true
    try {
      await pb.collection('users').update(member.id, { password, passwordConfirm: password })
      done = true
    } catch (err) {
      toastError(err, 'Could not set the password (8+ characters).')
    } finally {
      busy = false
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      toast('Password copied')
    } catch (_) {
      toastError(null, 'Could not copy. Select the password and copy it manually.')
    }
  }
</script>

<Dialog.Root open onOpenChange={(o) => !o && onclose()}>
  <Dialog.Content showCloseButton={false} class="gap-0 rounded-2xl bg-cotton p-0 shadow-panel ring-0 sm:max-w-md">
  <form onsubmit={save}>
    <Dialog.Header class="gap-0 px-6 pt-5">
      <Dialog.Title class="text-base font-semibold text-ink">{done ? 'Password updated' : 'Set a new password'}</Dialog.Title>
      <Dialog.Description class="mt-1 text-sm text-muted-foreground">
        {done ? `Share it with ${member.name || member.email} privately. They will need to sign in again with it.` : `For ${member.name || member.email} (${member.email}).`}
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-6 py-4">
      <div class="flex gap-2">
        <Input class="fig flex-1" type="text" autocomplete="new-password" minlength={8} required readonly={done} aria-label="New password" bind:value={password} />
        {#if done}
          <Button variant="outline" onclick={copy}><Icon name="copy" size={14} /> Copy</Button>
        {:else}
          <Button variant="outline" onclick={() => (password = generatePassword())} title="Generate a new password"><Icon name="refresh" size={14} /> Generate</Button>
        {/if}
      </div>
    </div>
    <div class="flex justify-end gap-2 border-t border-rule px-6 py-4">
      {#if done}
        <Button onclick={onclose}>Done</Button>
      {:else}
        <Button variant="outline" onclick={onclose}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Set password'}</Button>
      {/if}
    </div>
  </form>
  </Dialog.Content>
</Dialog.Root>
