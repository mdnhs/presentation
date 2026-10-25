<script>
  import { Badge } from '$lib/components/ui/badge/index.js'

  let { priority } = $props()

  const STYLES = {
    high: 'bg-error/10 text-error',
    medium: 'bg-warn/12 text-warn',
    low: 'bg-paper-3 text-muted-foreground',
  }
</script>

{#if priority}
  <Badge variant="secondary" class="h-6 rounded-md px-2 capitalize {STYLES[priority]}">
    {priority}
  </Badge>
{/if}
