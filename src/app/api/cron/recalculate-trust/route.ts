import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Ежедневный пересчёт внутренних метрик доверия.
 * Вызов: POST с заголовком Authorization: Bearer $CRON_SECRET
 * Подключите в crontab или планировщике хостинга (1 раз в сутки).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const batch = 3000
  const users = await prisma.user.findMany({
    select: { id: true },
    take: batch,
    orderBy: { updatedAt: "desc" },
  })

  let ok = 0
  for (const u of users) {
    try {
      await recalculateUserTrust(u.id)
      ok++
    } catch {
      /* продолжаем пакет */
    }
  }

  return NextResponse.json({ ok: true, processed: ok, scanned: users.length })
}
