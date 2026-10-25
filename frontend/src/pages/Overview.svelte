<script>
  import { data } from '../lib/stores/data.svelte.js'
  import { ui } from '../lib/stores/ui.svelte.js'
  import { can } from '../lib/stores/auth.svelte.js'
  import { support } from '../lib/stores/support.svelte.js'
  import OverviewGrid from '../lib/components/OverviewGrid.svelte'
  import Icon from '../lib/components/Icon.svelte'
  import { Button } from '$lib/components/ui/button/index.js'

  const now = new Date()
  const today = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
</script>

<div class="p-[var(--gutter)]">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] leading-tight font-semibold text-ink">{greeting}!</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Here is where your projects stand today.
        {#if support.openCount}
          <a href="#/support" class="ml-1 inline-flex items-center gap-1 font-medium text-brand-2 hover:underline">
            <Icon name="support" size={13} /> {support.openCount} open ticket{support.openCount === 1 ? '' : 's'}{#if support.unreadCount}, {support.unreadCount} unread{/if}
          </a>
        {/if}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <span class="inline-flex h-10 items-center gap-2 rounded-full bg-cotton px-4 text-sm font-medium text-ink-2 shadow-stock">
        <Icon name="calendar" size={15} class="text-muted-foreground" /> <time>{today}</time>
      </span>
      {#if can.edit}
        <Button class="h-10 rounded-full px-4" onclick={() => (ui.creating = true)} disabled={!data.sortedStatuses.length}>
          <Icon name="plus" size={16} /> New project
        </Button>
      {/if}
    </div>
  </div>
  <OverviewGrid />
</div>
