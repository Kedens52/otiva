import { NextResponse } from "next/server"
import { getVkRedirectUri } from "@/lib/app-base-url"
import { getVkAppId, isVkConfigured } from "@/lib/vk-id-config"

export const dynamic = "force-dynamic"

export async function GET() {
  const appId = getVkAppId()
  return NextResponse.json({
    enabled: isVkConfigured(),
    appId,
    redirectUrl: getVkRedirectUri(),
  })
}
