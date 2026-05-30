/**
 * In-memory rate limiter для admin login.
 * TODO: replace with Redis/Upstash для multi-instance deployments.
 *
 * Окно: 15 минут.
 * Лимиты: 10 попыток на IP, 5 попыток на login.
 */

const WINDOW_MS  = 15 * 60 * 1000   // 15 минут
const IP_LIMIT   = 10
const LOGIN_LIMIT = 5

type Bucket = {
  count:     number
  resetAt:   number
}

// Единый Map для всех ключей — периодически чистится
const buckets = new Map<string, Bucket>()

// Очистка просроченных записей раз в 5 минут
let cleanupTimer: ReturnType<typeof setTimeout> | null = null

function scheduleCleanup(): void {
  if (cleanupTimer) return
  cleanupTimer = setTimeout(() => {
    const now = Date.now()
    for (const [key, bucket] of Array.from(buckets.entries())) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
    cleanupTimer = null
    if (buckets.size > 0) scheduleCleanup()
  }, 5 * 60 * 1000)
}

function getBucket(key: string): Bucket {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(key, bucket)
    scheduleCleanup()
  }
  return bucket
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterMs: number }

/**
 * Проверяет и инкрементирует счётчики для IP и login.
 * Вызывать ДО любой бизнес-логики.
 */
export function checkLoginRateLimit(
  ip:    string | null,
  login: string,
): RateLimitResult {
  const now = Date.now()

  // Проверяем IP
  if (ip) {
    const ipKey    = `ip:${ip}:login`
    const ipBucket = getBucket(ipKey)
    if (ipBucket.count >= IP_LIMIT) {
      return { limited: true, retryAfterMs: ipBucket.resetAt - now }
    }
  }

  // Проверяем login
  const loginKey    = `login:${login}:login`
  const loginBucket = getBucket(loginKey)
  if (loginBucket.count >= LOGIN_LIMIT) {
    return { limited: true, retryAfterMs: loginBucket.resetAt - now }
  }

  // Инкрементируем оба счётчика
  if (ip) getBucket(`ip:${ip}:login`).count++
  getBucket(`login:${login}:login`).count++

  return { limited: false }
}

/**
 * Сбрасывает счётчик для login после успешного входа.
 */
export function resetLoginRateLimit(ip: string | null, login: string): void {
  buckets.delete(`login:${login}:login`)
  if (ip) buckets.delete(`ip:${ip}:login`)
}
