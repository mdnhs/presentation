<script>
  import { pb } from '../lib/pb.js'
  import { data } from '../lib/stores/data.svelte.js'
  import { toast, toastError } from '../lib/stores/toast.svelte.js'
  import { randomToken } from '../lib/utils.js'
  import StatusManager from '../lib/components/StatusManager.svelte'
  import { can } from '../lib/stores/auth.svelte.js'
  import Icon from '../lib/components/Icon.svelte'
  import VerticalTabs from '../lib/components/VerticalTabs.svelte'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import SkSettings from '$lib/components/skeletons/SkSettings.svelte'

  // shadcn Card without its own padding/ring, so it keeps the app's card look.
  const CARD = 'gap-0 overflow-visible rounded-card py-0 shadow-card ring-0'

  // Left-hand tabs, one per section.
  const TABS = [
    { id: 'statuses', label: 'Workflow statuses', icon: 'kanban' },
    { id: 'branding', label: 'Branding', icon: 'palette' },
    { id: 'share', label: 'Client share link', icon: 'link' },
  ]
  let tab = $state('statuses')

  let title = $state('')
  let company = $state('')
  let savingBrand = $state(false)

  // Fill the form once settings arrive (and when they change elsewhere).
  $effect(() => {
    title = data.settings?.dashboard_title ?? ''
    company = data.settings?.company_name ?? ''
  })

  const logoUrl = $derived(data.settings?.logo ? pb.files.getURL(data.settings, data.settings.logo, { thumb: '0x120' }) : '')
  const shareUrl = $derived(
    data.settings?.share_token ? `${location.origin}${location.pathname}#/share?token=${data.settings.share_token}` : '',
  )

  async function saveBranding(e) {
    e.preventDefault()
    savingBrand = true
    try {
      await data.updateSettings({ dashboard_title: title.trim(), company_name: company.trim() })
      toast('Branding saved')
    } catch (err) {
      toastError(err)
    } finally {
      savingBrand = false
    }
  }

  async function uploadLogo(e) {
    const file = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    try {
      await data.updateSettings({ logo: file })
      toast('Logo updated')
    } catch (err) {
      toastError(err, 'Logo upload failed (PNG/JPG/SVG/WebP, max 2 MB).')
    }
  }

  async function removeLogo() {
    try {
      await data.updateSettings({ logo: null })
      toast('Logo removed')
    } catch (err) {
      toastError(err)
    }
  }

  async function toggleShare() {
    const enable = !data.settings.share_enabled
    try {
      await data.updateSettings({
        share_enabled: enable,
        // First time on: create a token.
        ...(enable && !data.settings.share_token ? { share_token: randomToken() } : {}),
      })
      toast(enable ? 'Share link enabled' : 'Share link disabled')
    } catch (err) {
      toastError(err)
    }
  }

  async function regenerate() {
    try {
      await data.updateSettings({ share_token: randomToken() })
      toast('New link created. The old one no longer works.')
    } catch (err) {
      toastError(err)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast('Link copied')
    } catch (_) {
      toastError(null, 'Could not copy. Select the link and copy it manually.')
    }
  }
</script>

