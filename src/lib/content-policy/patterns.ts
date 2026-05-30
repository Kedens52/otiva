/** Единые правила запрещённого и рискованного текста (объявления и «Куплю»). */
export type ContentPatternRule = { pattern: RegExp; reason: string; code: string }

export const HARD_BLOCK_PATTERNS: ContentPatternRule[] = [
  {
    pattern: /\b(наркот|закладк|спайс|меф|кокаин|гашиш|героин|амфетамин|лсд)\w*/i,
    reason: "Запрещённые вещества или связанные с ними услуги",
    code: "PROHIBITED_ITEM",
  },
  {
    pattern: /\b(оружие|пистолет|автомат|боеприпас|патрон|гранат|взрывчат)\w*/i,
    reason: "Запрещённый товар",
    code: "PROHIBITED_ITEM",
  },
  {
    pattern: /\b(паспорт|права|водительское удостоверение|диплом|справк[аи])\b.*\b(купить|продам|изготов|поддел)\w*/i,
    reason: "Документы или услуги по их изготовлению",
    code: "PROHIBITED_ITEM",
  },
  {
    pattern: /\b(казино|ставки|букмекер|заработок без вложений|финансовая пирамида|mlm|хайп)\b/i,
    reason: "Риск мошенничества или запрещённая реклама",
    code: "PROHIBITED_ITEM",
  },
  {
    pattern: /\b(интим|эскорт|проститут|секс\s*услуг|порно)\w*/i,
    reason: "Запрещённая услуга",
    code: "PROHIBITED_ITEM",
  },
  {
    pattern: /\b(орган|почк[аи]|донорство\s*орган)\b.*\b(купить|продам|нужен)\w*/i,
    reason: "Запрещённая тематика",
    code: "PROHIBITED_ITEM",
  },
  {
    pattern: /\b(взлом|ддос|ботнет|краденые?\s*данн|слив\s*баз)\w*/i,
    reason: "Незаконные услуги",
    code: "PROHIBITED_ITEM",
  },
]

export const REVIEW_PATTERNS: ContentPatternRule[] = [
  {
    pattern: /\+?\d[\d\s().-]{8,}\d/,
    reason: "Контактный телефон в тексте",
    code: "SUSPICIOUS_LINKS",
  },
  {
    pattern: /\b(telegram|телеграм|whatsapp|ватсап|viber|вайбер|max\.ru)\b/i,
    reason: "Контакты мессенджеров в тексте",
    code: "SUSPICIOUS_LINKS",
  },
  {
    pattern: /(?:https?:\/\/|www\.)\S+/i,
    reason: "Внешняя ссылка в тексте",
    code: "SUSPICIOUS_LINKS",
  },
  {
    pattern: /[^\s@]+@[^\s@]+\.[^\s@]+/i,
    reason: "Email в тексте",
    code: "SUSPICIOUS_LINKS",
  },
  {
    pattern: /(.)\1{6,}/i,
    reason: "Слишком много повторяющихся символов",
    code: "SPAM",
  },
  {
    pattern: /[A-ZА-ЯЁ]{18,}/,
    reason: "Слишком много текста заглавными буквами",
    code: "SPAM",
  },
]
