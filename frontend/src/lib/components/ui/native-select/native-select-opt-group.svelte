<script>
	import { cn } from "$lib/cn.js";
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<optgroup
	bind:this={ref}
	data-slot="native-select-optgroup"
	class={cn("bg-[Canvas] text-[CanvasText]", className)}
	{...restProps}
>
	{@render children?.()}
</optgroup>