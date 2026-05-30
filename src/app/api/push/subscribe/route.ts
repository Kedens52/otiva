import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const subscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth:   z.string().min(1),
  }),
})

const deleteBody = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const json = await request.json()
    const body = subscribeBody.parse(json)
    const userAgent = request.headers.get("user-agent") ?? undefined

    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId:    user.id,
        endpoint:  body.endpoint,
        p256dh:    body.keys.p256dh,
        auth:      body.keys.auth,
        userAgent,
      },
      update: {
        userId:    user.id,
        p256dh:    body.keys.p256dh,
        auth:      body.keys.auth,
        userAgent,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Неверные данные" }, { status: 400 })
    }
    console.error("POST /api/push/subscribe", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const json = await request.json().catch(() => null)
    const body = deleteBody.parse(json)

    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: body.endpoint },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Неверные данные" }, { status: 400 })
    }
    console.error("DELETE /api/push/subscribe", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
