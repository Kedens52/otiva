import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrCreateSupportConversation, getSupportUser } from "@/lib/support"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Укажите корректный email").max(200).optional(),
  text: z.string().trim().min(10, "Напишите хотя бы 10 символов").max(4000),
})

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json())
    const user = await getCurrentUser()

    const contactEmail = body.email || user?.email || undefined
    if (!contactEmail) {
      return NextResponse.json({ error: "Укажите email для ответа" }, { status: 400 })
    }
    const contactName = body.name || user?.name || "Рекламодатель"
    const note = `[Реклама · пожелание]\n${body.text}${contactEmail ? `\n\nКонтакт: ${contactEmail}` : ""}`

    await prisma.businessClient.create({
      data: {
        companyName: contactName.slice(0, 200) || "Пожелание по рекламе",
        email: contactEmail,
        contactName: contactName.slice(0, 120),
        source: "advertising_feedback",
        notes: body.text,
        status: "NEW",
      },
    })

    if (user) {
      const { conversation } = await getOrCreateSupportConversation(user.id)
      const supportUser = await getSupportUser()
      await prisma.message.create({
        data: {
          text: note,
          images: [],
          conversationId: conversation.id,
          senderId: user.id,
        },
      })
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          supportWorkflowStatus: "WAITING_OPERATOR",
          operatorNeeded: true,
          updatedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Некорректные данные" }, { status: 400 })
    }
    console.error("advertising feedback POST error:", error)
    return NextResponse.json({ error: "Не удалось отправить. Попробуйте позже." }, { status: 500 })
  }
}
