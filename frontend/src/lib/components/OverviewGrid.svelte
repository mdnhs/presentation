<script>
  // The "presentation" content, WorkHub layout: the next deadline, a month of deliveries and the
  // project table on the left; stats, status and the completion trend on the right.
  // Used by the overview page, presentation mode and the read-only share view.
  import { data } from '../stores/data.svelte.js'
  import { ui } from '../stores/ui.svelte.js'
  import { can } from '../stores/auth.svelte.js'
  import { byStatus, completionTrend, kpis } from '../metrics.js'
  import ChartCard from './ChartCard.svelte'
  import FeaturedProject from './FeaturedProject.svelte'
  import MonthStrip from './MonthStrip.svelte'
  import ProjectPanel from './ProjectPanel.svelte'
  import ProjectTable from './ProjectTable.svelte'
  import StatTiles from './StatTiles.svelte'
  import StatusDonut from '../charts/StatusDonut.svelte'
  import TrendChart from '../charts/TrendChart.svelte'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'

  /** fill: stretch to the parent's height (presentation mode's fixed 16:9 stage) */
  let { fill = false } = $props()

  let trendMode = $state('cumulative')
  let editing = $state(null)

  const k = $derived(kpis(data.projects, data.statuses, data.activity))
  const doneColor = $derived(data.sortedStatuses.find((s) => s.is_done)?.color || '#6DAE91')
  const trend = $derived(completionTrend(data.activity, 12))
  const trendTotal = $derived(trend.perWeek.reduce((a, b) => a + b, 0))
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const stats = $derived([
    { label: 'Total projects', value: k.total, hint: `${data.clients.length} clients, ${k.inProgress} active`, icon: 'folder', tone: 'muted' },
    { label: 'Completed this month', value: k.completedThisMonth, hint: `${k.done} delivered in all`, icon: 'check', tone: 'up' },
    { label: 'Average progress', value: `${k.avgProgress}%`, hint: `${k.completionPct}% fully complete`, icon: 'trend', tone: 'up' },
    { label: 'Overdue', value: k.overdue, hint: k.overdue ? 'Past their due date' : 'All on schedule', icon: 'alert', tone: k.overdue ? 'warn' : 'up' },
  ])
  const open = (p) => (editing = p)
</script>

{#if data.loading}
  <div class="grid gap-5 xl:grid-cols-12">
    <div class="space-y-5 xl:col-span-8">
      <Card.Root class="card rounded-card block gap-0 py-0 ring-0 h-52 p-5"><Skeleton class="h-full rounded-input bg-paper-3" /></Card.Root>
      <Card.Root class="card rounded-card block gap-0 py-0 ring-0 h-36 p-5"><Skeleton class="h-full rounded-input bg-paper-3" /></Card.Root>
      <Card.Root class="card rounded-card block gap-0 py-0 ring-0 h-80 p-5"><Skeleton class="h-full rounded-input bg-paper-3" /></Card.Root>
    </div>
    <div class="space-y-5 xl:col-span-4">
      <Card.Root class="card rounded-card block gap-0 py-0 ring-0 h-72 p-5"><Skeleton class="h-full rounded-input bg-paper-3" /></Card.Root>
      <Card.Root class="card rounded-card block gap-0 py-0 ring-0 h-64 p-5"><Skeleton class="h-full rounded-input bg-paper-3" /></Card.Root>
    </div>
  </div>
{:else}
  <!-- The 16:9 stage is always 1920px wide, so fill mode can't rely on viewport breakpoints. -->
  <div class="grid gap-5 {fill ? 'h-full grid-cols-12' : 'xl:grid-cols-12'}">
    <div class="flex min-w-0 flex-col gap-5 {fill ? 'col-span-8 min-h-0' : 'xl:col-span-8'}">
      <FeaturedProject onopen={can.edit ? open : null} />

      <ChartCard title="Deliveries in {monthName}" subtitle="Each day of the month: what was completed, what is due" class="shrink-0">
        <MonthStrip onopen={can.edit ? open : null} />
      </ChartCard>

      <!-- The last card in each column grows, so both columns end on the same line. -->
      <ChartCard title="Projects" subtitle="Sorted by due date" class="flex-1 {fill ? 'min-h-0 overflow-hidden' : ''}">
        <ProjectTable onopen={can.edit ? open : null} {fill} limit={fill ? 5 : 6} />
      </ChartCard>
    </div>

    <div class="flex min-w-0 flex-col gap-5 {fill ? 'col-span-4 min-h-0' : 'xl:col-span-4'}">
      <ChartCard title="At a glance" class="shrink-0">
        <StatTiles {stats} />
      </ChartCard>

      <ChartCard title="Projects by status" subtitle="{k.done} of {k.total} complete ({k.completionPct}%)" class="shrink-0">
        <StatusDonut rows={byStatus(data.projects, data.sortedStatuses)} fill />
      </ChartCard>

      <ChartCard title="Completed projects" subtitle="{trendTotal} delivered in the last 12 weeks" class="flex-1 {fill ? 'min-h-0' : ''}">
        {#snippet actions()}
          {#if !ui.readonly}
          <ToggleGroup.Root type="single" spacing={1} value={trendMode} onValueChange={(v) => v && (trendMode = v)} class="rounded-input bg-cotton p-1 shadow-groove" aria-label="Trend">
            {#each [['cumulative', 'Total'], ['weekly', 'Weekly']] as [value, label] (value)}
              <ToggleGroup.Item
                {value}
                class="h-6 min-w-0 flex-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-ink data-[state=on]:bg-mint data-[state=on]:text-brand-2"
              >{label}</ToggleGroup.Item>
            {/each}
          </ToggleGroup.Root>
          {/if}
        {/snippet}
        {#key trendMode}
          <TrendChart {trend} mode={trendMode} color={doneColor} />
        {/key}
      </ChartCard>
    </div>
  </div>
{/if}

{#if editing}
  <ProjectPanel project={editing} onclose={() => (editing = null)} />
{/if}
