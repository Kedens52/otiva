import { adminDb } from "@/lib/admin/prismaAdmin"
import { parseUserAgentSummary } from "@/lib/admin/parse-user-agent"
import { inferUserAuthSource } from "@/lib/admin/user-auth-source"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type ActivityTab = "visits" | "registrations" | "logins" | "staff"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export type DashboardVisitRow = {
  id: string
  at: string
  path: string
  referrer: string | null
  type: string
  visitorId: string
  user: { id: string; name: string | null; phone: string | null } | null
  ip: string | null
  userAgent: string | null
  device: string | null
}

export type DashboardRegistrationRow = {
  id: string
  at: string
  user: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
    city: string | null
    profileType: string
  }
  authSource: string
  ip: string | null
  path: string | null
}

export type DashboardUserLoginRow = {
  id: string
  at: string
  path: string
  authSource: string
  user: { id: string; name: string | null; phone: string | null }
  ip: string | null
  userAgent: string | null
  device: string | null
  source: "login_event" | "session"
}

export type DashboardStaffLoginRow = {
  id: string
  at: string
  action: string
  staffLogin: string | null
  staffName: string | null
  ip: string | null
  userAgent: string | null
  device: string | null
  metadata: Record<string, unknown> | null
}

export type ActivityQuery = {
  tab: ActivityTab
  days?: number
  q?: string
  guestOnly?: boolean
  authOnly?: boolean
  cursor?: string
  limit?: number
  showSensitive: boolean
  canViewUsers: boolean
}

export type ActivityResult =
  | { tab: "visits"; items: DashboardVisitRow[]; nextCursor: string | null }
  | { tab: "registrations"; items: DashboardRegistrationRow[]; nextCursor: string | null }
  | { tab: "logins"; items: DashboardUserLoginRow[]; nextCursor: string | null }
  | { tab: "staff"; items: DashboardStaffLoginRow[]; nextCursor: string | null }

function sinceDate(days?: number): Date | undefined {
  if (!days || days <= 0) return undefined
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function loginSourceFromPath(path: string | null): string {
  if (!path) return "Неизвестно"
  if (path.includes("/phone")) return "Телефон"
  if (path.includes("/vk")) return "VK"
  if (path.includes("/yandex")) return "Яндекс"
  return inferUserAuthSource({}, path)
}

function userSearchOr(q: string): Prisma.UserWhereInput {
  return {
    OR: [
      { id: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ],
  }
}

export async function getActivityForTab(query: ActivityQuery): Promise<ActivityResult> {
  const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  const since = sinceDate(query.days ?? 7)
  const q = query.q?.trim()
  const sensitive = query.showSensitive

  switch (query.tab) {
    case "visits":
      return {
        tab: "visits",
        ...(await fetchVisits({ limit, since, q, sensitive, canViewUsers: query.canViewUsers, guestOnly: query.guestOnly, authOnly: query.authOnly, cursor: query.cursor })),
      }
    case "registrations":
      return {
        tab: "registrations",
        ...(await fetchRegistrations({ limit, since, q, sensitive, canViewUsers: query.canViewUsers, cursor: query.cursor })),
      }
    case "logins":
      return {
        tab: "logins",
        ...(await fetchLogins({ limit, since, q, sensitive, canViewUsers: query.canViewUsers, cursor: query.cursor })),
      }
    case "staff":
      return {
        tab: "staff",
        ...(await fetchStaffLogins({ limit, since, q, sensitive, cursor: query.cursor })),
      }
  }
}

async function fetchVisits(opts: {
  limit: number
  since?: Date
  q?: string
  sensitive: boolean
  canViewUsers: boolean
  guestOnly?: boolean
  authOnly?: boolean
  cursor?: string
}) {
  const where: Prisma.SiteVisitWhereInput = {
    type: "PAGE_VIEW",
    ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
    ...(opts.guestOnly ? { userId: null } : {}),
    ...(opts.authOnly ? { userId: { not: null } } : {}),
  }

  if (opts.q) {
    where.AND = [
      {
        OR: [
          { path: { contains: opts.q, mode: "insensitive" } },
          { visitorId: { contains: opts.q, mode: "insensitive" } },
          { referrer: { contains: opts.q, mode: "insensitive" } },
          ...(opts.sensitive ? [{ ip: { contains: opts.q } }] : []),
          ...(opts.canViewUsers ? [{ user: userSearchOr(opts.q) }] : []),
        ],
      },
    ]
  }

  const rows = await prisma.siteVisit.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      path: true,
      referrer: true,
      type: true,
      createdAt: true,
      visitorId: true,
      ip: true,
      userAgent: true,
      user: opts.canViewUsers
        ? { select: { id: true, name: true, phone: true } }
        : false,
    },
  })

  const hasMore = rows.length > opts.limit
  const page = hasMore ? rows.slice(0, opts.limit) : rows

  return {
    items: page.map((v) => ({
      id: v.id,
      at: v.createdAt.toISOString(),
      path: v.path,
      referrer: v.referrer,
      type: v.type,
      visitorId: v.visitorId,
      user: v.user ?? null,
      ip: opts.sensitive ? v.ip : null,
      userAgent: opts.sensitive ? v.userAgent : null,
      device: opts.sensitive ? parseUserAgentSummary(v.userAgent).label : null,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  }
}

async function fetchRegistrations(opts: {
  limit: number
  since?: Date
  q?: string
  sensitive: boolean
  canViewUsers: boolean
  cursor?: string
}) {
  const where: Prisma.SiteVisitWhereInput = {
    type: "REGISTRATION",
    ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
    ...(opts.q && opts.canViewUsers ? { user: userSearchOr(opts.q) } : {}),
    ...(opts.q && !opts.canViewUsers ? { path: { contains: opts.q, mode: "insensitive" } } : {}),
  }

  const rows = await prisma.siteVisit.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      path: true,
      createdAt: true,
      ip: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          city: true,
          profileType: true,
          vkId: true,
          yandexId: true,
          phoneVerifiedAt: true,
          createdAt: true,
        },
      },
    },
  })

  const hasMore = rows.length > opts.limit
  const page = hasMore ? rows.slice(0, opts.limit) : rows

  const items: DashboardRegistrationRow[] = []
  for (const v of page) {
    if (!v.user) continue
    items.push({
      id: v.id,
      at: v.createdAt.toISOString(),
      user: {
        id: v.user.id,
        name: v.user.name,
        phone: v.user.phone,
        email: v.user.email,
        city: v.user.city,
        profileType: v.user.profileType,
      },
      authSource: inferUserAuthSource(v.user, v.path),
      ip: opts.sensitive ? v.ip : null,
      path: v.path,
    })
  }

  return { items, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null }
}

