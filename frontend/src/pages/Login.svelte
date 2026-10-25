<script>
  import { login } from '../lib/stores/auth.svelte.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Card from '$lib/components/ui/card/index.js'

  let email = $state('')
  let password = $state('')
  let error = $state('')
  let busy = $state(false)

  async function submit(e) {
    e.preventDefault()
    busy = true
    error = ''
    try {
      await login(email, password)
    } catch (err) {
      error = err?.status === 400 ? 'Invalid email or password.' : 'Cannot reach the server.'
    } finally {
      busy = false
    }
  }
</script>

<div class="grid min-h-dvh place-items-center bg-paper px-4">
  <Card.Root class="w-full max-w-sm gap-0 rounded-card py-0 shadow-card ring-0">
  <form onsubmit={submit} class="p-8">
    <div class="mb-7">
      <span class="grid size-10 place-items-center rounded-stock bg-board text-board-type shadow-stock">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 18v-6M12 18V6M18 18v-9" /></svg>
      </span>
      <h1 class="mt-5 text-2xl font-semibold text-ink">Welcome back</h1>
      <p class="mt-1 text-sm text-muted-foreground">Sign in to your dashboard</p>
    </div>

    <Label class="mb-1.5 leading-5 text-ink-2" for="email">Email</Label>
    <Input id="email" name="email" class="mb-4 h-10" type="email" autocomplete="username" required bind:value={email} />

    <Label class="mb-1.5 leading-5 text-ink-2" for="password">Password</Label>
    <Input id="password" name="password" class="mb-5 h-10" type="password" autocomplete="current-password" required bind:value={password} />

    {#if error}
      <p class="mb-4 rounded-input border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">{error}</p>
    {/if}

    <Button type="submit" class="h-10 w-full" disabled={busy}>
      {busy ? 'Signing in…' : 'Sign in'}
    </Button>
  </form>
  </Card.Root>
</div>
