import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { loadUserSupportContext } from "@/lib/support/context"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", needsAuth: true }, { status: 401 })
    }

    const ctx = await loadUserSupportContext(user.id, user.name)
    return NextResponse.json({
      listings: ctx.listings,
      adCampaigns: ctx.adCampaigns,
      bonusBalance: ctx.bonusBalance,
      userName: ctx.userName,
    })
  } catch (error) {
    console.error("support context GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
