import { Prisma, type PrismaClient } from "@prisma/client"
import { getAllowedListingSearchParamKeys } from "@/lib/filters"

/** Ключи JSON-атрибутов из query (равенство). */
const EQUAL_ATTR_KEYS = new Set([
  "make",
  "vehicle_type",
  "body_type",
  "fuel",
  "transmission",
  "drive",
  "deal_type",
  "property_type",
  "subcategory",
  "condition",
  "free_type",
  "part_type",
  "employment_type",
  "schedule",
  "experience",
  "business_type",
  "brand",
  "building_type",
  "animal_type",
  "gender",
  "size",
  "price_type",
  "service_type",
  "delivery_option",
  "listing_type",
  "pts",
  "customs",
  "vin",
  "owners_count",
  "warranty",
  "age_group",
  "renovation",
  "bathroom",
  "jk_name",
  "balcony",
  "mortgage",
  "breed",
  "animal_gender",
  "age",
  "storage",
  "steering",
  "originality",
  "package",
  "season",
  "rent_term",
])

const TEXT_ATTR_KEYS = new Set([
  "model",
  "generation",
  "brand",
  "color",
  "material",
  "size",
  "company",
  "compatibility",
  "oem_number",
  "job_sector",
  "position",
  "processor",
  "video_card",
  "diagonal",
  "battery",
])

const TOGGLE_ATTR_KEYS = new Set([
  "exchange",
  "floor_not_first",
  "floor_not_last",
  "lift",
  "parking",
  "furniture",
  "appliances",
  "kids_allowed",
  "pets_allowed",
  "deposit",
  "commission",
  "maternity_capital",
  "new_build",
  "resale",
  "portfolio",
  "reviews",
  "fast_response",
  "today",
  "weekend",
  "contract",
  "guarantee",
  "documents",
  "vaccinated",
  "sterilized",
  "remote",
  "daily_pay",
])

function parseIntOpt(s: string | null): number | undefined {
  if (s === null || s === "") return undefined
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : undefined
}

/** Условия Prisma по JSON attributes + массив фото; без «тяжёлых» диапазонов. */
export function prismaAttributeConditions(
  sp: URLSearchParams,
  categorySlug: string | null,
): Prisma.ListingWhereInput[] {
  const allowed = getAllowedListingSearchParamKeys(categorySlug)
  const conditions: Prisma.ListingWhereInput[] = []

  for (const key of Array.from(EQUAL_ATTR_KEYS)) {
    if (!allowed.has(key)) continue
    const v = sp.get(key)
    if (v) {
      const values = v.split(",").map((part) => part.trim()).filter(Boolean)
      if (values.length > 1) {
        conditions.push({
          OR: values.map((value) => ({
            attributes: { path: [key], equals: value },
          })),
        })
      } else {
        conditions.push({
          attributes: { path: [key], equals: values[0] ?? v },
        })
      }
    }
  }

  for (const key of Array.from(TEXT_ATTR_KEYS)) {
    if (!allowed.has(key)) continue
    const value = sp.get(key)?.trim()
    if (value) {
      conditions.push({
        attributes: {
          path: [key],
          string_contains: value,
        },
      })
    }
  }

  for (const key of Array.from(TOGGLE_ATTR_KEYS)) {
    if (!allowed.has(key) || sp.get(key) !== "1") continue
    conditions.push({
      OR: [
        { attributes: { path: [key], equals: "1" } },
        { attributes: { path: [key], equals: "true" } },
        { attributes: { path: [key], equals: true } },
        { attributes: { path: [key], equals: "yes" } },
      ],
    })
  }

  if (allowed.has("rooms")) {
    const rooms = sp.get("rooms")
    if (rooms) {
      const vals = rooms.split(",").filter(Boolean)
      if (vals.length) {
        conditions.push({
          OR: vals.map((val) => ({
            attributes: { path: ["rooms"], equals: val.trim() },
          })),
        })
      }
    }
  }

  if (allowed.has("with_photos") && sp.get("with_photos") === "1") {
    conditions.push({ images: { isEmpty: false } })
  }

  if (allowed.has("from_owner") && sp.get("from_owner") === "1") {
    conditions.push({
      OR: [
        { attributes: { path: ["from_owner"], equals: "owner" } },
        { attributes: { path: ["seller_type"], equals: "owner" } },
      ],
    })
  }

  if (allowed.has("delivery") && sp.get("delivery") === "1") {
    conditions.push({
      OR: [
        { attributes: { path: ["delivery_option"], equals: "delivery" } },
        { attributes: { path: ["delivery_option"], equals: "both" } },
      ],
    })
  }

  if (allowed.has("district")) {
    const district = sp.get("district")?.trim()
    if (district) {
      conditions.push({
        OR: [
          { district: { contains: district, mode: "insensitive" } },
          { location: { contains: district, mode: "insensitive" } },
          { description: { contains: district, mode: "insensitive" } },
          { title: { contains: district, mode: "insensitive" } },
        ],
      })
    }
  }

  return conditions
}

