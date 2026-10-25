// Success / error feedback, shown by shadcn's Sonner toaster (mounted once in Toasts.svelte).
import { toast as sonner } from 'svelte-sonner'

export function toast(message, type = 'success', ms = 3000) {
  ;(type === 'error' ? sonner.error : sonner.success)(message, { duration: ms })
}

export function toastError(err, fallback = 'Something went wrong.') {
  toast(err?.response?.message || err?.message || fallback, 'error', 5000)
}
