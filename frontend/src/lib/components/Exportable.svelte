<script>
  import { toPng } from 'html-to-image'
  import { ui } from '../stores/ui.svelte.js'
  import { toastError } from '../stores/toast.svelte.js'
  import Icon from './Icon.svelte'
  import { cn } from '$lib/cn.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'

  // Wraps a section and adds a hover "Download PNG" button.
  // The button (and anything with .no-export) is left out of the image.
  let { filename = 'chart', class: cls = '', children } = $props()

  let node = $state(null)
  let busy = $state(false)

  async function download() {
    busy = true
    try {
      const url = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        filter: (el) => !el.classList?.contains('no-export'),
      })
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}-${new Date().toLocaleDateString('en-CA')}.png` // local YYYY-MM-DD
      a.click()
    } catch (err) {
      toastError(err, 'PNG export failed.')
    } finally {
      busy = false
    }
  }
</script>

<!-- A shadcn Card with its own padding/ring/gap reset; callers pass the layout (ChartCard: p-5, flex column). -->
<Card.Root bind:ref={node} class={cn('group relative gap-0 overflow-visible rounded-card bg-cotton py-0 shadow-card ring-0', cls)}>
  {@render children()}
  {#if !ui.readonly}
    <Button
      variant="outline"
      size="icon"
      class="no-export absolute top-4 right-4 z-10 size-8 rounded-lg border-rule bg-cotton text-muted-foreground hover:bg-paper-2 hover:text-ink"
      onclick={download}
      disabled={busy}
      title="Download as PNG"
      aria-label="Download as PNG"
    >
      <Icon name={busy ? 'refresh' : 'download'} size={14} class={busy ? 'animate-spin motion-reduce:animate-none' : ''} />
    </Button>
  {/if}
</Card.Root>
