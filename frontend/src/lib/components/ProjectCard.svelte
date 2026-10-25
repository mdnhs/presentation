<script>
  import { data } from '../stores/data.svelte.js'
  import { formatDate, isOverdue } from '../utils.js'
  import PriorityBadge from './PriorityBadge.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import Icon from './Icon.svelte'
  import { cn } from '$lib/cn.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'

  // rest: extra attributes and attachments for the button (the board passes its dnd-kit sortable here)
  let { project, onopen, class: cls = '', ...rest } = $props()

  const status = $derived(data.statusById[project.status])
  const overdue = $derived(isOverdue(project, data.statusById))
</script>

<!-- shadcn Button, reset to a plain card: no nowrap/centering, and no press nudge or transition-all
     (dnd-kit moves this element with transforms while dragging). -->
<Button
  {...rest}
  variant="ghost"
  onclick={() => onopen?.(project)}
  class={cn(
    'block h-auto w-full rounded-xl border-0 bg-cotton p-3.5 ring-1 ring-rule text-left font-normal whitespace-normal shadow-card transition-shadow duration-150 hover:bg-cotton hover:shadow-lift active:not-aria-[haspopup]:translate-y-0',
    cls,
  )}
>
  <div class="flex items-start gap-2">
    <h3 class="min-w-0 flex-1 text-sm leading-snug font-semibold text-ink">{project.name}</h3>
    {#if project.color}
      <span class="mt-1 size-2.5 shrink-0 rounded-[3px]" style="background: {project.color}" aria-hidden="true"></span>
    {/if}
  </div>

  <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
    <PriorityBadge priority={project.priority} />
    {#if project.due_date}
      <Badge variant="secondary" class="h-6 gap-1.5 rounded-md bg-paper-2 px-2 shadow-groove {overdue ? 'text-error' : 'text-muted-foreground'}">
        <Icon name="calendar" size={12} />
        <span class="fig">{formatDate(project.due_date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </Badge>
    {/if}
  </div>

  <div class="mt-3 border-t border-dashed border-rule pt-3">
    {#if project.client}<p class="truncate text-sm text-ink-2">{project.client}</p>{/if}
    <div class="mt-2"><ProgressBar value={project.progress} color={status?.color} showLabel={false} /></div>
    <div class="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
      <span>Progress : <span class="fig">{project.progress || 0}%</span></span>
      {#if overdue}<span class="font-medium text-error">Overdue</span>{/if}
    </div>
  </div>
</Button>
