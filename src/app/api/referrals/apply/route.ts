import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyReferralCode } from "@/lib/bonuses/hooks"

export const dynamic = "force-dynamic"

const schema = z.object({ code: z.string().min(3).max(32) })

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { code } = schema.parse(await req.json())
  const result = await applyReferralCode(user.id, code, prisma)
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Не удалось применить код" }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
