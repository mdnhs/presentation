<script>
  // Table skeleton: the grey header row and `rows` body rows, one cell kind per column (see SkCell).
  import Bone from './Bone.svelte'
  import SkCell from './SkCell.svelte'

  /** columns: [{ kind, head?: boolean, class? }] — head:false leaves the header cell blank */
  let { columns, rows = 6 } = $props()
</script>

<div class="overflow-x-auto" role="status" aria-label="Loading">
  <table class="w-full text-sm">
    <thead>
      <tr class="bg-paper-2">
        {#each columns as col, c (c)}
          <th class="h-10 px-4 text-left font-normal first:pl-5 last:pr-5 {col.class ?? ''}">
            {#if col.head !== false}<Bone class="h-2.5 {col.kind === 'avatar' || col.kind === 'person' ? 'w-20' : 'w-12'}" />{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Array(rows) as _, r (r)}
        <tr class="border-b border-rule last:border-0">
          {#each columns as col, c (c)}
            <td class="px-4 py-3 first:pl-5 last:pr-5 {col.class ?? ''}"><SkCell kind={col.kind} i={r + c} /></td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <span class="sr-only">Loading…</span>
</div>
