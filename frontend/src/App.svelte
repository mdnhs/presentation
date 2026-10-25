<script>
  import { auth, can } from './lib/stores/auth.svelte.js'
  import { data } from './lib/stores/data.svelte.js'
  import { support } from './lib/stores/support.svelte.js'
  import { ui } from './lib/stores/ui.svelte.js'
  import { route } from './lib/router.svelte.js'
  import { setShareToken } from './lib/pb.js'
  import TopNav from './lib/components/TopNav.svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import ProjectPanel from './lib/components/ProjectPanel.svelte'
  import Toasts from './lib/components/Toasts.svelte'
  import Login from './pages/Login.svelte'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import { Button } from '$lib/components/ui/button/index.js'

  // Pages are code-split; charts (ApexCharts) only load when a chart view opens.
  const PAGES = {
    '/': () => import('./pages/Overview.svelte'),
    '/board': () => import('./pages/Board.svelte'),
    '/list': () => import('./pages/List.svelte'),
    '/clients': () => import('./pages/Clients.svelte'),
    '/team': () => import('./pages/Team.svelte'),
    '/account': () => import('./pages/Account.svelte'),
    '/support': () => import('./pages/Support.svelte'),
    '/settings': () => import('./pages/Settings.svelte'),
    '/share': () => import('./pages/Share.svelte'),
  }
  const loadPresentation = () => import('./lib/components/Presentation.svelte')

  const isShare = $derived(route.path === '/share')
  const pagePromise = $derived((PAGES[route.path] ?? PAGES['/'])())

  // The mobile sidebar sheet closes once a link in it navigates.
  $effect(() => {
    route.path
    route.query
    ui.navOpen = false
  })

  // Share view: anonymous, token-scoped reads. Otherwise: the logged-in admin.
  $effect(() => {
    ui.share = isShare
    setShareToken(isShare ? route.query.token : '')
    if (isShare || auth.isValid) data.start()
    return () => data.stop()
  })

  // Support tickets (and their unread badge) for signed-in users; never in the anonymous share view.
  $effect(() => {
    if (isShare || !auth.isValid) return
    support.start()
    return () => support.stop()
  })
</script>

<Tooltip.Provider delayDuration={150}>
{#if ui.presenting}
  {#await loadPresentation() then mod}
    <mod.default />
  {/await}
{:else if isShare}
  {#await pagePromise then mod}
    <mod.default />
  {/await}
{:else if !auth.isValid}
  <Login />
{:else}
  <!-- App shell: the window never scrolls; only the main panel's content does, so the sidebar and top bar stay put. -->
  <div class="flex h-dvh gap-4 overflow-hidden p-2 sm:p-4">
    <Sidebar />
    <!-- Under lg the sidebar opens from the left as a sheet (TopNav's menu button). -->
    <Sheet.Root bind:open={ui.navOpen}>
      <Sheet.Content side="left" class="gap-0 border-0 p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw] data-[side=left]:sm:max-w-72">
        <Sheet.Title class="sr-only">Navigation</Sheet.Title>
        <Sidebar sheet />
      </Sheet.Content>
    </Sheet.Root>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-paper/85 shadow-float backdrop-blur-sm">
      <TopNav />
      <main class="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {#if data.error}
          <div class="px-[var(--gutter)] pt-5">
            <div class="flex items-center gap-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
              {data.error} <Button variant="link" class="ml-auto h-auto p-0 text-error" onclick={() => data.start()}>Retry</Button>
            </div>
          </div>
        {/if}
        {#await pagePromise then mod}
          <mod.default />
        {/await}
      </main>
    </div>
  </div>
  {#if ui.creating && can.edit}
    <ProjectPanel project={{ status: data.sortedStatuses[0]?.id, progress: 0 }} onclose={() => (ui.creating = false)} />
  {/if}
{/if}

<Toasts />
</Tooltip.Provider>
