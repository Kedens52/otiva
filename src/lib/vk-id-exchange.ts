import type { NextRequest } from "next/server"
import { getSession, signToken } from "@/lib/auth"
import { findOrCreateOAuthUser, RegistrationRateLimitError } from "@/lib/oauth-users"
import { checkNewRegistrationIpLimit, getClientIp } from "@/lib/auth-rate-limit"
import { recordRegistrationVisit, recordUserLogin } from "@/lib/analytics/record-visit"
import { oauthDebug } from "@/lib/oauth-debug"
import { recalculateUserTrust } from "@/lib/user-trust-engine"
import { prisma } from "@/lib/prisma"
import { getVkAppId, getVkRedirectUri, isVkServerConfigured } from "@/lib/vk-id-config"

export type VkIdProfile = {
  vkId: string
  name: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  city: string | null
  email: string | null
  phone: string | null
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function profileFromVkIdUserInfo(data: Record<string, unknown>): VkIdProfile | null {
  const user =
    data.user && typeof data.user === "object" && !Array.isArray(data.user)
      ? (data.user as Record<string, unknown>)
      : data
  const rawId = text(data.user_id) ?? text(user.user_id) ?? text(user.id) ?? text(data.sub)
  if (!rawId) return null

  const firstName = text(user.first_name) ?? text(user.given_name) ?? ""
  const lastName = text(user.last_name) ?? text(user.family_name) ?? ""
  const name =
    (text(user.name) ?? `${firstName} ${lastName}`.trim()) || "Пользователь VK"

  const cityValue = user.city
  const city =
    typeof cityValue === "object" && cityValue
      ? text((cityValue as Record<string, unknown>).title)
      : text(cityValue)

  const avatar =
    text(user.avatar) ??
    text(user.photo_max) ??
    text(user.photo_200) ??
    text(user.photo_100) ??
    text(user.picture)

  return {
    vkId: rawId,
    name,
    firstName: firstName || null,
    lastName: lastName || null,
    avatar,
    city,
    email: text(user.email) ?? text(data.email),
    phone: text(user.phone),
  }
}

async function fetchVkIdUserInfo(accessToken: string, clientId: string): Promise<VkIdProfile | null> {
  const res = await fetch("https://id.vk.com/oauth2/user_info", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({ client_id: clientId }),
    cache: "no-store",
  })
  if (!res.ok) return null
  const data = (await res.json()) as Record<string, unknown>
  return profileFromVkIdUserInfo(data)
}

async function fetchVkApiProfile(accessToken: string, userId: string): Promise<VkIdProfile | null> {
  const res = await fetch(
    `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=photo_200,photo_100,photo_max_orig,city&access_token=${encodeURIComponent(accessToken)}&v=5.131`,
    { cache: "no-store" },
  )
  if (!res.ok) return null
  const data = await res.json()
  const vkUser = data.response?.[0] as Record<string, unknown> | undefined
  if (!vkUser?.id) return null
  const firstName = text(vkUser.first_name) ?? ""
  const lastName = text(vkUser.last_name) ?? ""
  return {
    vkId: String(vkUser.id),
    name: `${firstName} ${lastName}`.trim() || "Пользователь VK",
    firstName: firstName || null,
    lastName: lastName || null,
    avatar:
      text(vkUser.photo_200) ?? text(vkUser.photo_max_orig) ?? text(vkUser.photo_100),
    city:
      typeof vkUser.city === "object" && vkUser.city
        ? text((vkUser.city as Record<string, unknown>).title)
        : null,
    email: null,
    phone: null,
  }
}

export async function exchangeVkIdCode(
  code: string,
  deviceId: string,
  request?: NextRequest,
): Promise<{ accessToken: string; profile: VkIdProfile }> {
  if (!isVkServerConfigured()) {
    throw new Error("vk_not_configured")
  }

  const clientId = String(getVkAppId())
  const clientSecret = process.env.VK_CLIENT_SECRET!.trim()
  const redirectUri = getVkRedirectUri(request)

  const tokenRes = await fetch("https://id.vk.com/oauth2/auth", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      device_id: deviceId,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  })

  const tokenData = (await tokenRes.json()) as Record<string, unknown>
  const vkError = text(tokenData.error) ?? text(tokenData.error_description)
  oauthDebug("vk_id_token_exchange", {
    ok: tokenRes.ok,
    status: tokenRes.status,
    error: vkError,
  })

  if (!tokenRes.ok || tokenData.error) {
    throw new Error(vkError || "vk_token_exchange_failed")
  }

  const accessToken = text(tokenData.access_token)
  if (!accessToken) throw new Error("vk_token_missing")

  let profile = await fetchVkIdUserInfo(accessToken, clientId)
  const userId = text(tokenData.user_id) ?? profile?.vkId
  if (!profile && userId) {
    profile = await fetchVkApiProfile(accessToken, userId)
  }
  if (!profile) throw new Error("vk_profile_missing")

  return { accessToken, profile }
}

export async function loginWithVkProfile(request: NextRequest, profile: VkIdProfile) {
  const session = await getSession()
  let user: Awaited<ReturnType<typeof findOrCreateOAuthUser>>["user"]
  let isNew: boolean
  try {
    const result = await findOrCreateOAuthUser(
      {
        provider: "vk",
        providerId: profile.vkId,
        email: profile.email,
        phone: profile.phone,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        city: profile.city,
      },
      {
        preferredUserId: session?.userId,
        assertCanRegister: async () => {
          if (!(await checkNewRegistrationIpLimit(request))) {
            throw new RegistrationRateLimitError()
          }
        },
      },
    )
    user = result.user
    isNew = result.isNew
  } catch (error) {
    if (error instanceof RegistrationRateLimitError) throw new Error("rate_limit")
    throw error
  }

  if (user.isBanned) {
    throw new Error("banned")
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: getClientIp(request) },
  })

  if (isNew) {
    void recordRegistrationVisit(request, user.id, "vk")
    const { tryWelcomeBonus } = await import("@/lib/bonuses/hooks")
    void tryWelcomeBonus(user.id, prisma).catch(() => {})
  } else {
    void recordUserLogin(request, user.id, "vk")
  }
  void recalculateUserTrust(user.id).catch(() => {})

  const token = await signToken({
    userId: user.id,
    phone: user.phone || "",
    role: user.role,
  })

  return { user, isNew, token }
}
