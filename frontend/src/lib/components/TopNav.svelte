<script>
  // Top bar of the main panel: search, presentation, the signed-in user. Under lg it opens the sidebar sheet.
  import { auth, can } from '../stores/auth.svelte.js'
  import { navigate } from '../router.svelte.js'
  import { ui, toggleSidebar } from '../stores/ui.svelte.js'
  import Icon from './Icon.svelte'
  import { MOD_KEY, onSearchKey } from '../shortcuts.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let q = $state('')

  // Search hands the query to the Projects list, which filters by name and client.
  function search(e) {
    e.preventDefault()
    navigate(`/list?q=${encodeURIComponent(q.trim())}`)
  }

  const email = $derived(auth.user?.email ?? '')
  const name = $derived(auth.user?.name || email.split('@')[0] || 'Admin')
  const initials = $derived(name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''))
</script>

<svelte:window onkeydown={onSearchKey} />

<header class="z-[var(--z-sticky-nav)] flex h-16 shrink-0 items-center gap-3 border-b border-rule bg-paper/90 px-[var(--gutter)]">
  <!-- Mobile: the sidebar lives in a left sheet (App.svelte) -->
  <Button
    variant="ghost"
    size="icon-lg"
    class="shrink-0 rounded-full text-muted-foreground shadow-stock hover:bg-paper-2 hover:text-ink lg:hidden"
    onclick={() => (ui.navOpen = true)}
    aria-expanded={ui.navOpen}
    aria-label="Open menu"
  >
    <Icon name="menu" size={18} />
  </Button>

  <!-- Sidebar collapse (desktop only — the sidebar is hidden under lg) -->
  <Button
    variant="ghost"
    size="icon-lg"
    class="hidden shrink-0 rounded-full text-muted-foreground shadow-stock hover:bg-paper-2 hover:text-ink lg:inline-flex"
    onclick={toggleSidebar}
    aria-expanded={!ui.collapsed}
    aria-label={ui.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    title={ui.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    <Icon name="panel" size={17} />
  </Button>

  <form class="relative hidden w-full max-w-xs md:block" onsubmit={search} role="search">
    <Icon name="search" size={16} class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
    <Input class="peer h-10 rounded-full border-rule bg-paper-2 pr-4 pl-10 text-ink sm:pr-14" type="search" placeholder="Search projects or clients…" aria-label="Search projects or clients" aria-keyshortcuts={MOD_KEY === '⌘K' ? 'Meta+K' : 'Control+K'} data-search="global" bind:value={q} />
    <kbd class="kbd-hint right-3">{MOD_KEY}</kbd>
  </form>

  <div class="ml-auto flex items-center gap-2">
    <Button variant="outline" class="hidden h-10 rounded-full border-transparent bg-cotton px-4 text-ink-2 md:inline-flex shadow-stock hover:bg-paper-2 hover:text-ink" onclick={() => (ui.presenting = true)} title="Presentation mode (Esc to exit)">
      <Icon name="present" size={16} /> <span class="hidden sm:inline">Present</span>
    </Button>
    <!-- Just the avatar; name, role and email show in its tooltip. -->
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <a
            {...props}
            href="#/account"
            class="flex items-center rounded-full hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus md:ml-1 md:border-l md:border-rule md:pl-4 md:rounded-none"
            aria-label="My account: {name}, {can.role}"
          >
            <span class="grid size-10 place-items-center rounded-full bg-mint text-sm font-semibold text-brand-2" aria-hidden="true">{initials}</span>
          </a>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom" align="end" sideOffset={8} class="flex-col items-start gap-0.5 px-3 py-2">
        <span class="flex items-center gap-1.5 font-semibold">{name}<Badge variant="secondary" class="h-auto rounded-md bg-mint px-1.5 py-px text-[10px] font-semibold text-brand-2 capitalize">{can.role}</Badge></span>
        <span class="opacity-75">{email}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
</header>
