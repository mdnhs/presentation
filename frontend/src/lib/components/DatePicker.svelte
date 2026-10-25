<script>
  // shadcn date picker (Popover + Calendar) over a plain "YYYY-MM-DD" string, like <input type="date">.
  import { parseDate } from '@internationalized/date'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { cn } from '$lib/cn.js'

  /** value: "YYYY-MM-DD" or ''; min: earliest selectable "YYYY-MM-DD" */
  let { value = $bindable(''), min = '', id, placeholder = 'Pick a date', class: className = '' } = $props()

  let open = $state(false)
  const toDate = (v) => {
    try {
      return v ? parseDate(v) : undefined
    } catch (_) {
      return undefined
    }
  }
  const label = $derived(
    value ? new Date(`${value}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '',
  )
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {id}
        variant="outline"
        class={cn('w-full justify-start bg-cotton px-3 font-normal', !value && 'text-muted-foreground', className)}
      >
        <CalendarIcon class="text-muted-foreground" />
        {label || placeholder}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <Calendar
      type="single"
      value={toDate(value)}
      minValue={toDate(min)}
      captionLayout="dropdown"
      onValueChange={(d) => {
        value = d ? d.toString() : ''
        open = false
      }}
    />
    {#if value}
      <div class="border-t border-rule p-2">
        <Button variant="ghost" size="sm" class="w-full" onclick={() => ((value = ''), (open = false))}>Clear date</Button>
      </div>
    {/if}
  </Popover.Content>
</Popover.Root>
