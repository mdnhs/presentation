<script>
  // Support ticket rows while loading: unread dot, subject + meta, priority, status, assignee, time.
  import Bone from './Bone.svelte'

  let { rows = 5, staff = true } = $props()
</script>

<ul class="divide-y divide-rule border-t border-rule" role="status" aria-label="Loading tickets">
  {#each Array(rows) as _, i (i)}
    <li class="flex items-center gap-4 px-5 py-3.5" aria-hidden="true">
      <span class="size-2 shrink-0"></span>
      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="flex items-center gap-2"><Bone class="h-3.5" style="width: {160 + ((i * 37) % 120)}px" /><Bone class="h-3 w-12" /></div>
        <Bone class="h-2.5" style="width: {220 + ((i * 53) % 160)}px; max-width: 80%" />
      </div>
      <Bone class="hidden h-6 w-14 rounded-md md:block" />
      <Bone class="h-6 w-20 rounded-md" />
      {#if staff}<Bone class="hidden h-3 w-20 lg:block" />{/if}
      <Bone class="hidden h-3 w-14 sm:block" />
      <Bone class="size-4" />
    </li>
  {/each}
</ul>
