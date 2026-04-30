export default function AdminAnalyticsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Аналитика</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["12 847", "пользователей"],
          ["1 204", "объявления"],
          ["86%", "ответов за день"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-4xl font-semibold text-zinc-950">{value}</p>
            <p className="mt-2 text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
