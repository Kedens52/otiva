import { createHash, randomUUID } from "crypto"
import type { NextRequest } from "next/server"
import type { SiteVisitType } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const VISITOR_COOKIE = "nashlo_vid"
const DEDUP_MS = 45_000

export const VISITOR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
} as const

export function requestFingerprint(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  const ua = req.headers.get("user-agent") ?? ""
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 16)
}

export function isBotUserAgent(ua: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|yandexbot|googlebot|bingbot|duckduckbot/i.test(
    ua,
  )
}

export function getVisitorIdFromRequest(req: NextRequest): string | null {
  return req.cookies.get(VISITOR_COOKIE)?.value ?? null
}

export function newVisitorId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 24)
}

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed || !trimmed.startsWith("/")) return "/"
  return trimmed.slice(0, 500)
}

type RecordSiteVisitParams = {
  req: NextRequest
  path: string
  referrer?: string | null
  type?: SiteVisitType
  userId?: string | null
  visitorId?: string | null
}

/** Записывает заход/переход. Не бросает наружу — телеметрия не должна ломать UX. */
export async function recordSiteVisit(
  params: RecordSiteVisitParams,
): Promise<{ visitorId: string; created: boolean }> {
  try {
    const ua = params.req.headers.get("user-agent") ?? ""
    if (isBotUserAgent(ua)) {
      const visitorId = params.visitorId ?? getVisitorIdFromRequest(params.req) ?? newVisitorId()
      return { visitorId, created: false }
    }

    const fingerprint = requestFingerprint(params.req)
    const visitorId = params.visitorId ?? getVisitorIdFromRequest(params.req) ?? newVisitorId()
    const path = normalizePath(params.path)
    const type = params.type ?? "PAGE_VIEW"

    if (type === "PAGE_VIEW") {
      const since = new Date(Date.now() - DEDUP_MS)
      const recent = await prisma.siteVisit.findFirst({
        where: {
          visitorId,
          path,
          type: "PAGE_VIEW",
          createdAt: { gte: since },
        },
        select: { id: true },
      })
      if (recent) return { visitorId, created: false }
    }

    const ip =
      reqIp(params.req)

    await prisma.siteVisit.create({
      data: {
        type,
        path,
        referrer: params.referrer?.trim().slice(0, 500) || null,
        userId: params.userId ?? null,
        visitorId,
        fingerprint,
        ip,
        userAgent: ua.slice(0, 500) || null,
      },
    })

    return { visitorId, created: true }
  } catch (err) {
    console.error("[analytics] recordSiteVisit failed:", (err as Error).message)
    return {
      visitorId: params.visitorId ?? getVisitorIdFromRequest(params.req) ?? newVisitorId(),
      created: false,
    }
  }
}

function reqIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  )
}

export async function recordRegistrationVisit(
  req: NextRequest,
  userId: string,
  source: "phone" | "vk" | "yandex",
): Promise<void> {
  await recordSiteVisit({
    req,
    path: `/auth/register/${source}`,
    type: "REGISTRATION",
    userId,
  })
}

export async function recordUserLogin(
  req: NextRequest,
  userId: string,
  source: "phone" | "vk" | "yandex",
): Promise<void> {
  await recordSiteVisit({
    req,
    path: `/auth/login/${source}`,
    type: "LOGIN",
    userId,
  })
}
