/** Способ регистрации / входа по полям пользователя и пути REGISTRATION-визита. */
export function inferUserAuthSource(
  user: {
    vkId?: string | null
    yandexId?: string | null
    phone?: string | null
    phoneVerifiedAt?: string | Date | null
    email?: string | null
  },
  registrationPath?: string | null,
): string {
  const path = registrationPath?.toLowerCase() ?? ""
  if (path.includes("/vk")) return "VK ID"
  if (path.includes("/yandex")) return "Яндекс ID"
  if (path.includes("/phone")) return "Телефон"

  if (user.vkId) return "VK ID"
  if (user.yandexId) return "Яндекс ID"
  if (user.phoneVerifiedAt || user.phone) return "Телефон"
  if (user.email) return "Email"
  return "Неизвестно"
}

export function authSourceBadgeClass(source: string): string {
  switch (source) {
    case "VK ID":
      return "bg-sky-50 text-sky-700"
    case "Яндекс ID":
      return "bg-red-50 text-red-700"
    case "Телефон":
      return "bg-blue-50 text-blue-700"
    case "Email":
      return "bg-violet-50 text-violet-700"
    default:
      return "bg-zinc-100 text-zinc-600"
  }
}
