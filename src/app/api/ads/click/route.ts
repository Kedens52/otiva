import { NextRequest, NextResponse } from "next/server"

export function GET(request: NextRequest) {
  const url = new URL(request.url)
  const rawTarget = url.searchParams.get("to") || "/advertising"

  let target = "/advertising"
  try {
    if (rawTarget.startsWith("/")) {
      target = rawTarget
    } else {
      const parsed = new URL(rawTarget)
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        target = parsed.toString()
      }
    }
  } catch {}

  return NextResponse.redirect(target)
}
