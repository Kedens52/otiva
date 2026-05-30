import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit } from "@/lib/admin/audit"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  status: z.enum(["reviewed", "dismissed"]),
  blockImageHash: z.boolean().optional(),
})

export const PATCH = withAdminApi(async ({ staff, req }) => {
  const id = req.nextUrl.pathname.split("/").pop()
  if (!id) {
    return NextResponse.json({ error: "Не указан id" }, { status: 400 })
  }

  try {
    const body = patchSchema.parse(await req.json())

    const incident = await prisma.contentModerationIncident.findUnique({
      where: { id },
    })
    if (!incident) {
      return NextResponse.json({ error: "Инцидент не найден" }, { status: 404 })
    }

    const updated = await prisma.contentModerationIncident.update({
      where: { id },
      data: {
        status: body.status,
        reviewedAt: new Date(),
        staffId: staff.id,
      },
    })

    if (body.blockImageHash && incident.source === "LISTING_UPLOAD") {
      const payload = incident.payload as { sha256?: string }
      if (payload.sha256) {
        await prisma.uploadedMediaFingerprint.updateMany({
          where: { sha256: payload.sha256 },
          data: {
            blocked: true,
            blockReason: "Заблокировано модератором после инцидента",
          },
        })
      }
    }

    void writeAudit({
      actorId: staff.id,
      action: "content.incident_reviewed",
      targetType: "ContentModerationIncident",
      targetId: incident.id,
      metadata: { status: body.status, blockImageHash: body.blockImageHash ?? false },
    })

    return NextResponse.json({
      item: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
    }
    console.error("admin content-incidents PATCH:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.moderate")
