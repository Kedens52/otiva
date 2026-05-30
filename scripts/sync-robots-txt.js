/**
 * Синхронизирует public/robots.txt из robots-disallow.ts (через JSON при build).
 * В robots — только индекс /sitemap.xml (дочерние sitemap подхватываются из индекса).
 */
const fs = require("fs")
const path = require("path")

const configPath = path.join(process.cwd(), "src", "lib", "seo", "robots-disallow.json")

function loadConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf8"))
  }
  return fallbackFromTsSource()
}

/** Читает массивы из robots-disallow.ts без TypeScript-компиляции */
function fallbackFromTsSource() {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src", "lib", "seo", "robots-disallow.ts"),
    "utf8",
  )
  const parseArray = (name) => {
    const re = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`)
    const m = src.match(re)
    if (!m) return []
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
  }
  return {
    disallow: parseArray("ROBOTS_DISALLOW"),
  }
}

function robotsTxtBody(base, host, disallow) {
  const lines = [
    "User-Agent: *",
    "Allow: /",
    ...disallow.map((d) => `Disallow: ${d}`),
    "",
    `Host: ${host}`,
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ]
  return lines.join("\n")
}

const base = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://nashlo.ru").replace(
  /\/$/,
  "",
)
const host = base.replace(/^https?:\/\//, "")
const { disallow } = loadConfig()
const body = robotsTxtBody(base, host, disallow)
const out = path.join(process.cwd(), "public", "robots.txt")
fs.writeFileSync(out, body, "utf8")
console.log(`[sync-robots] wrote ${out} (Host: ${host}, Sitemap: ${base}/sitemap.xml)`)
