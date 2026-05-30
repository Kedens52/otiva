import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const BADGE_DIR = path.join(process.cwd(), "public", "badges")

const ALLOWED_BASE = new Set([
  "beginner",
  "pervii",
  "verified",
  "active",
  "trusted",
  "pro",
  "safe-deal",
  "premium",
])

function contentTypeForBuffer(buf: Buffer, ext: string): string {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png"
  }
  if (ext === "svg") return "image/svg+xml"
  return "image/png"
}

async function readBadgeAsset(requested: string): Promise<{ body: Buffer; contentType: string } | null> {
  const safe = path.basename(requested)
  const base = safe.replace(/\.(png|svg)$/i, "")
  if (!ALLOWED_BASE.has(base)) return null

  const candidates = [`${base}.png`, `${base}.svg`, safe]
  const seen = new Set<string>()

  for (const name of candidates) {
    if (seen.has(name)) continue
    seen.add(name)
    try {
      const body = await readFile(path.join(BADGE_DIR, name))
      const ext = name.split(".").pop()?.toLowerCase() ?? "png"
      return { body, contentType: contentTypeForBuffer(body, ext) }
    } catch {
      /* try next */ }
  }
  return null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { file: string } },
) {
  const result = await readBadgeAsset(params.file)
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return new NextResponse(result.body, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}
