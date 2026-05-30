import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import {
  getVisitorIdFromRequest,
  recordSiteVisit,
  VISITOR_COOKIE,
  VISITOR_COOKIE_OPTIONS,
} from "@/lib/analytics/record-visit"
import { hasAnalyticsConsentInRequest } from "@/lib/cookie-consent-server"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!hasAnalyticsConsentInRequest(request)) {
      return NextResponse.json({ ok: true, skipped: "no_analytics_consent" })
    }

    const body = bodySchema.parse(await request.json())
    const user = await getCurrentUser()
    const existingVisitorId = getVisitorIdFromRequest(request)

    const { visitorId, created } = await recordSiteVisit({
      req: request,
      path: body.path,
      referrer: body.referrer,
      userId: user?.id,
      visitorId: existingVisitorId,
    })

    const res = NextResponse.json({ ok: true, created })
    if (!existingVisitorId || existingVisitorId !== visitorId) {
      res.cookies.set(VISITOR_COOKIE, visitorId, VISITOR_COOKIE_OPTIONS)
    }
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
