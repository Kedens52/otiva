import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CookieConsentChoice } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import {
  applyAnalyticsConsentCookie,
  hasAnalyticsConsentInRequest,
} from "@/lib/cookie-consent-server"
import { getVisitorIdFromRequest } from "@/lib/analytics/record-visit"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  choice: z.enum(["analytics", "essential"]),
  source: z.string().min(1).max(80),
})

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim() ?? null
  return req.headers.get("x-real-ip")
}

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json())
    const user = await getCurrentUser()
    const ua = req.headers.get("user-agent")
    const ip = clientIp(req)
    const visitorId = getVisitorIdFromRequest(req)

    const choiceEnum: CookieConsentChoice =
      body.choice === "analytics"
        ? CookieConsentChoice.ANALYTICS_ACCEPTED
        : CookieConsentChoice.ESSENTIAL_ONLY

    await prisma.cookieConsentEvent.create({
      data: {
        choice: choiceEnum,
        source: body.source,
        userId: user?.id ?? null,
        visitorId,
        ip,
        userAgent: ua?.slice(0, 500) ?? null,
      },
    })

    const res = NextResponse.json({ ok: true, choice: body.choice })
    applyAnalyticsConsentCookie(res, body.choice === "analytics")
    return res
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }
    console.error("cookie consent POST:", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

/** Текущий выбор (по httpOnly cookie на сервере). */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    analytics: hasAnalyticsConsentInRequest(req),
  })
}
