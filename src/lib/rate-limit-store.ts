type MemoryBucket = { count: number; resetAt: number }
const memoryBuckets = new Map<string, MemoryBucket>()

type RedisClient = {
  incr(key: string): Promise<number>
  pexpire(key: string, ms: number): Promise<number>
}

let redisClient: RedisClient | null | undefined

function redisKey(prefix: string, key: string) {
  return `nashlo:rl:${prefix}:${key}`
}

function consumeMemory(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= maxRequests) return false
  bucket.count += 1
  return true
}

async function getRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null
  if (redisClient !== undefined) return redisClient

  try {
    // Keep Redis truly optional in dev/runtime: if the package is absent,
    // fall back to in-memory rate limiting instead of breaking module resolution.
    const dynamicImport = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<{ default: new (url: string, options: Record<string, unknown>) => RedisClient }>
    const { default: Redis } = await dynamicImport("ioredis")
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
    redisClient = client
    return client
  } catch (error) {
    console.warn("rate-limit: Redis недоступен, используем память", error)
    redisClient = null
    return null
  }
}

async function consumeRedis(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<boolean | null> {
  const redis = await getRedisClient()
  if (!redis) return null

  const fullKey = redisKey("v1", key)
  const count = await redis.incr(fullKey)
  if (count === 1) {
    await redis.pexpire(fullKey, windowMs)
  }
  return count <= maxRequests
}

/**
 * true = запрос разрешён, false = лимит исчерпан.
 * С REDIS_URL — общий лимит для всех инстансов.
 */
export async function consumeRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<boolean> {
  const fromRedis = await consumeRedis(key, windowMs, maxRequests)
  if (fromRedis !== null) return fromRedis
  return consumeMemory(key, windowMs, maxRequests)
}

/** Только для unit-тестов */
export function resetRateLimitStoreForTests() {
  memoryBuckets.clear()
  redisClient = undefined
}
