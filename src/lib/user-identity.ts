import { formatProfileNumber } from "@/lib/profile-hub"

export type AuthProviderKey = "phone" | "vk" | "yandex" | "email"

export type UserIdentityInput = {
  id: string
  phone?: string | null
  email?: string | null
  vkId?: string | null
  yandexId?: string | null
}

export type UserIdentityMeta = {
  userId: string
  publicNumber: string
  /** Стабильный ключ для аналитики и слияния (телефон > email > oauth id) */
  uniqueKey: string
  uniqueKeyLabel: string
  linkedProviders: Array<{ key: AuthProviderKey; label: string; connected: boolean; hint?: string }>
}

const PROVIDER_LABELS: Record<AuthProviderKey, string> = {
  phone: "Телефон",
  email: "Почта",
  vk: "VK ID",
  yandex: "Яндекс ID",
}

export function buildUserIdentityMeta(user: UserIdentityInput): UserIdentityMeta {
  const phone = user.phone?.trim() || null
  const email = user.email?.trim() || null
  const vkId = user.vkId?.trim() || null
  const yandexId = user.yandexId?.trim() || null

  let uniqueKey = user.id
  let uniqueKeyLabel = "ID аккаунта"

  if (phone) {
    uniqueKey = phone
    uniqueKeyLabel = "Телефон"
  } else if (email) {
    uniqueKey = email.toLowerCase()
    uniqueKeyLabel = "Email"
  } else if (vkId) {
    uniqueKey = `vk:${vkId}`
    uniqueKeyLabel = "VK"
  } else if (yandexId) {
    uniqueKey = `yandex:${yandexId}`
    uniqueKeyLabel = "Яндекс"
  }

  const linkedProviders: UserIdentityMeta["linkedProviders"] = [
    { key: "phone", label: PROVIDER_LABELS.phone, connected: Boolean(phone), hint: phone ?? undefined },
    { key: "email", label: PROVIDER_LABELS.email, connected: Boolean(email), hint: email ?? undefined },
    { key: "vk", label: PROVIDER_LABELS.vk, connected: Boolean(vkId), hint: vkId ? `id ${vkId}` : undefined },
    { key: "yandex", label: PROVIDER_LABELS.yandex, connected: Boolean(yandexId), hint: yandexId ? `id ${yandexId}` : undefined },
  ]

  return {
    userId: user.id,
    publicNumber: formatProfileNumber(user.id),
    uniqueKey,
    uniqueKeyLabel,
    linkedProviders,
  }
}
