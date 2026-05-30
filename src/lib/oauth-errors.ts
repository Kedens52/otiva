export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  banned: "Ваш аккаунт заблокирован.",
  yandex_denied: "Вход через Яндекс не был завершён.",
  yandex_token: "Не удалось войти через Яндекс. Попробуйте позже.",
  yandex_user: "Не удалось получить данные от Яндекса.",
  yandex_error: "Вход через Яндекс временно недоступен.",
  yandex_state: "Ошибка безопасности. Повторите вход.",
  vk_denied: "Вход через VK не был завершён.",
  vk_token: "Не удалось войти через VK. Попробуйте позже.",
  vk_user: "Не удалось получить данные от VK.",
  vk_error: "Вход через VK временно недоступен.",
  vk_state: "Ошибка безопасности. Повторите вход.",
  vk_code: "Не удалось получить код авторизации VK.",
  rate_limit:
    "С этого устройства уже создано несколько аккаунтов. Войдите в существующий или попробуйте позже.",
}

export function oauthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null
  return OAUTH_ERROR_MESSAGES[code] ?? "Ошибка авторизации. Попробуйте ещё раз."
}
