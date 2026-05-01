import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const COOKIE_NAME = 'nashlo_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
}

export interface JWTPayload {
  userId: string
  phone: string
  role: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      phone: true,
      name: true,
      avatar: true,
      description: true,
      city: true,
      role: true,
      isVerified: true,
      isBanned: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
    },
  })

  if (!user || user.isBanned) return null
  return user
}

export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME)
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  // In dev mode, just log to console
  if (!process.env.SMS_API_KEY) {
    console.log(`[DEV] SMS to ${phone}: Your code is ${code}`)
    return
  }

  // Production: integrate with SMS provider (e.g., SMSC.ru)
  const response = await fetch(
    `https://smsc.ru/sys/send.php?login=YOUR_LOGIN&psw=${process.env.SMS_API_KEY}&phones=${encodeURIComponent(phone)}&mes=Your+Нашло+code:+${code}&sender=${process.env.SMS_SENDER || 'Нашло'}&fmt=3`
  )

  if (!response.ok) {
    throw new Error('SMS sending failed')
  }
}

export function formatPhone(phone: string): string {
  // Normalize to +7XXXXXXXXXX format
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) {
    return '+7' + digits.slice(1)
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return '+' + digits
  }
  if (digits.length === 10) {
    return '+7' + digits
  }
  return '+' + digits
}
