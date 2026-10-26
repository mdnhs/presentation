<script>
  // Shown in the main panel while a page's code chunk loads: the page header and one content card.
  import Bone from './Bone.svelte'
  import SkTable from './SkTable.svelte'
</script>

<div class="p-[var(--gutter)]" role="status" aria-label="Loading page">
  <div class="mb-6 flex items-end justify-between gap-4" aria-hidden="true">
    <div class="space-y-2"><Bone class="h-8 w-48" /><Bone class="h-3.5 w-64" /></div>
    <Bone class="h-10 w-36 rounded-full" />
  </div>
  <div class="overflow-hidden rounded-card bg-cotton shadow-card">
    <div class="flex items-center justify-between px-5 py-3.5" aria-hidden="true"><Bone class="h-4 w-28" /><Bone class="h-8 w-48 rounded-input" /></div>
    <SkTable rows={6} columns={[{ kind: 'avatar' }, { kind: 'badge' }, { kind: 'bar', class: 'w-48' }, { kind: 'short' }, { kind: 'chip' }]} />
  </div>
</div>
