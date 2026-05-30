import type { UserRiskSignal } from "@/lib/admin/user-risk-signals"

const LEVEL_STYLE: Record<UserRiskSignal["level"], string> = {
  danger: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
}

type Props = {
  signals: UserRiskSignal[]
}

export function AdminUserRiskSignals({ signals }: Props) {
  if (signals.length === 0) return null

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-800">Сигналы риска</h3>
      <ul className="mt-2 space-y-2">
        {signals.map((s, i) => (
          <li
            key={i}
            className={`rounded-xl border px-3 py-2 text-sm ${LEVEL_STYLE[s.level]}`}
          >
            {s.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
