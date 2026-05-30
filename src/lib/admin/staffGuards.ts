import { adminDb } from "./prismaAdmin"
import { AdminConflictError } from "./errors"

/**
 * Возвращает true если targetId — единственный активный OWNER.
 * Используется перед снятием роли, suspend и revoke.
 */
export async function isLastActiveOwner(targetId: string): Promise<boolean> {
  const ownerCount = await adminDb.staffAccount.count({
    where: { role: "OWNER", status: "ACTIVE" },
  })
  if (ownerCount > 1) return false

  // Единственный OWNER — проверяем что это именно наш target
  const target = await adminDb.staffAccount.findUnique({
    where: { id: targetId },
  })
  return target?.role === "OWNER" && target?.status === "ACTIVE"
}

/**
 * Кидает AdminConflictError если targetId — последний активный OWNER.
 */
export async function guardLastOwner(
  targetId: string,
  message = "Нельзя выполнить операцию над последним Владельцем",
): Promise<void> {
  if (await isLastActiveOwner(targetId)) {
    throw new AdminConflictError(message)
  }
}
