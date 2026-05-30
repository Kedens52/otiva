import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[14px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 shadow-sm ring-offset-background transition duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-[hsl(var(--nashlo-orange)/0.55)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.18)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 disabled:opacity-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
