/**
 * Типизированный wrapper над Prisma для новых admin-моделей.
 * Единственный файл в проекте где разрешён typecast к unknown/any —
 * только на границе Prisma клиента до первого `prisma generate`.
 * После generate все касты можно заменить на прямые импорты из @prisma/client.
 */
import { prisma } from "@/lib/prisma"
import type { StaffRole, StaffStatus } from "./types"

// ─── Local interfaces (зеркалят Prisma-генерируемые типы) ──────────────────

export interface StaffAccountRow {
  id:            string
  login:         string
  displayName:   string | null
  role:          StaffRole
  status:        StaffStatus
  codeHash:      string
  codeChangedAt: Date
  failedAttempts: number
  lockedUntil:   Date | null
  lastLoginAt:   Date | null
  lastLoginIp:   string | null
  lastUserAgent: string | null
  createdById:   string | null
  createdAt:     Date
  updatedAt:     Date
  revokedAt:     Date | null
}

export interface AdminSessionRow {
  id:        string
  staffId:   string
  tokenHash: string
  ip:        string | null
  userAgent: string | null
  lastUsedAt: Date | null
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
  staff:     StaffAccountRow
}

export interface AdminAuditLogRow {
  id:         string
  actorId:    string | null
  action:     string
  targetType: string | null
  targetId:   string | null
  metadata:   unknown
  ip:         string | null
  userAgent:  string | null
  createdAt:  Date
}

// ─── Typed db accessor ────────────────────────────────────────────────────────

const db = prisma as any

export const adminDb = {
  staffAccount: db.staffAccount as {
    findUnique: (args: {
      where: { id?: string; login?: string }
      select?: Partial<Record<keyof StaffAccountRow, boolean>>
    }) => Promise<StaffAccountRow | null>

    update: (args: {
      where: { id: string }
      data: Partial<Omit<StaffAccountRow, "id" | "createdAt" | "updatedAt">>
      select?: Partial<Record<keyof StaffAccountRow, boolean>>
    }) => Promise<StaffAccountRow>

    create: (args: {
      data: Omit<StaffAccountRow, "id" | "createdAt" | "updatedAt">
    }) => Promise<StaffAccountRow>

    findMany: (args?: {
      where?: Partial<Pick<StaffAccountRow, "status" | "role">>
      orderBy?: Partial<Record<keyof StaffAccountRow, "asc" | "desc">>
      take?: number
      skip?: number
      select?: Partial<Record<keyof StaffAccountRow, boolean>>
    }) => Promise<StaffAccountRow[]>

    count: (args?: {
      where?: Partial<Pick<StaffAccountRow, "status" | "role">>
    }) => Promise<number>
  },

  adminSession: db.adminSession as {
    create: (args: {
      data: {
        staffId:   string
        tokenHash: string
        ip?:       string | null
        userAgent?: string | null
        lastUsedAt?: Date | null
        expiresAt: Date
      }
    }) => Promise<AdminSessionRow>

    findUnique: (args: {
      where: { tokenHash: string }
      include?: { staff?: boolean }
    }) => Promise<AdminSessionRow | null>

    update: (args: {
      where: { id: string }
      data: Partial<Pick<AdminSessionRow, "revokedAt" | "lastUsedAt">>
    }) => Promise<AdminSessionRow>

    updateMany: (args: {
      where: { staffId?: string; revokedAt?: null }
      data: Partial<Pick<AdminSessionRow, "revokedAt">>
    }) => Promise<{ count: number }>
  },

  adminAuditLog: db.adminAuditLog as {
    create: (args: {
      data: Omit<AdminAuditLogRow, "id" | "createdAt">
    }) => Promise<AdminAuditLogRow>

    findMany: (args?: {
      where?: Partial<Pick<AdminAuditLogRow, "actorId" | "action" | "targetType" | "targetId">> & {
        createdAt?: { gte?: Date; lte?: Date }
      }
      orderBy?: { createdAt?: "asc" | "desc" }
      take?: number
      skip?: number
      cursor?: { id?: string }
    }) => Promise<AdminAuditLogRow[]>

    count: (args?: {
      where?: Partial<Pick<AdminAuditLogRow, "actorId" | "action" | "targetType">>
    }) => Promise<number>
  },
}