async function fetchLogins(opts: {
  limit: number
  since?: Date
  q?: string
  sensitive: boolean
  canViewUsers: boolean
  cursor?: string
}) {
  const loginWhere: Prisma.SiteVisitWhereInput = {
    type: "LOGIN",
    ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
  }

  if (opts.q) {
    loginWhere.AND = [
      {
        OR: [
          { path: { contains: opts.q, mode: "insensitive" } },
          ...(opts.sensitive ? [{ ip: { contains: opts.q } }] : []),
          ...(opts.canViewUsers ? [{ user: userSearchOr(opts.q) }] : []),
        ],
      },
    ]
  }

  const cursorId = opts.cursor?.startsWith("sv_") ? opts.cursor.slice(3) : opts.cursor ?? undefined

  const loginRows = await prisma.siteVisit.findMany({
    where: loginWhere,
    orderBy: { createdAt: "desc" },
    take: opts.limit + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      path: true,
      createdAt: true,
      ip: true,
      userAgent: true,
      user: opts.canViewUsers
        ? { select: { id: true, name: true, phone: true } }
        : false,
    },
  })

  const hasMore = loginRows.length > opts.limit
  const page = hasMore ? loginRows.slice(0, opts.limit) : loginRows

  let items: DashboardUserLoginRow[] = page
    .filter((r) => r.user)
    .map((r) => ({
      id: `sv_${r.id}`,
      at: r.createdAt.toISOString(),
      path: r.path,
      authSource: loginSourceFromPath(r.path),
      user: r.user!,
      ip: opts.sensitive ? r.ip : null,
      userAgent: opts.sensitive ? r.userAgent : null,
      device: opts.sensitive ? parseUserAgentSummary(r.userAgent).label : null,
      source: "login_event" as const,
    }))

  if (!cursorId && items.length < opts.limit) {
    const sessionWhere: Prisma.SessionWhereInput = {
      ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
      ...(opts.q && opts.canViewUsers ? { user: userSearchOr(opts.q) } : {}),
    }
    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      orderBy: { createdAt: "desc" },
      take: opts.limit - items.length,
      select: {
        id: true,
        createdAt: true,
        device: true,
        ip: true,
        userAgent: true,
        user: opts.canViewUsers
          ? { select: { id: true, name: true, phone: true } }
          : false,
      },
    })

    for (const s of sessions) {
      if (!s.user) continue
      const uaSummary = parseUserAgentSummary(s.userAgent)
      items.push({
        id: `sess_${s.id}`,
        at: s.createdAt.toISOString(),
        path: "/auth/session",
        authSource: "Сессия",
        user: s.user,
        ip: opts.sensitive ? s.ip : null,
        userAgent: opts.sensitive ? s.userAgent : null,
        device: s.device ?? (opts.sensitive ? uaSummary.label : null),
        source: "session",
      })
    }

    items.sort((a, b) => b.at.localeCompare(a.at))
    items = items.slice(0, opts.limit)
  }

  return {
    items,
    nextCursor: hasMore && page.length > 0 ? `sv_${page[page.length - 1]!.id}` : null,
  }
}

