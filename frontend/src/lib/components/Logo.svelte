<script>
  // Default brand mark (two leaves) when no logo is uploaded in Settings.
  let { size = 32 } = $props()
</script>

<!-- viewBox hugs the leaves (x 3-28, y 9-28) so the mark fills its box instead of floating in padding. -->
<svg width={size} height={size} viewBox="2.5 5.5 26 26" aria-hidden="true" class="shrink-0">
  <path d="M15 28C7 26 3 19 4 9c7 1 12 6 11 19z" fill="var(--color-brand)" />
  <path d="M17 28c8-2 12-9 11-19-7 1-12 6-11 19z" fill="var(--color-brand-2)" />
</svg>
