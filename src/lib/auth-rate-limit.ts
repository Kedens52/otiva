import type { NextRequest } from "next/server"
import { consumeRateLimit } from "@/lib/rate-limit-store"

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

export function getDeviceKey(request: NextRequest): string {
  const device = request.headers.get("x-device-id")?.trim()
  if (device && device.length >= 8 && device.length <= 128) return device
  return ""
}

function rateKey(parts: string[]) {
  return parts.filter(Boolean).join(":")
}

export const AUTH_LIMITS = {
  sendCodePerIpHour: 10,
  sendCodePerPhone10Min: 3,
  verifyFailPerPhone15Min: 8,
  verifyPerIp15Min: 30,
  newRegistrationPerIpDay: 5,
} as const

export async function checkSendCodeIpLimit(request: NextRequest) {
  const ip = getClientIp(request)
  return consumeRateLimit(rateKey(["otp-send-ip", ip]), 60 * 60 * 1000, AUTH_LIMITS.sendCodePerIpHour)
}

export async function checkVerifyIpLimit(request: NextRequest) {
  const ip = getClientIp(request)
  return consumeRateLimit(rateKey(["otp-verify-ip", ip]), 15 * 60 * 1000, AUTH_LIMITS.verifyPerIp15Min)
}

export async function checkVerifyPhoneFailLimit(phone: string) {
  return consumeRateLimit(rateKey(["otp-verify-fail", phone]), 15 * 60 * 1000, AUTH_LIMITS.verifyFailPerPhone15Min)
}

export async function checkNewRegistrationIpLimit(request: NextRequest) {
  const ip = getClientIp(request)
  const device = getDeviceKey(request)
  const ipOk = await consumeRateLimit(
    rateKey(["reg-ip", ip]),
    24 * 60 * 60 * 1000,
    AUTH_LIMITS.newRegistrationPerIpDay,
  )
  if (!ipOk) return false
  if (device) {
    return consumeRateLimit(
      rateKey(["reg-device", device]),
      24 * 60 * 60 * 1000,
      AUTH_LIMITS.newRegistrationPerIpDay,
    )
  }
  return true
}
