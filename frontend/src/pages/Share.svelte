<script>
  // Read-only client view: /#/share?token=...
  import { pb } from '../lib/pb.js'
  import { data } from '../lib/stores/data.svelte.js'
  import { ui } from '../lib/stores/ui.svelte.js'
  import { theme, toggleTheme } from '../lib/stores/theme.svelte.js'
  import OverviewGrid from '../lib/components/OverviewGrid.svelte'
  import Icon from '../lib/components/Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'

  const logoUrl = $derived(data.settings?.logo ? pb.files.getURL(data.settings, data.settings.logo, { thumb: '0x120' }) : '')
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  // Rules return no settings row for a wrong/revoked token (lists come back empty, not 403).
  const invalid = $derived(!data.loading && !data.error && !data.settings)
</script>

{#if invalid}
  <div class="grid min-h-dvh place-items-center px-6 text-center">
    <Card.Root class="block max-w-md gap-0 rounded-card p-10 shadow-card ring-0">
      <div class="mx-auto mb-4 grid size-12 place-items-center rounded-stock bg-paper-2 text-muted-foreground shadow-groove">
        <Icon name="link" size={22} />
      </div>
      <h1 class="mx-auto text-xl font-semibold text-ink">This link is unavailable</h1>
      <p class="mx-auto mt-2 text-sm text-muted-foreground">It may have been turned off or replaced. Please ask your project contact for a new link.</p>
    </Card.Root>
  </div>
{:else}
  <div class="mx-auto max-w-[var(--container)] px-[var(--gutter)] py-8">
    <header class="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule pb-6">
      {#if logoUrl}<img src={logoUrl} alt="" class="h-10 w-auto max-w-48 object-contain" />{/if}
      <div class="min-w-0">
        <h1 class="max-w-none truncate text-2xl font-semibold text-ink">
          {data.settings?.dashboard_title || 'Project Progress'}
        </h1>
        <p class="mt-0.5 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          {#if data.settings?.company_name}<span>{data.settings.company_name}</span>{/if}
          <time>{today}</time>
        </p>
      </div>
      <div class="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" class="text-muted-foreground" onclick={toggleTheme} title="Toggle light/dark theme" aria-label="Toggle light/dark theme">
          <Icon name={theme.mode === 'dark' ? 'sun' : 'moon'} size={17} />
        </Button>
        <Button variant="outline" class="hidden md:inline-flex" onclick={() => (ui.presenting = true)} title="Full-screen presentation">
          <Icon name="present" size={16} /> Present
        </Button>
      </div>
    </header>
    <OverviewGrid />
  </div>
{/if}

<style>
  h1 { overflow-wrap: break-word; min-width: 0; text-wrap: balance; }
</style>
