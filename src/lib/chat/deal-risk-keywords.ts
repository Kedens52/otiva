/**
 * Фразы, часто встречающиеся в попытках увести сделку из чата сервиса.
 * Используется в UI чата и (при необходимости) в серверной аналитике доверия.
 */
export const DEAL_RISK_KEYWORD_RE =
  /\b(предоплат[аы]?|переведи|на\s+карт[уе]|карт[аы][\s,.]|ссылк[аи]|доставк[аи]\s+через|whatsapp|ватсап|telegram|телеграм|срочно)\b/i

export function messageLooksLikeDealRisk(text: string): boolean {
  return DEAL_RISK_KEYWORD_RE.test(text)
}

export const DEAL_RISK_DISCLAIMER_RU =
  "Будьте осторожны. Nashlo не участвует в сделке и не принимает оплату между пользователями. Не переводите деньги заранее, если не уверены в собеседнике."
