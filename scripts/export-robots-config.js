/**
 * Генерирует robots-disallow.json из robots-disallow.ts (для sync-robots-txt.js на сервере).
 */
const fs = require("fs")
const path = require("path")

const tsPath = path.join(process.cwd(), "src", "lib", "seo", "robots-disallow.ts")
const jsonPath = path.join(process.cwd(), "src", "lib", "seo", "robots-disallow.json")
const src = fs.readFileSync(tsPath, "utf8")

function parseArray(name) {
  const re = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`)
  const m = src.match(re)
  if (!m) throw new Error(`Missing ${name} in robots-disallow.ts`)
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
}

const config = {
  disallow: parseArray("ROBOTS_DISALLOW"),
  sitemapPaths: parseArray("ROBOTS_SITEMAP_PATHS"),
}

fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2) + "\n", "utf8")
console.log(`[export-robots-config] wrote ${jsonPath}`)
