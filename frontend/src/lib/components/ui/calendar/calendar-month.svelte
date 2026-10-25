<script>
	import { cn } from "$lib/cn.js";
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<div {...restProps} bind:this={ref} class={cn("flex w-full flex-col gap-4", className)}>
	{@render children?.()}
</div>