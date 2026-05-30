/**
 * Проверка production OAuth endpoints и env-подсказок.
 * Запуск: node scripts/check-production-auth.js
 */
const BASE = process.env.PRODUCTION_URL || "https://nashlo.ru"

async function head(path) {
  const res = await fetch(new URL(path, BASE), {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "nashlo-auth-check/1.0" },
  })
  const location = res.headers.get("location")
  return { status: res.status, location }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  console.log(`Checking auth at ${BASE}`)

  const yandex = await head("/api/auth/yandex")
  assert(yandex.status === 302 || yandex.status === 307, `yandex start: ${yandex.status}`)
  assert(
    yandex.location?.includes("oauth.yandex.ru"),
    `yandex redirect unexpected: ${yandex.location}`,
  )
  console.log("OK  /api/auth/yandex → Yandex OAuth")

  const vk = await head("/api/auth/vk")
  assert(vk.status === 302 || vk.status === 307, `vk start: ${vk.status}`)
  assert(
    vk.location?.includes("id.vk.com/authorize"),
    `vk redirect unexpected (need VK ID): ${vk.location}`,
  )
  console.log("OK  /api/auth/vk → VK OAuth")

  const providers = await fetch(new URL("/api/auth/providers", BASE))
  const provBody = await providers.json()
  assert(providers.status === 200, `/api/auth/providers status ${providers.status}`)
  console.log(`OK  /api/auth/providers vk=${provBody.vk} yandex=${provBody.yandex}`)

  const me = await head("/api/auth/me")
  assert(me.status === 401 || me.status === 200, `/api/auth/me status ${me.status}`)
  console.log(`OK  /api/auth/me (${me.status} without session)`)

  for (const path of ["/api/auth/yandex/callback", "/api/auth/vk/callback"]) {
    const r = await head(path)
    assert(r.status !== 404, `${path} returned 404`)
    console.log(`OK  ${path} exists (${r.status})`)
  }

  console.log("\nProduction auth smoke checks passed.")
  console.log("Ensure server env: SITE_URL=https://nashlo.ru, YANDEX_REDIRECT_URI, VK_REDIRECT_URI, JWT_SECRET")
  console.log("After env change: pm2 restart otiva --update-env")
}

main().catch((e) => {
  console.error("FAIL", e.message)
  process.exit(1)
})
