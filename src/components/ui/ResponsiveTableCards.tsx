type Column<T> = {
  key: keyof T
  label: string
  /** monospace for cookie names etc. */
  mono?: boolean
  className?: string
}

type Props<T extends Record<string, string>> = {
  columns: Column<T>[]
  rows: T[]
  /** key field for React keys */
  rowKey: keyof T
}

export function ResponsiveTableCards<T extends Record<string, string>>({
  columns,
  rows,
  rowKey,
}: Props<T>) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article
            key={String(row[rowKey])}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            {columns.map((col) => (
              <div key={String(col.key)} className={col.key === rowKey ? "mb-2" : "mt-2 first:mt-0"}>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{col.label}</p>
                <p
                  className={`mt-0.5 text-sm text-zinc-800 ${col.mono ? "break-all font-mono text-xs" : ""} ${col.className ?? ""}`}
                >
                  {row[col.key]}
                </p>
              </div>
            ))}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {columns.map((col) => (
                <th key={String(col.key)} className="py-2 pr-4 text-left font-semibold text-zinc-950">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((row) => (
              <tr key={String(row[rowKey])}>
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`py-2 pr-4 ${col.mono ? "break-all font-mono text-zinc-600" : "text-zinc-700"} ${col.className ?? ""}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
