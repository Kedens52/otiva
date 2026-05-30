import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[112px] w-full rounded-[16px] border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 shadow-sm ring-offset-background transition duration-200 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-[hsl(var(--nashlo-orange)/0.55)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.18)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 disabled:opacity-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
