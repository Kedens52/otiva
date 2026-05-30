import bcrypt from "bcryptjs"

const BCRYPT_COST = 12

/**
 * Хеширует персональный код сотрудника.
 * НИКОГДА не логировать аргумент `code`.
 */
export async function hashStaffCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_COST)
}

/**
 * Сравнивает код с хешем. Timing-safe (bcrypt.compare гарантирует это).
 * НИКОГДА не логировать аргумент `code`.
 */
export async function verifyStaffCode(
  code: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

/**
 * Фиктивное сравнение для constant-time protection при отсутствии аккаунта.
 * Вызывать когда login не найден — чтобы время ответа совпадало.
 */
export async function dummyVerify(): Promise<void> {
  // Заведомо неверный код против реального хеша — просто тратим время bcrypt
  await bcrypt.compare(
    "NSH-0000-0000",
    "$2a$12$dummy.hash.that.will.never.match.anything.at.all.xx",
  )
}
