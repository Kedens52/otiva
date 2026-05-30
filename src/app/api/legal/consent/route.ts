import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { LegalConsentType } from "@prisma/client"
import { z } from "zod"
import { LEGAL_DOCUMENT_VERSION } from "@/lib/legal-meta"

export const dynamic = "force-dynamic"

const itemSchema = z.object({
  type: z.nativeEnum(LegalConsentType),
  documentVersion: z.string().max(16).optional(),
})

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  source: z.string().min(1).max(80),
})

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim() ?? null
  return req.headers.get("x-real-ip")
}

function pairKey(type: LegalConsentType, documentVersion: string) {
  return `${type}\t${documentVersion}`
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const raw = await req.json()
    const parsed = bodySchema.parse(raw)
    const ua = req.headers.get("user-agent")
    const ip = clientIp(req)

    const versionDefault = LEGAL_DOCUMENT_VERSION

    let itemsToSave = parsed.items.map((item) => ({
      type: item.type,
      documentVersion: item.documentVersion ?? versionDefault,
    }))

    if (user?.id && itemsToSave.length > 0) {
      const uniquePairs = Array.from(
        new Map(itemsToSave.map((i) => [pairKey(i.type, i.documentVersion), i])).values(),
      )
      const existing = await prisma.legalConsent.findMany({
        where: {
          userId: user.id,
          OR: uniquePairs.map((i) => ({
            consentType: i.type,
            documentVersion: i.documentVersion,
          })),
        },
        select: { consentType: true, documentVersion: true },
      })
      const already = new Set(existing.map((e) => pairKey(e.consentType, e.documentVersion)))
      const seen = new Set<string>()
      itemsToSave = itemsToSave.filter((i) => {
        const key = pairKey(i.type, i.documentVersion)
        if (already.has(key) || seen.has(key)) return false
        seen.add(key)
        return true
      })
    } else {
      const seen = new Set<string>()
      itemsToSave = itemsToSave.filter((i) => {
        const key = pairKey(i.type, i.documentVersion)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    if (itemsToSave.length === 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    await prisma.legalConsent.createMany({
      data: itemsToSave.map((item) => ({
        userId: user?.id ?? null,
        consentType: item.type,
        documentVersion: item.documentVersion,
        source: parsed.source,
        ip: ip ?? null,
        userAgent: ua ?? null,
      })),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверные данные запроса" }, { status: 400 })
    }
    console.error("legal consent POST:", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
