import Link from "next/link"
import {
  getRelatedSeoCategories,
  getSeoCategoryChild,
  getSeoCategoryConfig,
  resolveListingSeoPath,
  toSeoSegment,
} from "@/lib/seo/categories"
import { getCategorySeoPath } from "@/lib/seo/paths"

type Props = {
  title: string
  city?: string | null
  categorySlug?: string | null
  categoryName?: string | null
  attributes?: Record<string, unknown> | null
}

function buildChips(input: Props) {
  const chips: Array<{ label: string; href: string }> = []
  const categorySlug = input.categorySlug
  if (!categorySlug) return chips

  const seoPath = resolveListingSeoPath({
    categorySlug,
    attributes: input.attributes,
  })
  if (seoPath === "/search") return chips

  const parts = seoPath.replace(/^\//, "").split("/")
  const seoCategorySlug = parts[0]
  const seoChildSlug = parts[1]
  const config = seoCategorySlug ? getSeoCategoryConfig(seoCategorySlug) : null
  const child =
    seoCategorySlug && seoChildSlug ? getSeoCategoryChild(seoCategorySlug, seoChildSlug) : null
  const city = (input.city || "").trim()
  const citySeg = city ? toSeoSegment(city) : null
  const catLabel = input.categoryName || config?.label || categorySlug

  if (config && citySeg) {
    chips.push({
      label: `${config.label} в ${city}`,
      href: getCategorySeoPath(config.slug, citySeg),
    })
  }

  if (config && child && citySeg) {
    chips.push({
      label: `${child.label} в ${city}`,
      href: getCategorySeoPath(config.slug, child.slug, citySeg),
    })
  }

  if (config) {
    chips.push({
      label: config.label,
      href: getCategorySeoPath(config.slug),
    })
  }

  if (config && child) {
    chips.push({
      label: child.label,
      href: getCategorySeoPath(config.slug, child.slug),
    })
  }

  if (city) {
    chips.push({
      label: `Все объявления в ${city}`,
      href: `/search?city=${encodeURIComponent(city)}`,
    })
  }

  const seen = new Set<string>()
  return chips.filter((chip) => {
    if (seen.has(chip.href)) return false
    seen.add(chip.href)
    return true
  })
}

export function ListingSeoLinks(props: Props) {
  const chips = buildChips(props)
  const seoRootSlug = resolveListingSeoPath({
    categorySlug: props.categorySlug,
    attributes: props.attributes,
  })
    .replace(/^\//, "")
    .split("/")[0]
  const related = seoRootSlug ? getRelatedSeoCategories(seoRootSlug) : []

  if (!chips.length && !related.length) return null

  return (
    <nav
      className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 sm:px-4"
      aria-label="Разделы и города"
    >
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.href}>
              <Link
                href={chip.href}
                className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
              >
                {chip.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {related.length > 0 && (
        <div className={chips.length ? "mt-3 border-t border-zinc-100 pt-3" : ""}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Похожие разделы
          </p>
          <ul className="flex flex-wrap gap-2">
            {related.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={getCategorySeoPath(cat.slug)}
                  className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
