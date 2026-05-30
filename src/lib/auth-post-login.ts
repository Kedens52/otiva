/** Куда вести после входа: дозаполнение профиля или целевая страница. */

export type AuthUserLike = {
  name?: string | null
}

/** Минимум для публичного профиля продавца. */
export function needsProfileCompletion(user: AuthUserLike | null | undefined): boolean {
  const name = user?.name?.trim() ?? ""
  return name.length < 2
}

/** Из next=/register?from=/profile достаём /profile. */
export function resolvePostLoginDestination(nextPath: string | null | undefined): string {
  const raw = nextPath?.trim() || "/profile"
  if (!raw.startsWith("/register")) return raw.startsWith("/") ? raw : "/profile"

  try {
    const url = new URL(raw, "https://nashlo.ru")
    const from = url.searchParams.get("from")?.trim()
    if (from && from.startsWith("/") && !from.startsWith("//")) return from
  } catch {
    /* ignore */
  }
  return "/profile"
}

export function buildPostLoginPath(
  user: AuthUserLike,
  nextPath: string | null | undefined,
  options?: { forceComplete?: boolean },
): string {
  const destination = resolvePostLoginDestination(nextPath)
  if (options?.forceComplete || needsProfileCompletion(user)) {
    return `/register?from=${encodeURIComponent(destination)}&complete=1`
  }
  return destination
}
