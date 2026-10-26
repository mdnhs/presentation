<script>
  // A card in the same shell as ChartCard/Exportable, with a title (and optional subtitle) placeholder.
  import { cn } from '$lib/cn.js'
  import Bone from './Bone.svelte'

  let { class: cls = '', subtitle = true, action = false, children } = $props()
</script>

<div class={cn('flex flex-col rounded-card bg-cotton p-5 shadow-card', cls)} aria-hidden="true">
  <div class="mb-4 flex items-start justify-between gap-3">
    <div class="space-y-1.5">
      <Bone class="h-3.5 w-32" />
      {#if subtitle}<Bone class="h-2.5 w-48" />{/if}
    </div>
    {#if action}<Bone class="h-8 w-24 rounded-input" />{:else}<Bone class="size-8 rounded-lg" />{/if}
  </div>
  <div class="min-h-0 flex-1">{@render children?.()}</div>
</div>
