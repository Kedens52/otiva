import type { ReactNode } from "react"

type AdminPageShellProps = {
  children: ReactNode
  className?: string
}

export function AdminPageShell({ children, className = "" }: AdminPageShellProps) {
  return (
    <div className={["mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8", className].join(" ")}>
      {children}
    </div>
  )
}

