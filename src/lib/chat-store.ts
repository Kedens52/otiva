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
  pinned?: boolean
  archived?: boolean
  messages: ChatMessage[]
}

const KEY = "nashlo-chats"

export function loadChats(): Record<string, Conversation> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

export function saveChats(data: Record<string, Conversation>) {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new Event("nashlo-chats-change"))
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

export function togglePinned(listingId: string) {
  const all = loadChats()
  const conv = all[listingId]
  if (!conv) return
  conv.pinned = !conv.pinned
  saveChats(all)
}

export function deleteConversation(listingId: string) {
  const all = loadChats()
  delete all[listingId]
  saveChats(all)
}

export function archiveConversation(listingId: string) {
  const all = loadChats()
  const conv = all[listingId]
  if (!conv) return
  conv.archived = true
  saveChats(all)
}

export function totalUnread(): number {
  const all = loadChats()
  return Object.values(all).reduce(
    (sum, conv) => sum + conv.messages.filter((m) => m.from === "seller" && !m.read).length,
    0,
  )
}


