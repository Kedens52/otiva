"use client"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

type ToastItem = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
}

export function useToast(): {
  toast: (props: { title?: string; description?: string }) => void
  dismiss: (toastId?: string) => void
  toasts: ToastItem[]
} {
  return {
    toast: (props) => {
      console.log("Toast:", props.title, props.description)
    },
    dismiss: () => {},
    toasts: [],
  }
}
