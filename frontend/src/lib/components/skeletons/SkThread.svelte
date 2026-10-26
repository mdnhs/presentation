<script>
  // A ticket conversation while loading: alternating message bubbles.
  import Bone from './Bone.svelte'
</script>

<div class="space-y-4" role="status" aria-label="Loading conversation">
  {#each [false, true, false] as mine, i (i)}
    <div class="flex {mine ? 'justify-end' : 'justify-start'}" aria-hidden="true">
      <div class="w-[60%] space-y-2 rounded-2xl px-4 py-3 shadow-card {mine ? 'bg-mint/70' : 'bg-cotton'}">
        <Bone class="h-2.5 w-28" />
        <Bone class="h-3.5 w-full" />
        <Bone class="h-3.5" style="width: {55 + i * 12}%" />
      </div>
    </div>
  {/each}
</div>
