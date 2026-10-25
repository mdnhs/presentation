<script>
  import { alpha } from '../utils.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  let { status } = $props()
</script>

{#if status}
  <!-- Tinted pill in the status's own colour, the key the charts use. -->
  <Badge variant="secondary" class="h-6 gap-1.5 rounded-md px-2 text-ink-2" style="background: {alpha(status.color, 0.14)}">
    <span class="size-2 rounded-full" style="background: {status.color}" aria-hidden="true"></span>
    {status.name}
  </Badge>
{/if}