<div class="max-w-5xl p-[var(--gutter)]">
  <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">Settings</h1>
  <p class="mt-1 text-sm text-muted-foreground">Workflow, branding and the client share link.</p>

  {#if !can.admin}
    <Card.Root class="{CARD} mt-6 flex-row items-center gap-3 p-6 text-sm text-ink-2">
      <Icon name="alert" size={18} class="shrink-0 text-muted-foreground" />
      Only admins can change settings. Ask an admin if something here needs updating.
    </Card.Root>
  {:else if data.loading || !data.settings}
    <div class="mt-6"><SkSettings /></div>
  {:else}
    <div class="mt-6">
    <VerticalTabs tabs={TABS} bind:value={tab} id="settings" label="Settings sections">
    {#if tab === 'statuses'}
    <section class="space-y-5">
      <div>
        <h2 class="text-md font-semibold text-ink">Workflow statuses</h2>
        <p class="mt-1 text-sm text-muted-foreground">These become the board columns and drive every chart color. Drag to reorder.</p>
      </div>
      <div class="min-w-0"><StatusManager /></div>
    </section>

    {:else if tab === 'branding'}
    <section class="space-y-5">
      <div>
        <h2 class="text-md font-semibold text-ink">Branding</h2>
        <p class="mt-1 text-sm text-muted-foreground">Shown in the header, presentation mode and the client view.</p>
      </div>

      <Card.Root class={CARD}>
      <form onsubmit={saveBranding} class="grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <Label class="mb-1.5 leading-5 text-ink-2" for="s-title">Dashboard title</Label>
          <Input id="s-title" name="dashboard_title" maxlength={120} bind:value={title} placeholder="Project Progress" />
        </div>
        <div>
          <Label class="mb-1.5 leading-5 text-ink-2" for="s-company">Company name</Label>
          <Input id="s-company" name="company_name" maxlength={120} autocomplete="organization" bind:value={company} />
        </div>
        <div class="sm:col-span-2">
          <span class="mb-1.5 block text-sm font-medium text-ink-2">Logo</span>
          <div class="flex flex-wrap items-center gap-3">
            <div class="grid h-16 w-40 place-items-center overflow-hidden rounded-stock border border-dashed border-rule-2 bg-paper">
              {#if logoUrl}
                <img src={logoUrl} alt="Logo" class="max-h-12 max-w-36 object-contain" />
              {:else}
                <span class="text-sm text-muted-foreground">No logo</span>
              {/if}
            </div>
            <label class="{buttonVariants({ variant: 'outline' })} cursor-pointer focus-within:ring-3 focus-within:ring-ring/50">
              Upload
              <input type="file" class="sr-only" accept="image/png,image/jpeg,image/svg+xml,image/webp" onchange={uploadLogo} />
            </label>
            {#if logoUrl}<Button variant="ghost" class="text-muted-foreground hover:text-error" onclick={removeLogo}>Remove</Button>{/if}
          </div>
          <p class="mt-2 text-sm text-muted-foreground">PNG, JPG, SVG or WebP, up to 2 MB. A wide logo on a transparent background works best.</p>
        </div>
        <div class="border-t border-rule pt-5 sm:col-span-2">
          <Button type="submit" disabled={savingBrand}>{savingBrand ? 'Saving…' : 'Save branding'}</Button>
        </div>
      </form>
      </Card.Root>
    </section>

    {:else}
    <section class="space-y-5">
      <div>
        <h2 class="text-md font-semibold text-ink">Client share link</h2>
        <p class="mt-1 text-sm text-muted-foreground">A read-only view of the overview. No login, no editing, and you can turn it off any time.</p>
      </div>

      <Card.Root class="{CARD} p-5">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm font-medium text-ink" id="share-label">{data.settings.share_enabled ? 'Sharing is on' : 'Sharing is off'}</span>
          <Switch checked={data.settings.share_enabled} onCheckedChange={toggleShare} aria-label="Enable share link" />
        </div>

        {#if data.settings.share_enabled && shareUrl}
          <div class="mt-5 flex flex-wrap items-center gap-2">
            <div class="relative min-w-0 flex-1">
              <Icon name="link" size={15} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input class="fig bg-paper pl-9 text-ink-2" readonly value={shareUrl} aria-label="Share link" onfocus={(e) => e.currentTarget.select()} />
            </div>
            <Button onclick={copyLink}><Icon name="copy" size={15} /> Copy</Button>
            <Button variant="outline" href={shareUrl} target="_blank" rel="noopener">Open</Button>
          </div>
          <Button variant="ghost" class="mt-3 -ml-3 text-muted-foreground" onclick={regenerate}>
            <Icon name="refresh" size={14} /> Regenerate link (revokes the current one)
          </Button>
        {:else}
          <p class="mt-3 text-sm text-muted-foreground">Anyone with an old link sees an “unavailable” page.</p>
        {/if}
      </Card.Root>
    </section>
    {/if}
    </VerticalTabs>
    </div>
  {/if}
</div>
