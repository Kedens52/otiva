import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  // TODO: реализовать удаление после добавления модели SavedSearch
  return NextResponse.json({ ok: true })
}
