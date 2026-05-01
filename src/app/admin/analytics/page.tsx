export default function AdminAnalyticsPage() {
  const stats = [
    { value: "12 847", label: "Пользователей",        sub: "+214 за неделю",   color: "bg-[hsl(var(--nashlo-blue)/0.10)]"    },
    { value: "1 204",  label: "Активных объявлений",  sub: "86 на модерации",  color: "bg-[hsl(var(--nashlo-orange)/0.10)]"  },
    { value: "86%",    label: "Авто-проверок",         sub: "14% — вручную",   color: "bg-[hsl(var(--nashlo-mint)/0.12)]"    },
    { value: "3 481",  label: "Сообщений в сутки",    sub: "конверсия 2.8%",   color: "bg-zinc-100"                          },
    { value: "7 мин",  label: "Среднее решение",       sub: "↓ 2 мин vs неделя", color: "bg-zinc-100"                       },
    { value: "4.87",   label: "Средний рейтинг",       sub: "по всем продавцам", color: "bg-zinc-100"                       },
  ]

  const categories = [
    { name: "Автомобили",     count: 342, share: 28 },
    { name: "Электроника",    count: 289, share: 24 },
    { name: "Недвижимость",   count: 198, share: 16 },
    { name: "Услуги",         count: 156, share: 13 },
    { name: "Одежда",         count: 134, share: 11 },
    { name: "Остальные",      count: 85,  share: 8  },
  ]

  const modEvents = [
    { date: "Сегодня, 11:42", action: "Отклонено", title: "Кредит без отказа — быстро",    reason: "Стоп-слово: кредит без отказа" },
    { date: "Сегодня, 10:18", action: "Одобрено",  title: "iPhone 15 Pro, 256GB",          reason: "Ручная проверка" },
    { date: "Сегодня, 09:55", action: "Бан",        title: "Дмитрий Федоров",              reason: "Массовые жалобы + флуд" },
    { date: "Вчера, 23:01",   action: "Отклонено", title: "Заработок дома без вложений",   reason: "Стоп-слово: заработок дома" },
    { date: "Вчера, 20:30",   action: "Одобрено",  title: "Toyota Camry 2021, 2.5 AT",    reason: "Авто-проверка пройдена" },
  ]

  const ACTION_COLOR: Record<string, string> = {
    "Одобрено":  "bg-[hsl(var(--nashlo-mint)/0.15)] text-[hsl(var(--nashlo-mint))]",
    "Отклонено": "bg-red-50 text-red-600",
    "Бан":       "bg-zinc-950 text-white",
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Аналитика</h1>
        <p className="mt-1 text-sm text-zinc-500">Сводная статистика платформы за последние 30 дней.</p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-[24px] p-5 ${s.color}`}>
            <p className="text-3xl font-semibold text-zinc-950">{s.value}</p>
            <p className="mt-1 font-medium text-zinc-700">{s.label}</p>
            <p className="mt-1 text-sm text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-950">Объявления по категориям</h2>
          <div className="mt-5 space-y-3">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700">{cat.name}</span>
                  <span className="font-semibold text-zinc-950">{cat.count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-[hsl(var(--nashlo-orange))] transition-all"
                    style={{ width: cat.share + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-950">Последние события</h2>
          <div className="mt-4 space-y-3">
            {modEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3">
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLOR[ev.action]}`}>{ev.action}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{ev.reason}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
