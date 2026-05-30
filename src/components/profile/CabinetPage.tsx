import type { ReactNode } from "react"

type CabinetPageProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function CabinetPage({ title, subtitle, action, children, className = "" }: CabinetPageProps) {
  return (
    <div
      className={`min-w-0 w-full rounded-[20px] border border-zinc-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:p-5 lg:rounded-2xl lg:p-6 lg:shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-[22px]">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm leading-snug text-zinc-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="w-full shrink-0 sm:w-auto [&>a]:flex [&>a]:w-full [&>a]:justify-center sm:[&>a]:inline-flex sm:[&>a]:w-auto">{action}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
