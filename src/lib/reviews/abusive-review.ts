const ABUSIVE_PATTERNS = [
  /\b(урод|дура|дебил|сука|убью|убь[юу]|вымогат|шантаж|требую денег|верни деньги или)\w*/i,
  /\b(разнесу|уничтожу|вскрою|взломаю)\w*/i,
  /\b(кидал|кидала|лохотрон|разводняк)\w*/i,
]

export function reviewTextNeedsModeration(text: string | null | undefined): boolean {
  if (!text?.trim()) return false
  return ABUSIVE_PATTERNS.some((p) => p.test(text))
}
