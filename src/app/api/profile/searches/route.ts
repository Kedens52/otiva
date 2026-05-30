import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Возвращает пустой список — модель SavedSearch может быть добавлена позже
// TODO: добавить модель SavedSearch в Prisma и реализовать сохранение поисков
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  return NextResponse.json({ searches: [] })
}
