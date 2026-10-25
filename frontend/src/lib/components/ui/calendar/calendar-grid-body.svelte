<script>
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn } from "$lib/cn.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<CalendarPrimitive.GridBody bind:ref class={cn(className)} {...restProps} />