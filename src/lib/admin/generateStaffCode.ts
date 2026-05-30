import { randomInt } from "crypto"

// Алфавит без омоглифов: O/0/I/1 исключены
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const SEGMENT_LEN = 4
const SEGMENTS = 2

function randomSegment(): string {
  let segment = ""
  for (let i = 0; i < SEGMENT_LEN; i++) {
    segment += ALPHABET[randomInt(0, ALPHABET.length)]
  }
  return segment
}

/**
 * Генерирует одноразовый персональный код сотрудника.
 * Формат: NSH-XXXX-XXXX (криптографически стойкий CSPRNG).
 * Вызывать только на сервере — никогда не логировать результат.
 */
export function generateStaffCode(): string {
  const parts: string[] = []
  for (let i = 0; i < SEGMENTS; i++) {
    parts.push(randomSegment())
  }
  return `NSH-${parts.join("-")}`
}