export function hasNumericAttributeFilters(
  sp: URLSearchParams,
  categorySlug?: string | null,
): boolean {
  const carsParts = categorySlug === "cars" || categorySlug === "parts"
  const re = categorySlug === "real-estate"
  const ymf =
    carsParts &&
    (parseIntOpt(sp.get("year_from")) !== undefined ||
      parseIntOpt(sp.get("year_to")) !== undefined ||
      parseIntOpt(sp.get("mileage_from")) !== undefined ||
      parseIntOpt(sp.get("mileage_to")) !== undefined ||
      parseIntOpt(sp.get("engine_volume_from")) !== undefined ||
      parseIntOpt(sp.get("engine_volume_to")) !== undefined ||
      parseIntOpt(sp.get("engine_power_from")) !== undefined ||
      parseIntOpt(sp.get("engine_power_to")) !== undefined)
  const af =
    re &&
    (parseIntOpt(sp.get("area_from")) !== undefined ||
      parseIntOpt(sp.get("area_to")) !== undefined ||
      parseIntOpt(sp.get("living_area_from")) !== undefined ||
      parseIntOpt(sp.get("living_area_to")) !== undefined ||
      parseIntOpt(sp.get("kitchen_area_from")) !== undefined ||
      parseIntOpt(sp.get("kitchen_area_to")) !== undefined ||
      parseIntOpt(sp.get("land_area_from")) !== undefined ||
      parseIntOpt(sp.get("land_area_to")) !== undefined ||
      parseIntOpt(sp.get("floor_from")) !== undefined ||
      parseIntOpt(sp.get("floor_to")) !== undefined ||
      parseIntOpt(sp.get("total_floors_from")) !== undefined ||
      parseIntOpt(sp.get("total_floors_to")) !== undefined ||
      parseIntOpt(sp.get("build_year_from")) !== undefined ||
      parseIntOpt(sp.get("build_year_to")) !== undefined)
  return ymf || af
}

