import type { AdPlacementConfig, PrismaClient } from "@prisma/client"
import { buildDefaultPlacementConfigs } from "@/lib/ads/placement-config-defaults"

export type PlacementConfigDto = {
  id: string
  code: string
  kind: AdPlacementConfig["kind"]
  name: string
  description: string | null
  pages: string | null
  whereOnPage: string | null
  deviceScope: AdPlacementConfig["deviceScope"]
  designWidth: number | null
  designHeight: number | null
  displayWidth: number | null
  allowedFormats: string[]
  maxFileBytes: number | null
  active: boolean
  maxActiveCreatives: number
  sortPriority: number
  pricePerMinute: number | null
  pricePerHour: number | null
  pricePerDay: number | null
  pricePerWeek: number | null
  fallbackTitle: string | null
  fallbackSubtitle: string | null
  fallbackCta: string | null
  fallbackHref: string | null
  updatedAt: string
}

export function serializePlacementConfig(row: AdPlacementConfig): PlacementConfigDto {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind,
    name: row.name,
    description: row.description,
    pages: row.pages,
    whereOnPage: row.whereOnPage,
    deviceScope: row.deviceScope,
    designWidth: row.designWidth,
    designHeight: row.designHeight,
    displayWidth: row.displayWidth,
    allowedFormats: row.allowedFormats,
    maxFileBytes: row.maxFileBytes,
    active: row.active,
    maxActiveCreatives: row.maxActiveCreatives,
    sortPriority: row.sortPriority,
    pricePerMinute: row.pricePerMinute,
    pricePerHour: row.pricePerHour,
    pricePerDay: row.pricePerDay,
    pricePerWeek: row.pricePerWeek,
    fallbackTitle: row.fallbackTitle,
    fallbackSubtitle: row.fallbackSubtitle,
    fallbackCta: row.fallbackCta,
    fallbackHref: row.fallbackHref,
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Создаёт отсутствующие коды из справочника по умолчанию, не перезаписывает существующие */
export async function ensurePlacementConfigs(prisma: PrismaClient): Promise<AdPlacementConfig[]> {
  const defaults = buildDefaultPlacementConfigs()
  const existing = await prisma.adPlacementConfig.findMany()
  const byCode = new Map(existing.map((r) => [r.code, r]))

  for (const def of defaults) {
    if (byCode.has(def.code)) continue
    const created = await prisma.adPlacementConfig.create({ data: def })
    byCode.set(def.code, created)
  }

  return [...byCode.values()].sort((a, b) => a.sortPriority - b.sortPriority || a.name.localeCompare(b.name, "ru"))
}

export async function listPlacementConfigs(prisma: PrismaClient): Promise<PlacementConfigDto[]> {
  const rows = await ensurePlacementConfigs(prisma)
  return rows.map(serializePlacementConfig)
}

export function getPlacementConfigByCode(
  rows: PlacementConfigDto[],
  code: string,
): PlacementConfigDto | undefined {
  return rows.find((r) => r.code === code)
}
