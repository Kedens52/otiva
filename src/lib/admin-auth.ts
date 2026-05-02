import { cookies } from "next/headers"

const ADMIN_COOKIE = "nashlo_admin_session"

export function adminToken() {
  if (process.env.NASHLO_ADMIN_TOKEN) return process.env.NASHLO_ADMIN_TOKEN
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-local-developer"
}

export function isAdminAuthed() {
  const expected = adminToken()
  const token = cookies().get(ADMIN_COOKIE)?.value
  return Boolean(expected && token === expected)
}
