<script>
  // Sign-in details shown once after a login is created or its password reset, with copy buttons.
  import { toast, toastError } from '../stores/toast.svelte.js'
  import Icon from './Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'

  let { email, password, note = 'This password is shown only once: copy it and share it privately.' } = $props()

  const signIn = $derived(`Sign in at ${location.origin}${location.pathname}\nEmail: ${email}\nPassword: ${password}`)

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${what} copied`)
    } catch (_) {
      toastError(null, 'Could not copy. Select the text and copy it manually.')
    }
  }
</script>

<div class="space-y-2">
  <p class="flex items-start gap-2 rounded-lg bg-mint p-3 text-xs text-ink-2">
    <Icon name="check" size={15} class="mt-px shrink-0 text-brand-2" />{note}
  </p>
  <dl class="space-y-1.5 text-sm">
    {#each [['Email', email], ['Password', password]] as [label, value] (label)}
      <div class="flex items-center gap-3 rounded-lg bg-paper-2 py-1.5 pr-1.5 pl-3">
        <dt class="w-20 shrink-0 text-muted-foreground">{label}</dt>
        <dd class="min-w-0 flex-1 truncate font-medium text-ink {label === 'Password' ? 'fig' : ''}">{value}</dd>
        <Button variant="ghost" size="icon-sm" onclick={() => copy(value, label)} aria-label="Copy {label.toLowerCase()}"><Icon name="copy" size={14} /></Button>
      </div>
    {/each}
  </dl>
  <Button variant="outline" size="sm" onclick={() => copy(signIn, 'Sign-in details')}><Icon name="copy" size={14} /> Copy all</Button>
</div>
