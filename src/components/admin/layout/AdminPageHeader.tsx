import type { ReactNode } from "react"

type AdminPageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}

export function AdminPageHeader({ title, description, actions, meta }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {meta ? <div className="mb-1">{meta}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 lg:text-3xl">{title}</h1>
        {description ? <div className="mt-1 text-sm text-zinc-500">{description}</div> : null}
      </div>
      {actions ? <div className="w-full min-w-0 shrink-0 lg:w-auto">{actions}</div> : null}
    </div>
  )
}

