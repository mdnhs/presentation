<script>
  // Settings while loading: the vertical tabs and the first panel (workflow statuses) with its rows.
  import Bone from './Bone.svelte'
</script>

<div class="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10" role="status" aria-label="Loading settings">
  <div class="flex gap-1 md:flex-col" aria-hidden="true">
    {#each [120, 80, 112] as w, i (i)}
      <div class="flex h-9 items-center gap-2.5 rounded-lg px-3 {i === 0 ? 'bg-mint/60' : ''}"><Bone class="size-4" /><Bone class="h-3" style="width: {w}px" /></div>
    {/each}
  </div>
  <div class="space-y-5" aria-hidden="true">
    <div class="space-y-2"><Bone class="h-4 w-40" /><Bone class="h-3 w-full max-w-md" /></div>
    <div class="space-y-2">
      {#each Array(4) as _, i (i)}
        <div class="flex items-center gap-3 rounded-xl bg-cotton px-3 py-2.5 shadow-card">
          <Bone class="size-4" />
          <Bone class="size-7 rounded-input" />
          <Bone class="h-4" style="width: {96 + i * 18}px" />
          <Bone class="ml-auto h-3 w-16" />
          <Bone class="h-4 w-28" />
          <Bone class="size-8 rounded-lg" />
        </div>
      {/each}
    </div>
    <Bone class="h-9 w-28 rounded-input" />
  </div>
</div>
