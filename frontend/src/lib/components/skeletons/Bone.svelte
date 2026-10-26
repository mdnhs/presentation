<script>
  // One placeholder shape in the theme's skeleton colour. Size and shape come from `class`.
  import { cn } from '$lib/cn.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'

  let { class: cls = '', ...rest } = $props()
</script>

<Skeleton class={cn('rounded-md bg-ink/[0.07] motion-reduce:animate-none', cls)} aria-hidden="true" {...rest} />
