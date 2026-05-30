import type { WantToBuyStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { expireStaleWantToBuys } from "@/lib/want-to-buy/expire"
import { WANT_TO_BUY_DETAIL_INCLUDE } from "@/lib/want-to-buy/selects"

const PUBLIC_STATUSES: WantToBuyStatus[] = ["ACTIVE"]

export async function findWantToBuyForViewer(id: string, viewerUserId: string | null) {
  await expireStaleWantToBuys()

  const row = await prisma.wantToBuy.findUnique({
    where: { id },
    include: WANT_TO_BUY_DETAIL_INCLUDE,
  })

  if (!row) return null

  const isOwner = Boolean(viewerUserId && row.userId === viewerUserId)
  const isPublic =
    PUBLIC_STATUSES.includes(row.status) && row.expiresAt > new Date()

  if (!isOwner && !isPublic) return null

  return { row, isOwner, isPublic: isPublic || isOwner }
}
