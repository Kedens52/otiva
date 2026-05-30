import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Публичный VAPID-ключ для PushManager.subscribe (без авторизации). */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    return NextResponse.json({ publicKey: null, configured: false })
  }
  return NextResponse.json({ publicKey, configured: true })
}