export async function filterListingIdsByNumericAttributes(
  prisma: PrismaClient,
  sp: URLSearchParams,
  categoryId: string | undefined,
  categorySlug: string | null,
): Promise<string[] | null> {
  const yearMin = parseIntOpt(sp.get("year_from"))
  const yearMax = parseIntOpt(sp.get("year_to"))
  const mileageMin = parseIntOpt(sp.get("mileage_from"))
  const mileageMax = parseIntOpt(sp.get("mileage_to"))
  const engineVolumeMin = parseIntOpt(sp.get("engine_volume_from"))
  const engineVolumeMax = parseIntOpt(sp.get("engine_volume_to"))
  const enginePowerMin = parseIntOpt(sp.get("engine_power_from"))
  const enginePowerMax = parseIntOpt(sp.get("engine_power_to"))
  const areaMin = parseIntOpt(sp.get("area_from"))
  const areaMax = parseIntOpt(sp.get("area_to"))
  const livingAreaMin = parseIntOpt(sp.get("living_area_from"))
  const livingAreaMax = parseIntOpt(sp.get("living_area_to"))
  const kitchenAreaMin = parseIntOpt(sp.get("kitchen_area_from"))
  const kitchenAreaMax = parseIntOpt(sp.get("kitchen_area_to"))
  const landAreaMin = parseIntOpt(sp.get("land_area_from"))
  const landAreaMax = parseIntOpt(sp.get("land_area_to"))
  const floorMin = parseIntOpt(sp.get("floor_from"))
  const floorMax = parseIntOpt(sp.get("floor_to"))
  const totalFloorsMin = parseIntOpt(sp.get("total_floors_from"))
  const totalFloorsMax = parseIntOpt(sp.get("total_floors_to"))
  const buildYearMin = parseIntOpt(sp.get("build_year_from"))
  const buildYearMax = parseIntOpt(sp.get("build_year_to"))

  const carsParts = categorySlug === "cars" || categorySlug === "parts"
  const re = categorySlug === "real-estate"

  const useYearMileage =
    carsParts &&
    (yearMin !== undefined ||
      yearMax !== undefined ||
      mileageMin !== undefined ||
      mileageMax !== undefined ||
      engineVolumeMin !== undefined ||
      engineVolumeMax !== undefined ||
      enginePowerMin !== undefined ||
      enginePowerMax !== undefined)
  const useAreaFloor =
    re &&
    (areaMin !== undefined ||
      areaMax !== undefined ||
      livingAreaMin !== undefined ||
      livingAreaMax !== undefined ||
      kitchenAreaMin !== undefined ||
      kitchenAreaMax !== undefined ||
      landAreaMin !== undefined ||
      landAreaMax !== undefined ||
      floorMin !== undefined ||
      floorMax !== undefined ||
      totalFloorsMin !== undefined ||
      totalFloorsMax !== undefined ||
      buildYearMin !== undefined ||
      buildYearMax !== undefined)

  if (!useYearMileage && !useAreaFloor) {
    return null
  }

  const parts: Prisma.Sql[] = []

  if (useYearMileage) {
    if (yearMin !== undefined || yearMax !== undefined) {
      const ymin = yearMin ?? 1900
      const ymax = yearMax ?? 2100
      parts.push(
        Prisma.sql`(
        COALESCE((l.attributes->>'year_to')::int, (l.attributes->>'year_from')::int) >= ${ymin}
        AND COALESCE((l.attributes->>'year_from')::int, (l.attributes->>'year_to')::int) <= ${ymax}
      )`,
      )
    }

    if (mileageMin !== undefined || mileageMax !== undefined) {
      const mmin = mileageMin ?? 0
      const mmax = mileageMax ?? 2147483647
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'mileage'), ''))::int BETWEEN ${mmin} AND ${mmax}`,
      )
    }

    if (engineVolumeMin !== undefined || engineVolumeMax !== undefined) {
      const vmin = engineVolumeMin ?? 0
      const vmax = engineVolumeMax ?? 2147483647
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'engine_volume'), ''))::numeric BETWEEN ${vmin} AND ${vmax}`,
      )
    }

    if (enginePowerMin !== undefined || enginePowerMax !== undefined) {
      const pmin = enginePowerMin ?? 0
      const pmax = enginePowerMax ?? 2147483647
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'engine_power'), ''))::int BETWEEN ${pmin} AND ${pmax}`,
      )
    }
  }

  if (useAreaFloor) {
    if (areaMin !== undefined || areaMax !== undefined) {
      const amin = areaMin ?? 0
      const amax = areaMax ?? 2147483647
      parts.push(
        Prisma.sql`(COALESCE(NULLIF(TRIM(l.attributes->>'area'), ''), NULLIF(TRIM(l.attributes->>'total_area'), '')))::int BETWEEN ${amin} AND ${amax}`,
      )
    }

    if (livingAreaMin !== undefined || livingAreaMax !== undefined) {
      const lmin = livingAreaMin ?? 0
      const lmax = livingAreaMax ?? 2147483647
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'living_area'), ''))::int BETWEEN ${lmin} AND ${lmax}`,
      )
    }

    if (kitchenAreaMin !== undefined || kitchenAreaMax !== undefined) {
      const kmin = kitchenAreaMin ?? 0
      const kmax = kitchenAreaMax ?? 2147483647
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'kitchen_area'), ''))::int BETWEEN ${kmin} AND ${kmax}`,
      )
    }

    if (landAreaMin !== undefined || landAreaMax !== undefined) {
      const lmin = landAreaMin ?? 0
      const lmax = landAreaMax ?? 2147483647
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'land_area'), ''))::int BETWEEN ${lmin} AND ${lmax}`,
      )
    }

    if (floorMin !== undefined || floorMax !== undefined) {
      const fmin = floorMin ?? 0
      const fmax = floorMax ?? 999
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'floor_from'), ''))::int BETWEEN ${fmin} AND ${fmax}`,
      )
    }

    if (totalFloorsMin !== undefined || totalFloorsMax !== undefined) {
      const tmin = totalFloorsMin ?? 0
      const tmax = totalFloorsMax ?? 999
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'total_floors'), ''))::int BETWEEN ${tmin} AND ${tmax}`,
      )
    }

    if (buildYearMin !== undefined || buildYearMax !== undefined) {
      const bmin = buildYearMin ?? 1800
      const bmax = buildYearMax ?? 2500
      parts.push(
        Prisma.sql`(NULLIF(TRIM(l.attributes->>'build_year'), ''))::int BETWEEN ${bmin} AND ${bmax}`,
      )
    }
  }

  if (parts.length === 0) return null

  const combined = Prisma.join(parts, " AND ")
  const whereCat =
    categoryId !== undefined ? Prisma.sql`AND l."categoryId" = ${categoryId}` : Prisma.empty

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT l.id FROM "Listing" l
    WHERE l.status = 'ACTIVE'
    ${whereCat}
    AND (${combined})
  `

  return rows.map((r) => r.id)
}
