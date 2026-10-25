<script>
  // The project with the nearest deadline that is not done yet (overdue ones first), WorkHub's "Featured Project".
  import { data } from '../stores/data.svelte.js'
  import { ui } from '../stores/ui.svelte.js'
  import { formatDate, isOverdue, toDate } from '../utils.js'
  import Icon from './Icon.svelte'
  import ProjectAvatar from './ProjectAvatar.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'

  let { onopen } = $props()

  const project = $derived(
    data.projects
      .filter((p) => p.due_date && !data.statusById[p.status]?.is_done)
      .sort((a, b) => toDate(a.due_date) - toDate(b.due_date))[0],
  )
  const status = $derived(project && data.statusById[project.status])
  const overdue = $derived(project && isOverdue(project, data.statusById))
</script>

{#if project}
  <Card.Root class="relative block shrink-0 gap-0 overflow-hidden rounded-card border border-brand/25 bg-mint p-5 shadow-card ring-0">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Badge variant="secondary" class="h-7 gap-1.5 rounded-full bg-cotton px-3 text-xs font-semibold {overdue ? 'text-error' : 'text-brand-2'}">
        <span class="size-2 rounded-full {overdue ? 'bg-error' : 'bg-brand'}" aria-hidden="true"></span>
        {overdue ? 'Overdue, needs attention' : 'Next deadline'}
      </Badge>
      {#if !ui.readonly}
        <div class="flex items-center gap-2">
          {#if onopen}
            <Button variant="ghost" size="icon" class="rounded-full bg-cotton text-ink-2 shadow-stock hover:bg-cotton hover:text-ink" onclick={() => onopen(project)} aria-label="Edit {project.name}">
              <Icon name="pencil" size={15} />
            </Button>
          {/if}
          <Button href="#/board" class="rounded-full px-4">View board <Icon name="arrow" size={15} /></Button>
        </div>
      {/if}
    </div>

    <div class="mt-4 flex items-center gap-4">
      <ProjectAvatar {project} size={64} />
      <div class="min-w-0">
        <h2 class="truncate text-xl font-semibold text-ink">{project.name}</h2>
        {#if project.client}<p class="truncate text-sm font-medium text-brand-2">{project.client}</p>{/if}
      </div>
    </div>

    <dl class="mt-5 grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:divide-x sm:divide-rule-2">
      <div class="flex items-center gap-2.5 sm:pr-4">
        <Icon name="status" size={17} class="shrink-0 text-muted-foreground" />
        <div class="min-w-0"><dt class="text-xs text-muted-foreground">Status</dt><dd class="truncate text-sm font-semibold text-ink">{status?.name ?? 'None'}</dd></div>
      </div>
      <div class="flex items-center gap-2.5 sm:px-4">
        <Icon name="flag" size={17} class="shrink-0 text-muted-foreground" />
        <div class="min-w-0"><dt class="text-xs text-muted-foreground">Priority</dt><dd class="text-sm font-semibold text-ink capitalize">{project.priority || 'None'}</dd></div>
      </div>
      <div class="flex items-center gap-2.5 sm:px-4">
        <Icon name="calendar" size={17} class="shrink-0 text-muted-foreground" />
        <div class="min-w-0"><dt class="text-xs text-muted-foreground">Due date</dt><dd class="fig text-sm font-semibold {overdue ? 'text-error' : 'text-ink'}">{formatDate(project.due_date, { month: 'short', day: 'numeric', year: 'numeric' })}</dd></div>
      </div>
      <div class="flex items-center gap-2.5 sm:pl-4">
        <Icon name="trend" size={17} class="shrink-0 text-muted-foreground" />
        <div class="min-w-0 flex-1"><dt class="text-xs text-muted-foreground">Progress</dt><dd class="mt-1"><ProgressBar value={project.progress} color="var(--color-brand)" /></dd></div>
      </div>
    </dl>
  </Card.Root>
{/if}
