const BASE_URL = process.env.PRODUCTION_URL || "https://nashlo.ru"
const LOCALHOST_URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(?::\d+)?/i

async function request(path, options = {}) {
  const response = await fetch(new URL(path, BASE_URL), {
    redirect: "manual",
    ...options,
    headers: {
      "user-agent": "nashlo-production-seo-check/1.0",
      ...(options.headers || {}),
    },
  })
  const body = options.method === "HEAD" ? "" : await response.text()
  return { response, body }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function logOk(message) {
  console.log(`OK  ${message}`)
}

async function main() {
  console.log(`Checking production SEO at ${BASE_URL}`)

  const home = await request("/")
  assert(home.response.status === 200, `Home status is ${home.response.status}, expected 200`)
  assert(home.body.includes("Нашло"), "Home page does not contain 'Нашло'")
  assert(!home.body.includes("Отива"), "Home page still contains 'Отива'")
  assert(!home.body.includes("Otiva"), "Home page still contains 'Otiva'")
  assert(!LOCALHOST_URL_RE.test(home.body), "Home page HTML still contains localhost URLs")
  logOk("Home page returns 200 and contains Nashlo branding")

  const robotsHead = await request("/robots.txt", { method: "HEAD" })
  assert(robotsHead.response.status === 200, `/robots.txt HEAD status is ${robotsHead.response.status}, expected 200`)
  assert(!robotsHead.response.headers.get("location"), `/robots.txt HEAD returned redirect ${robotsHead.response.headers.get("location")}`)
  const robotsCt = (robotsHead.response.headers.get("content-type") || "").toLowerCase()
  assert(robotsCt.includes("text/plain"), `/robots.txt content-type is ${robotsCt}, expected text/plain`)
  logOk("/robots.txt HEAD returns 200 text/plain without redirect")

  const robotsSlash = await request("/robots.txt/", { method: "HEAD" })
  assert(robotsSlash.response.status === 200, `/robots.txt/ HEAD status is ${robotsSlash.response.status}, expected 200 (no 308)`)
  assert(!robotsSlash.response.headers.get("location"), `/robots.txt/ returned redirect ${robotsSlash.response.headers.get("location")}`)
  logOk("/robots.txt/ returns 200 without redirect (trailing slash)")

  const { body: robotsBody } = await request("/robots.txt")
  assert(robotsBody.includes("Host: nashlo.ru"), "robots.txt Host must be nashlo.ru without scheme")
  assert(!/Host:\s*https?:\/\//i.test(robotsBody), "robots.txt Host must not include http(s)://")
  logOk("robots.txt Host directive is correct")

  const optionalEmptySitemaps = new Set([
    "/sitemap-cities.xml",
    "/sitemap-category-city.xml",
    "/sitemap-want-to-buy.xml",
  ])

  for (const path of [
    "/robots.txt",
    "/sitemap.xml",
    "/sitemap-static.xml",
    "/kyplu",
    "/want-to-buy",
    "/sitemap-categories.xml",
    "/sitemap-cities.xml",
    "/sitemap-category-city.xml",
    "/sitemap-listings.xml",
    "/sitemap-want-to-buy.xml",
    "/sitemap-sellers.xml",
    "/sitemap-business.xml",
    "/yandex_6eb4b0158e7865c6.html",
  ]) {
    const { response, body } = await request(path)
    if (optionalEmptySitemaps.has(path) && response.status === 404) {
      logOk(`${path} returns 404 (no indexable city URLs yet)`)
      continue
    }
    assert(response.status === 200, `${path} status is ${response.status}, expected 200`)
    assert(!response.headers.get("location"), `${path} returned redirect header ${response.headers.get("location")}`)
    if (path === "/robots.txt") {
      assert(body.includes("Sitemap: https://nashlo.ru/sitemap.xml"), "robots.txt does not contain the canonical sitemap URL")
      assert(
        !body.includes("Sitemap: https://nashlo.ru/sitemap-business.xml"),
        "robots.txt must only list the sitemap index (child sitemaps are discovered from it)",
      )
      assert(!LOCALHOST_URL_RE.test(body), "robots.txt still contains localhost URLs")
    }
    if (path === "/sitemap.xml") {
      assert(body.includes("<sitemapindex"), "sitemap.xml must be a sitemap index")
      assert(body.includes("https://nashlo.ru/sitemap-listings.xml"), "sitemap index missing child sitemap")
      assert(!LOCALHOST_URL_RE.test(body), "sitemap.xml still contains localhost URLs")
    }
    if (path.endsWith(".xml") && path !== "/sitemap.xml") {
      assert(body.includes("<urlset"), `${path} must be a urlset sitemap`)
      assert(body.includes("<url>"), `${path} must contain at least one <url> entry`)
      assert(body.includes("https://nashlo.ru"), `${path} does not contain nashlo.ru URLs`)
      assert(!LOCALHOST_URL_RE.test(body), `${path} still contains localhost URLs`)
    }
    if (path === "/want-to-buy") {
      const location = response.headers.get("location") || ""
      assert(
        response.status === 301 || response.status === 308 || location.includes("/kyplu"),
        `/want-to-buy should redirect to /kyplu (status ${response.status}, location ${location})`,
      )
      logOk(`${path} redirects to /kyplu`)
      continue
    }
    if (path === "/kyplu") {
      assert(body.includes('rel="canonical"'), `${path} missing canonical link`)
      assert(body.includes("/kyplu"), `${path} should reference /kyplu in canonical or metadata`)
    }
    if (path === "/yandex_6eb4b0158e7865c6.html") {
      assert(body.includes("Verification: 6eb4b0158e7865c6"), "Yandex verification file content is unexpected")
    }
    logOk(`${path} returns 200 without redirect`)
  }

  console.log("Production SEO checks passed.")
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`)
  process.exit(1)
})
