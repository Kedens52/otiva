import Link from "next/link"

const messages = [
  { from: "seller", text: "Здравствуйте! Объявление актуально." },
  { from: "me", text: "Добрый день. Можно посмотреть сегодня вечером?" },
  { from: "seller", text: "Да, удобно после 19:00. Адрес отправлю перед встречей." },
]

export default function ChatDetailPage({ params }: { params: { chatId: string } }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:py-10">
      <Link href="/chat" className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">
        ← Все сообщения
      </Link>
      <section className="mt-6 overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-5">
          <h1 className="text-2xl font-semibold text-zinc-950">Чат #{params.chatId}</h1>
          <p className="mt-1 text-sm text-zinc-500">Демо-диалог с продавцом</p>
        </div>
        <div className="space-y-4 p-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm leading-6 sm:max-w-md ${message.from === "me" ? "bg-[hsl(var(--otiva-blue))] text-white" : "bg-zinc-100 text-zinc-800"}`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <form className="flex gap-3 border-t border-zinc-200 p-4">
          <input className="min-w-0 flex-1 rounded-full border border-zinc-200 px-5 py-3 text-sm outline-none" placeholder="Напишите сообщение" />
          <button className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white">Отправить</button>
        </form>
      </section>
    </main>
  )
}
