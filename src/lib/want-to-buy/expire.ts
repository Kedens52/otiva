import { prisma } from "@/lib/prisma"

/** Помечает просроченные ACTIVE-заявки как EXPIRED (идемпотентно). */
export async function expireStaleWantToBuys(): Promise<number> {
  try {
    const result = await prisma.wantToBuy.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    })
    return result.count
  } catch (error) {
    console.error("expireStaleWantToBuys:", error)
    return 0
  }
}
