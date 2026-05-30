import { NextResponse } from "next/server"
import { isVkConfigured } from "@/lib/vk-id-config"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    vk: isVkConfigured(),
    yandex: Boolean(
      process.env.YANDEX_CLIENT_ID?.trim() && process.env.YANDEX_CLIENT_SECRET?.trim(),
    ),
  })
}
