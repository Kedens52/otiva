const messageBuckets = new Map<string, { count: number; resetAt: number }>()

export function checkSupportRateLimit(userId: string, limit = 40, windowMs = 60_000): boolean {
  const now = Date.now()
  const bucket = messageBuckets.get(userId)
  if (!bucket || now > bucket.resetAt) {
    messageBuckets.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}
