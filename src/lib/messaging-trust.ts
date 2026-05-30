import { prisma } from "@/lib/prisma"
import { getSupportUser } from "@/lib/support"

/**
 * Ограничение переписки между пользователями (не затрагивает чат с поддержкой).
 */
export async function canSendMarketplaceMessage(
  senderId: string,
  opts: { conversationId?: string; recipientId?: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  let toSupport = false
  if (opts.recipientId) {
    try {
      const su = await getSupportUser()
      if (su && su.id === opts.recipientId) toSupport = true
    } catch {
      /* support user не настроен */
    }
  }
  if (opts.conversationId && !toSupport) {
    const c = await prisma.conversation.findUnique({
      where: { id: opts.conversationId },
      select: { isSupport: true },
    })
    if (c?.isSupport) toSupport = true
  }
  if (toSupport) return { ok: true }

  const u = await prisma.user.findUnique({
    where: { id: senderId },
    select: { trustTier: true, accountRestricted: true, isBanned: true },
  })
  if (!u || u.isBanned) {
    return {
      ok: false,
      message:
        "Аккаунт ограничен из-за нарушения правил сервиса. Если вы считаете это ошибкой, обратитесь в поддержку.",
    }
  }
  if (u.accountRestricted || u.trustTier === "HIGH_RISK" || u.trustTier === "BLOCKED") {
    return {
      ok: false,
      message: "По правилам сервиса это действие требует дополнительной проверки.",
    }
  }
  return { ok: true }
}
