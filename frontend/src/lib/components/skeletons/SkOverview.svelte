<script>
  // Overview while data loads: the same two columns and cards as OverviewGrid, each with its inner layout.
  import Bone from './Bone.svelte'
  import SkCard from './SkCard.svelte'
  import SkTable from './SkTable.svelte'

  let { fill = false } = $props()
</script>

<div class="grid gap-5 {fill ? 'h-full grid-cols-12' : 'xl:grid-cols-12'}" role="status" aria-label="Loading overview">
  <div class="flex min-w-0 flex-col gap-5 {fill ? 'col-span-8 min-h-0' : 'xl:col-span-8'}">
    <!-- Next deadline -->
    <div class="shrink-0 rounded-card bg-mint/60 p-5 shadow-card" aria-hidden="true">
      <div class="flex items-center justify-between gap-3">
        <Bone class="h-7 w-36 rounded-full bg-cotton" />
        <div class="flex gap-2"><Bone class="size-9 rounded-full bg-cotton" /><Bone class="h-9 w-32 rounded-full bg-cotton" /></div>
      </div>
      <div class="mt-4 flex items-center gap-4">
        <Bone class="size-16 rounded-xl bg-cotton" />
        <div class="space-y-2"><Bone class="h-5 w-56 bg-cotton" /><Bone class="h-3.5 w-28 bg-cotton" /></div>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {#each Array(4) as _, i (i)}
          <div class="flex items-center gap-2.5"><Bone class="size-4 bg-cotton" /><div class="flex-1 space-y-1.5"><Bone class="h-2.5 w-12 bg-cotton" /><Bone class="h-3.5 w-20 bg-cotton" /></div></div>
        {/each}
      </div>
    </div>

    <!-- Deliveries this month -->
    <SkCard class="shrink-0">
      <div class="mb-4 flex gap-4">{#each Array(4) as _, i (i)}<Bone class="h-3 w-16" />{/each}</div>
      <div class="grid min-w-[640px] gap-y-2" style="grid-template-columns: repeat(31, minmax(0, 1fr))">
        {#each Array(31) as _, i (i)}<span class="grid place-items-center"><Bone class="h-2.5 w-3.5" /></span>{/each}
        {#each Array(31) as _, i (i)}<span class="grid place-items-center"><Bone class="size-6 rounded-full" /></span>{/each}
      </div>
    </SkCard>

    <!-- Projects table -->
    <SkCard class="flex-1 {fill ? 'min-h-0 overflow-hidden' : ''}">
      <div class="mb-4 flex items-center justify-between gap-2">
        <Bone class="h-9 w-52 rounded-input" />
        <Bone class="h-9 w-56 rounded-full" />
      </div>
      <div class="-mx-5">
        <SkTable rows={fill ? 5 : 6} columns={[{ kind: 'avatar' }, { kind: 'dates' }, { kind: 'dates' }, { kind: 'bar', class: 'w-40' }, { kind: 'badge' }]} />
      </div>
    </SkCard>
  </div>

  <div class="flex min-w-0 flex-col gap-5 {fill ? 'col-span-4 min-h-0' : 'xl:col-span-4'}">
    <!-- At a glance -->
    <SkCard class="shrink-0" subtitle={false}>
      <div class="grid grid-cols-2 gap-3">
        {#each Array(4) as _, i (i)}
          <div class="rounded-xl bg-paper-2 p-4">
            <Bone class="size-9 rounded-lg" />
            <Bone class="mt-3 h-2.5 w-20" />
            <Bone class="mt-2 h-7 w-12" />
            <Bone class="mt-2 h-2.5 w-24" />
          </div>
        {/each}
      </div>
    </SkCard>

    <!-- Projects by status -->
    <SkCard class="shrink-0">
      <Bone class="h-2.5 w-full rounded-[3px]" />
      <div class="mt-3 divide-y divide-rule">
        {#each Array(4) as _, i (i)}
          <div class="flex items-center gap-3 py-2"><Bone class="size-2.5 rounded-[3px]" /><Bone class="h-3.5 flex-1" style="max-width: {90 + i * 14}px" /><Bone class="ml-auto h-3.5 w-6" /><Bone class="h-3.5 w-9" /></div>
        {/each}
      </div>
    </SkCard>

    <!-- Completed trend -->
    <SkCard class="flex-1 {fill ? 'min-h-0' : ''}" action>
      <div class="flex h-full min-h-[240px] items-end gap-2 border-b border-l border-rule pb-1 pl-1">
        {#each [18, 26, 26, 40, 40, 52, 52, 60, 68, 80, 92, 100] as h, i (i)}<Bone class="flex-1 rounded-t-sm rounded-b-none" style="height: {h}%" />{/each}
      </div>
    </SkCard>
  </div>
</div>
