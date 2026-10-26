<script>
  // One table cell placeholder, shaped like what the real cell shows.
  //   avatar: a square tile + name and sub-line   person: a round avatar + name and email
  //   badge / chip / text / short / bar / dates / check / actions
  import Bone from './Bone.svelte'

  let { kind = 'text', i = 0 } = $props()
  // Vary widths a little row to row so it reads as text, not a grid of identical bars.
  const w = (base) => `${base + ((i * 7) % 4) * 8}px`
</script>

{#if kind === 'avatar' || kind === 'person'}
  <div class="flex items-center gap-3">
    <Bone class="size-9 shrink-0 {kind === 'person' ? 'rounded-full' : 'rounded-lg'}" />
    <div class="min-w-0 space-y-1.5">
      <Bone class="h-3.5" style="width: {w(110)}" />
      <Bone class="h-2.5" style="width: {w(70)}" />
    </div>
  </div>
{:else if kind === 'badge'}
  <Bone class="h-6 rounded-md" style="width: {w(64)}" />
{:else if kind === 'chip'}
  <Bone class="h-6 rounded-md" style="width: {w(92)}" />
{:else if kind === 'bar'}
  <div class="flex items-center gap-2.5"><Bone class="h-1.5 flex-1 rounded-full" /><Bone class="h-3 w-8" /></div>
{:else if kind === 'dates'}
  <div class="space-y-1.5"><Bone class="h-3.5" style="width: {w(96)}" /><Bone class="h-2.5 w-16" /></div>
{:else if kind === 'check'}
  <Bone class="size-4 rounded" />
{:else if kind === 'actions'}
  <div class="flex justify-end gap-1">{#each Array(4) as _, j (j)}<Bone class="size-7 rounded-lg" />{/each}</div>
{:else if kind === 'short'}
  <Bone class="h-3.5" style="width: {w(44)}" />
{:else}
  <Bone class="h-3.5" style="width: {w(80)}" />
{/if}
