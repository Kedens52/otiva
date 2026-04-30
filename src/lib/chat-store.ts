// localStorage-based chat store

export type ChatMessage = {
  id: string
  from: "me" | "seller"
  text: string
  ts: number
  read: boolean
}

export type Conversation = {
  id: string          // listingId
  listingTitle: string
  listingCategory: string
  sellerName: string
  city: string
  updatedAt: number
  messages: ChatMessage[]
}

const KEY = "otiva-chats"

export function loadChats(): Record<string, Conversation> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

export function saveChats(data: Record<string, Conversation>) {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new Event("otiva-chats-change"))
}

export function getConversation(listingId: string): Conversation | null {
  return loadChats()[listingId] ?? null
}

export function getOrCreateConversation(
  listingId: string,
  listingTitle: string,
  listingCategory: string,
  sellerName: string,
  city: string,
): Conversation {
  const all = loadChats()
  if (all[listingId]) return all[listingId]
  const conv: Conversation = {
    id: listingId, listingTitle, listingCategory, sellerName, city,
    updatedAt: Date.now(), messages: [],
  }
  all[listingId] = conv
  saveChats(all)
  return conv
}

export function sendMessage(listingId: string, text: string, from: "me" | "seller") {
  const all = loadChats()
  const conv = all[listingId]
  if (!conv) return
  const msg: ChatMessage = { id: crypto.randomUUID(), from, text, ts: Date.now(), read: from === "me" }
  conv.messages.push(msg)
  conv.updatedAt = Date.now()
  saveChats(all)
}

export function markRead(listingId: string) {
  const all = loadChats()
  const conv = all[listingId]
  if (!conv) return
  conv.messages.forEach((m) => { m.read = true })
  saveChats(all)
}

export function totalUnread(): number {
  const all = loadChats()
  return Object.values(all).reduce(
    (sum, conv) => sum + conv.messages.filter((m) => m.from === "seller" && !m.read).length,
    0,
  )
}

export function seedConversations() {
  // Pre-seed 2 demo conversations on first load
  const all = loadChats()
  if (Object.keys(all).length > 0) return

  const seed: Record<string, Conversation> = {
    "1": {
      id: "1", listingTitle: "BMW 3 Series", listingCategory: "cars",
      sellerName: "Алексей Морозов", city: "Москва", updatedAt: Date.now() - 3600000,
      messages: [
        { id: "s1", from: "me",     text: "Здравствуйте! Меня интересует ваше объявление «BMW 3 Series». Оно ещё актуально?", ts: Date.now() - 7200000, read: true },
        { id: "s2", from: "seller", text: "Здравствуйте! Да, актуально. Готов ответить на вопросы.", ts: Date.now() - 6900000, read: true },
        { id: "s3", from: "me",     text: "Можно посмотреть сегодня вечером после 18:00?", ts: Date.now() - 6600000, read: true },
        { id: "s4", from: "seller", text: "Да, удобно. Адрес отправлю перед встречей. Что ещё интересует?", ts: Date.now() - 3600000, read: false },
      ],
    },
    "2": {
      id: "2", listingTitle: "Mercedes-Benz E-Class", listingCategory: "cars",
      sellerName: "Марина Волкова", city: "Санкт-Петербург", updatedAt: Date.now() - 86400000,
      messages: [
        { id: "s5", from: "me",     text: "Добрый день, возможен торг?", ts: Date.now() - 90000000, read: true },
        { id: "s6", from: "seller", text: "Здравствуйте! Небольшой торг возможен при осмотре.", ts: Date.now() - 86400000, read: true },
      ],
    },
  }
  saveChats(seed)
}
