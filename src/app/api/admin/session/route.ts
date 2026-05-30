import { NextRequest, NextResponse } from "next/server"
import { revokeAdminSession } from "@/lib/admin/adminSession"
import { validateCsrf } from "@/lib/admin/csrf"

export async function POST(request: Request) {
  void request
  return NextResponse.json(
    { error: "Устаревший endpoint. Используйте /api/admin/auth/login" },
    { status: 410 },
  )
}

export async function DELETE(req: NextRequest) {
  validateCsrf(req)
  await revokeAdminSession()
  return NextResponse.json({ ok: true })
}
