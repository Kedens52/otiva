import { NextRequest, NextResponse } from "next/server"
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth"
import { findOrCreateOAuthUser } from "@/lib/oauth-users"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("state") || "/profile"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nashlo.ru"

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=vk_denied`)
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/vk/callback`
    const tokenRes = await fetch(
      `https://oauth.vk.com/access_token?client_id=${process.env.VK_CLIENT_ID}&client_secret=${process.env.VK_CLIENT_SECRET}&redirect_uri=${redirectUri}&code=${code}`,
      { cache: "no-store" },
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("VK token error:", tokenData)
      return NextResponse.redirect(`${baseUrl}/login?error=vk_token`)
    }

    const accessToken = String(tokenData.access_token || "")
    const userId = String(tokenData.user_id || "")
    const email = typeof tokenData.email === "string" ? tokenData.email : null

    const userRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=photo_200,city&access_token=${encodeURIComponent(accessToken)}&v=5.131`,
      { cache: "no-store" },
    )
    const userData = await userRes.json()
    const vkUser = userData.response?.[0]

    if (!vkUser?.id) {
      return NextResponse.redirect(`${baseUrl}/login?error=vk_user`)
    }

    const user = await findOrCreateOAuthUser({
      provider: "vk",
      providerId: String(vkUser.id),
      email,
      name: `${vkUser.first_name || ""} ${vkUser.last_name || ""}`.trim(),
      avatar: vkUser.photo_200 || null,
      city: vkUser.city?.title || null,
    })

    if (user.isBanned) {
      return NextResponse.redirect(`${baseUrl}/login?error=banned`)
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone || "",
      role: user.role,
    })

    const response = NextResponse.redirect(`${baseUrl}${next.startsWith("/") ? next : "/profile"}`)
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error("VK OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/login?error=vk_error`)
  }
}
