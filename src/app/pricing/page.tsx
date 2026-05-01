import Link from "next/link"

export const metadata = { title: "Тарифы — Нашло" }

const packs = [
  { slots: 5,  price: 99,  label: "Старт",   desc: "Для случайных продаж" },
  { slots: 15, price: 249, label: "Активный", desc: "Для регулярных продавцов", popular: true },
  { slots: 50, price: 699, label: "Бизнес",   desc: "Для магазинов и дилеров" },
]

const promote = [
  { name: "Поднять в поиске",  price: 49,  period: "1 раз",   desc: "Объявление поднимается в топ выдачи по категории" },
  { name: "Выделить цветом",   price: 29,  period: "7 дней",  desc: "Яркая рамка привлекает внимание в списке" },
  { name: "XL-карточка",       price: 39,  period: "7 дней",  desc: "Увеличенная карточка с большим фото" },
  { name: "Турбо",             price: 99,  period: "3 дня",   desc: "Топ выдачи + выделение + XL одновременно" },
]

const subscriptions = [
  {
    name: "Базовый",
    price: 499,
    listings: 30,
    features: ["30 активных объявлений", "Приоритет в модерации", "Статистика просмотров"],
  },
  {
    name: "Профи",
    price: 1499,
    listings: 100,
    popular: true,
    features: ["100 активных объявлений", "1 бесплатный «Подъём» в неделю", "Расширенная аналитика", "Значок проверенного продавца"],
  },
  {
    name: "Бизнес",
    price: 2999,
    listings: -1,
    features: ["Безлимитные объявления", "Приоритетная поддержка", "Витрина бренда", "API доступ", "Персональный менеджер"],
  },
]

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 pb-28 lg:pb-12">

      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Тарифы Нашло</h1>
        <p className="mt-3 text-zinc-500">Начните бесплатно — платите только если хотите больше</p>
      </div>

      {/* Free tier */}
      <div className="mt-10 rounded-[28px] border-2 border-[hsl(var(--nashlo-orange))] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-zinc-950">Бесплатно</h2>
              <span className="rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] px-3 py-1 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">Навсегда</span>
            </div>
            <p className="mt-1 text-zinc-500">Для частных лиц — без скрытых платежей</p>
          </div>
          <Link href="/register" className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            Начать бесплатно
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: "◎", text: "3 активных объявления одновременно" },
            { icon: "◷", text: "30 дней активности каждого объявления" },
            { icon: "✓", text: "Все категории, все города" },
          ].map((f) => (
            <div key={f.text} className="flex items-start gap-2 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              <span className="mt-0.5 text-[hsl(var(--nashlo-orange))]">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-400">Для бесплатного размещения требуется подтверждение телефона. Лимит: не более 2 новых объявлений в сутки.</p>
      </div>

      {/* Antispam note */}
      <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
        <span className="font-semibold text-zinc-950">Защита от спама:</span> все объявления проходят автоматическую проверку на дубликаты. При обнаружении копии — объявление отклоняется. Повторные нарушения приводят к блокировке аккаунта.
      </div>

      {/* Packs */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-950">Пакеты объявлений</h2>
        <p className="mt-1 text-sm text-zinc-500">Разовая покупка дополнительных слотов — без подписки</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {packs.map((pack) => (
            <div key={pack.label} className={`relative rounded-[24px] border bg-white p-5 shadow-sm ${pack.popular ? "border-zinc-950" : "border-zinc-200"}`}>
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-semibold text-white">Популярный</div>
              )}
              <p className="text-sm font-semibold text-zinc-500">{pack.label}</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-950">{pack.price} <span className="text-base font-normal">₽</span></p>
              <p className="mt-1 text-sm text-zinc-500">+{pack.slots} объявлений</p>
              <p className="mt-1 text-xs text-zinc-400">{pack.desc}</p>
              <p className="mt-3 text-xs text-zinc-400">{(pack.price / pack.slots).toFixed(0)} ₽ за объявление</p>
            </div>
          ))}
        </div>
      </div>

      {/* Promote */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-950">Продвижение объявлений</h2>
        <p className="mt-1 text-sm text-zinc-500">Разово, на конкретное объявление</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {promote.map((p) => (
            <div key={p.name} className="flex items-start gap-4 rounded-[24px] border border-zinc-100 bg-white p-4 shadow-sm">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-zinc-950">{p.name}</p>
                  <span className="text-xs text-zinc-400">{p.period}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{p.desc}</p>
              </div>
              <p className="shrink-0 text-lg font-semibold text-zinc-950">{p.price} ₽</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-950">Подписки для бизнеса</h2>
        <p className="mt-1 text-sm text-zinc-500">Ежемесячная оплата — для магазинов, дилеров и активных продавцов</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {subscriptions.map((sub) => (
            <div key={sub.name} className={`relative flex flex-col rounded-[24px] border bg-white p-5 shadow-sm ${sub.popular ? "border-zinc-950" : "border-zinc-200"}`}>
              {sub.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-semibold text-white">Лучший выбор</div>
              )}
              <p className="font-semibold text-zinc-950">{sub.name}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">{sub.price} <span className="text-sm font-normal text-zinc-500">₽/мес</span></p>
              <p className="mt-1 text-sm text-zinc-500">{sub.listings === -1 ? "Безлимит" : sub.listings} объявлений</p>
              <ul className="mt-4 flex-1 space-y-2">
                {sub.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-0.5 text-emerald-500">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Compare with Avito */}
      <div className="mt-12 rounded-[28px] border border-zinc-100 bg-zinc-50 p-6">
        <h2 className="text-lg font-semibold text-zinc-950">Нашло vs Авито</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="pb-3 pr-6 text-left font-semibold text-zinc-950">Услуга</th>
                <th className="pb-3 pr-6 text-left font-semibold text-[hsl(var(--nashlo-orange))]">Нашло</th>
                <th className="pb-3 text-left font-semibold text-zinc-400">Авито</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {[
                ["Бесплатных объявлений", "3", "1"],
                ["Поднять в поиске", "49 ₽", "от 149 ₽"],
                ["Выделение цветом", "29 ₽ / 7 дн", "от 59 ₽ / 7 дн"],
                ["Турбо-продажа", "99 ₽ / 3 дн", "от 299 ₽"],
                ["Базовая подписка", "499 ₽/мес", "от 1 499 ₽/мес"],
              ].map(([service, nashlo, avito]) => (
                <tr key={service}>
                  <td className="py-3 pr-6 text-zinc-700">{service}</td>
                  <td className="py-3 pr-6 font-semibold text-zinc-950">{nashlo}</td>
                  <td className="py-3 text-zinc-400">{avito}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-zinc-400">Цены Авито приведены на январь 2025 г. и могут отличаться в зависимости от региона и категории.</p>
      </div>

      {/* FAQ */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-950">Частые вопросы</h2>
        {[
          { q: "Что будет когда истечёт бесплатное объявление?", a: "Объявление деактивируется. Вы получите уведомление за 3 дня и сможете продлить его бесплатно ещё на 30 дней." },
          { q: "Как работает защита от дубликатов?", a: "Система автоматически сравнивает заголовок, описание и фотографии нового объявления с уже размещёнными. Похожие объявления отправляются на ручную модерацию." },
          { q: "Можно ли перенести купленные слоты на другой аккаунт?", a: "Нет. Пакеты и подписки привязаны к конкретному аккаунту и не передаются." },
          { q: "Есть ли возврат средств?", a: "Возврат за неиспользованные пакеты — в течение 14 дней с момента покупки. Продвижение возврату не подлежит, если объявление уже было показано." },
        ].map((item) => (
          <div key={item.q} className="rounded-[20px] border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-zinc-950">{item.q}</p>
            <p className="mt-2 text-sm text-zinc-500">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center text-sm text-zinc-400">
        Остались вопросы? <a href="mailto:support@nashlo.ru" className="underline underline-offset-2 hover:text-zinc-700">support@nashlo.ru</a>
        {" · "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700">Условия использования</Link>
      </div>
    </main>
  )
}