async function fetchStaffLogins(opts: {
  limit: number
  since?: Date
  q?: string
  sensitive: boolean
  cursor?: string
}) {
  const where: Prisma.AdminAuditLogWhereInput = {
    action: { in: ["ADMIN_LOGIN_SUCCESS", "ADMIN_LOGIN_FAILED", "ADMIN_LOGOUT"] },
    ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
  }

  if (opts.q) {
    where.AND = [
      {
        OR: [
          { action: { contains: opts.q, mode: "insensitive" } },
          ...(opts.sensitive ? [{ ip: { contains: opts.q } }] : []),
          { actor: { login: { contains: opts.q, mode: "insensitive" } } },
          { actor: { displayName: { contains: opts.q, mode: "insensitive" } } },
        ],
      },
    ]
  }

  const rows = await adminDb.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      metadata: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      actor: { select: { login: true, displayName: true } },
    },
  })

  const hasMore = rows.length > opts.limit
  const page = hasMore ? rows.slice(0, opts.limit) : rows

  return {
    items: page.map((log) => ({
      id: log.id,
      at: log.createdAt.toISOString(),
      action: log.action,
      staffLogin: log.actor?.login ?? null,
      staffName: log.actor?.displayName ?? null,
      ip: opts.sensitive ? log.ip : null,
      userAgent: opts.sensitive ? log.userAgent : null,
      device: opts.sensitive ? parseUserAgentSummary(log.userAgent).label : null,
      metadata:
        log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
          ? (log.metadata as Record<string, unknown>)
          : null,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  }
}

export function activityRowsToCsv(tab: ActivityTab, items: unknown[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }

  const header = (cols: string[]) => cols.join(",")
  const row = (cols: unknown[]) => cols.map(escape).join(",")

  switch (tab) {
    case "visits":
      return [
        header(["at", "path", "user", "visitorId", "referrer", "ip", "device"]),
        ...(items as DashboardVisitRow[]).map((v) =>
          row([v.at, v.path, v.user?.phone ?? v.user?.name ?? "", v.visitorId, v.referrer ?? "", v.ip ?? "", v.device ?? ""]),
        ),
      ].join("\n")
    case "registrations":
      return [
        header(["at", "user", "phone", "email", "city", "authSource", "ip", "path"]),
        ...(items as DashboardRegistrationRow[]).map((r) =>
          row([r.at, r.user.name ?? "", r.user.phone ?? "", r.user.email ?? "", r.user.city ?? "", r.authSource, r.ip ?? "", r.path ?? ""]),
        ),
      ].join("\n")
    case "logins":
      return [
        header(["at", "user", "authSource", "path", "ip", "device", "source"]),
        ...(items as DashboardUserLoginRow[]).map((l) =>
          row([l.at, l.user.phone ?? l.user.name ?? "", l.authSource, l.path, l.ip ?? "", l.device ?? "", l.source]),
        ),
      ].join("\n")
    case "staff":
      return [
        header(["at", "action", "staff", "ip", "device"]),
        ...(items as DashboardStaffLoginRow[]).map((s) =>
          row([s.at, s.action, s.staffName ?? s.staffLogin ?? "", s.ip ?? "", s.device ?? ""]),
        ),
      ].join("\n")
  }
}

/** @deprecated use getActivityForTab via API */
export type DashboardActivityPayload = {
  visits: DashboardVisitRow[]
  registrations: DashboardRegistrationRow[]
  userLogins: DashboardUserLoginRow[]
  staffLogins: DashboardStaffLoginRow[]
}

export async function getDashboardActivity(options: {
  showSensitive: boolean
  canViewUsers?: boolean
  limit?: number
}): Promise<DashboardActivityPayload> {
  const base = {
    days: 7,
    limit: options.limit ?? DEFAULT_LIMIT,
    showSensitive: options.showSensitive,
    canViewUsers: options.canViewUsers ?? true,
  }
  const [visits, registrations, logins, staff] = await Promise.all([
    getActivityForTab({ ...base, tab: "visits" }),
    getActivityForTab({ ...base, tab: "registrations" }),
    getActivityForTab({ ...base, tab: "logins" }),
    getActivityForTab({ ...base, tab: "staff" }),
  ])
  return {
    visits: visits.tab === "visits" ? visits.items : [],
    registrations: registrations.tab === "registrations" ? registrations.items : [],
    userLogins: logins.tab === "logins" ? logins.items : [],
    staffLogins: staff.tab === "staff" ? staff.items : [],
  }
}
