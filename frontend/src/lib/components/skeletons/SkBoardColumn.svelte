<script>
  // A board column while loading: the header (status pill + count) and `cards` project cards.
  import Bone from './Bone.svelte'

  let { cards = 2 } = $props()
</script>

<section class="flex min-w-[280px] flex-1 flex-col rounded-2xl bg-lane p-2" aria-hidden="true">
  <div class="mb-2.5 flex h-10 items-center gap-2 rounded-lg bg-cotton/70 pr-1.5 pl-2">
    <Bone class="h-6 w-24 rounded-md" />
    <Bone class="h-6 w-6 rounded-md" />
    <Bone class="ml-auto size-7 rounded-md" />
  </div>
  <div class="flex flex-col gap-2.5 p-0.5">
    {#each Array(cards) as _, i (i)}
      <div class="rounded-xl bg-cotton p-3.5 shadow-card ring-1 ring-rule">
        <Bone class="h-4" style="width: {60 + ((i * 13) % 30)}%" />
        <div class="mt-2.5 flex gap-1.5"><Bone class="h-6 w-14 rounded-md" /><Bone class="h-6 w-28 rounded-md" /></div>
        <div class="mt-3 space-y-2 border-t border-dashed border-rule pt-3">
          <Bone class="h-3.5 w-32" />
          <Bone class="h-1.5 w-full rounded-full" />
          <Bone class="h-2.5 w-20" />
        </div>
      </div>
    {/each}
  </div>
</section>
