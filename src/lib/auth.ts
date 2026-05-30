import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

function getJwtSecret(): Uint8Array {
  const configured = process.env.JWT_SECRET?.trim()
  if (configured) {
    return new TextEncoder().encode(configured)
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production")
  }
  return new TextEncoder().encode("dev-secret-change-before-production")
}

export const COOKIE_NAME = 'nashlo_token'
export const COOKIE_OPTIONS = {
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
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
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
      email: true,
      vkId: true,
      yandexId: true,
      name: true,
      firstName: true,
      lastName: true,
      avatar: true,
      description: true,
      city: true,
      role: true,
      isVerified: true,
      isBanned: true,
      walletBalance: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
      trustTier: true,
      profileType: true,
      companyName: true,
      emailVerified: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      lastLoginAt: true,
    },
  })

  if (!user || user.isBanned) return null
  return {
    ...user,
    authProviders: {
      phone: Boolean(user.phone),
      vk: Boolean(user.vkId),
      yandex: Boolean(user.yandexId),
    },
  }
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
  // Dev mode: log to console
  if (!process.env.SMS_API_KEY) {
    console.log(`[DEV] SMS to ${phone}: код ${code}`)
    return
  }

  // SMS.ru API
  const params = new URLSearchParams({
    api_id: process.env.SMS_API_KEY,
    to: phone,
    msg: `Ваш код для входа на Нашло: ${code}`,
    json: '1',
    from: 'Nashlo',
  })

  const response = await fetch(`https://sms.ru/sms/send?${params.toString()}`)

  if (!response.ok) {
    console.error('SMS.ru HTTP error:', response.status)
    throw new Error('SMS request failed')
  }

  const data = await response.json()
  console.log('SMS.ru response:', JSON.stringify(data))

  if (data.status !== 'OK') {
    throw new Error(`SMS error: ${data.status_text || data.status}`)
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
