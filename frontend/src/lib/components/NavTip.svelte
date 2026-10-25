<script>
  // shadcn Tooltip to the right of a sidebar item; with no label it renders the item alone.
  // Usage: <NavTip label={collapsed ? 'Board' : ''}>{#snippet item(props)}<a {...props}>…</a>{/snippet}</NavTip>
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let { label = '', item } = $props()
</script>

{#if label}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}{@render item(props)}{/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="right" sideOffset={10}>{label}</Tooltip.Content>
  </Tooltip.Root>
{:else}
  {@render item({})}
{/if}
