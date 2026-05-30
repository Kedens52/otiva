import { NextRequest, NextResponse } from "next/server"
import { runWantToBuyExpiryReminders } from "@/lib/want-to-buy/expiry-reminders"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Истечение заявок + напоминания за 3 дня до expiresAt.
 * POST Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runWantToBuyExpiryReminders()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error("cron want-to-buy-reminders:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
