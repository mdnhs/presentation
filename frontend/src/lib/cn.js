// shadcn-svelte helpers: merge Tailwind classes, and the prop types its components reference.
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
