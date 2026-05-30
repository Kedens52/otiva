import type { WantToBuyStatus } from "@prisma/client"

/** Публичная индексация только для активных заявок в ленте. */
export function isWantToBuyIndexable(status: WantToBuyStatus | string): boolean {
  return status === "ACTIVE"
}
