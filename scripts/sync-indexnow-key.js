/**
 * Пишет public/{INDEXNOW_KEY}.txt для протокола IndexNow (Яндекс, Bing).
 * Ключ задаётся в env на сервере; без ключа файл не создаётся.
 */
const fs = require("fs")
const path = require("path")

// Подхватываем ключ с сервера при build (как prisma/.env)
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(process.cwd(), envFile)
  if (!fs.existsSync(envPath)) continue
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*INDEXNOW_KEY\s*=\s*"?([^"\n#]+)"?\s*$/)
    if (m && !process.env.INDEXNOW_KEY) process.env.INDEXNOW_KEY = m[1].trim()
  }
}

const key = (process.env.INDEXNOW_KEY || "").trim()
if (!key) {
  console.log("[sync-indexnow] skip — INDEXNOW_KEY not set")
  process.exit(0)
}

if (key.length < 8 || key.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(key)) {
  console.warn("[sync-indexnow] INDEXNOW_KEY must be 8–128 chars [a-zA-Z0-9_-]")
  process.exit(0)
}

const out = path.join(process.cwd(), "public", `${key}.txt`)
fs.writeFileSync(out, key, "utf8")
console.log(`[sync-indexnow] wrote ${out}`)
