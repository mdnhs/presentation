<script>
  import { pb } from '../pb.js'
  import { data } from '../stores/data.svelte.js'
  import { support } from '../stores/support.svelte.js'
  import { can, logout } from '../stores/auth.svelte.js'
  import { route } from '../router.svelte.js'
  import { theme, toggleTheme } from '../stores/theme.svelte.js'
  import { ui } from '../stores/ui.svelte.js'
  import { NAV, allowed } from '../nav.js'
  import Icon from './Icon.svelte'
  import Logo from './Logo.svelte'
  import NavTip from './NavTip.svelte'
  import { Button } from '$lib/components/ui/button/index.js'

  /** sheet: rendered inside the mobile Sheet — always expanded, fills the sheet, no floating panel */
  let { sheet = false } = $props()

  const logoUrl = $derived(data.settings?.logo ? pb.files.getURL(data.settings, data.settings.logo, { thumb: '0x80' }) : '')
  const countFor = (id) => data.projects.filter((p) => p.status === id).length
  const MAIN = $derived(NAV.filter((n) => n.path !== '/settings' && allowed(n, can)))

  const collapsed = $derived(!sheet && ui.collapsed)

  const themeLabel = $derived(theme.mode === 'dark' ? 'Light mode' : 'Dark mode')

  const itemClass = (active) =>
    `flex h-10 w-full items-center gap-3 rounded-[10px] text-sm font-medium transition-colors duration-150 ${
      collapsed ? 'justify-center px-0' : 'justify-start px-3'
    } ${active ? 'bg-mint text-brand-2 font-semibold' : 'text-ink-2 hover:bg-paper-2 hover:text-ink'}`
</script>

<aside
  class={sheet
    ? 'flex h-full w-full flex-col bg-cotton'
    : `hidden h-full shrink-0 flex-col rounded-[20px] bg-cotton shadow-float transition-[width] duration-200 lg:flex ${collapsed ? 'w-[72px]' : 'w-60'}`}
>
  <div class="flex h-[72px] shrink-0 items-center gap-3 {collapsed ? 'justify-center px-2' : 'px-5'}">
    {#if logoUrl}
      <img src={logoUrl} alt="" class="h-10 w-auto object-contain {collapsed ? 'max-w-12' : 'max-w-32'}" />
    {:else}
      <Logo size={40} />
    {/if}
    {#if !collapsed}
      <a href="#/" class="min-w-0" aria-label="Home">
        <span class="block truncate text-[15px] leading-tight font-semibold text-ink">{data.settings?.dashboard_title || 'Project Progress'}</span>
        {#if data.settings?.company_name}<span class="block truncate text-[11px] text-muted-foreground">{data.settings.company_name}</span>{/if}
      </a>
    {/if}
  </div>

  <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto px-3 pt-2 pb-4">
    <div>
      {#if !collapsed}<p class="mb-2 px-3 text-[11px] font-medium text-muted-foreground">Main</p>{/if}
      <nav class="flex flex-col gap-1" aria-label="Main">
        {#each MAIN as n (n.path)}
          {@const active = route.path === n.path && !(n.path === '/list' && route.query.status)}
          <NavTip label={collapsed ? n.label : ''}>
            {#snippet item(props)}
              <a {...props} href="#{n.path}" aria-current={active ? 'page' : undefined} class={itemClass(active)} aria-label={collapsed ? n.label : undefined}>
                <Icon name={n.icon} size={18} />
                {#if !collapsed}
                  {n.label}
                  {#if n.path === '/support' && support.unreadCount}
                    <span class="fig ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-ink" title="Unread replies">{support.unreadCount}</span>
                  {/if}
                  {#if n.path === '/list' && data.projects.length}
                    <span class="fig ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold {active ? 'bg-cotton text-brand-2' : 'bg-mint text-brand-2'}">{data.projects.length}</span>
                  {/if}
                {/if}
              </a>
            {/snippet}
          </NavTip>
        {/each}
      </nav>
    </div>

    {#if data.sortedStatuses.length}
      <div>
        {#if !collapsed}<p class="mb-2 px-3 text-[11px] font-medium text-muted-foreground">Workflow</p>{/if}
        <ul class="flex flex-col gap-1">
          {#each data.sortedStatuses as s (s.id)}
            {@const active = route.path === '/list' && route.query.status === s.id}
            <li>
              <NavTip label={collapsed ? `${s.name} · ${countFor(s.id)}` : ''}>
                {#snippet item(props)}
                  <a
                    {...props}
                    href="#/list?status={encodeURIComponent(s.id)}"
                    aria-current={active ? 'page' : undefined}
                    class="flex h-9 items-center gap-3 rounded-[10px] text-sm {active ? 'bg-mint font-semibold text-ink' : 'text-ink-2 hover:bg-mint hover:text-ink'} {collapsed ? 'justify-center' : 'px-3'}"
                    aria-label={collapsed ? `${s.name}: ${countFor(s.id)}` : undefined}
                  >
                    <span class="size-2.5 shrink-0 rounded-full" style="background: {s.color}" aria-hidden="true"></span>
                    {#if !collapsed}
                      <span class="truncate">{s.name}</span>
                      <span class="fig ml-auto text-xs text-muted-foreground">{countFor(s.id)}</span>
                    {/if}
                  </a>
                {/snippet}
              </NavTip>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <div class="flex shrink-0 flex-col gap-1 border-t border-rule p-3">
    <NavTip label={collapsed ? 'My account' : ''}>
      {#snippet item(props)}
        <a {...props} href="#/account" aria-current={route.path === '/account' ? 'page' : undefined} class={itemClass(route.path === '/account')} aria-label={collapsed ? 'My account' : undefined}>
          <Icon name="user" size={18} />
          {#if !collapsed}My account{/if}
        </a>
      {/snippet}
    </NavTip>
    {#if can.admin}
      <NavTip label={collapsed ? 'Settings' : ''}>
        {#snippet item(props)}
          <a {...props} href="#/settings" aria-current={route.path === '/settings' ? 'page' : undefined} class={itemClass(route.path === '/settings')} aria-label={collapsed ? 'Settings' : undefined}>
            <Icon name="settings" size={18} />
            {#if !collapsed}Settings{/if}
          </a>
        {/snippet}
      </NavTip>
    {/if}
    <NavTip label={collapsed ? themeLabel : ''}>
      {#snippet item(props)}
        <Button {...props} variant="ghost" class={itemClass(false)} onclick={toggleTheme} aria-label={collapsed ? themeLabel : undefined}>
          <Icon name={theme.mode === 'dark' ? 'sun' : 'moon'} size={18} />
          {#if !collapsed}{themeLabel}{/if}
        </Button>
      {/snippet}
    </NavTip>
    <NavTip label={collapsed ? 'Log out' : ''}>
      {#snippet item(props)}
        <Button {...props} variant="ghost" class="{itemClass(false)} text-brand-2 hover:bg-mint hover:text-brand-2" onclick={logout} aria-label={collapsed ? 'Log out' : undefined}>
          <Icon name="logout" size={18} />
          {#if !collapsed}Log out{/if}
        </Button>
      {/snippet}
    </NavTip>
  </div>
</aside>
