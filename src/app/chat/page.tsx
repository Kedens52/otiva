import Link from "next/link"
import { listings } from "@/lib/mock-marketplace"

const conversations = listings.slice(0, 4).map((listing) => ({
  id: listing.id,
  title: listing.title,
  seller: listing.seller.name,
  city: listing.city,
  preview: "Здравствуйте! Объявление актуально, можно договориться о просмотре.",
  image: `/listings/${listing.category}.svg`,
}))

export default function ChatPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Сообщения</h1>
      <p className="mt-2 text-zinc-500">Демо-диалоги по объявлениям. Можно открыть любой чат.</p>

      <section className="mt-8 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="flex items-center gap-3 border-b border-zinc-200 p-4 transition last:border-b-0 hover:bg-zinc-50"
          >
            <img src={conversation.image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-zinc-950">{conversation.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{conversation.seller} · {conversation.city}</p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{conversation.preview}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[hsl(var(--otiva-blue)/0.1)] px-3 py-1 text-sm font-semibold text-[hsl(var(--otiva-blue))]">
              Открыть
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
