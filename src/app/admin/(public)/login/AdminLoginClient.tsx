"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { safeAdminRedirectPath } from "@/lib/admin/safe-redirect"
import { Logo } from "@/components/layout/Logo"
import styles from "./admin-login.module.css"

export default function AdminLoginClient() {
  const router = useRouter()
  const [nextPath, setNextPath] = useState<string | null>(null)
  const [login, setLogin] = useState("")
  const [code, setCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next")
    setNextPath(next)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getAdminCsrfFromDocument(),
        },
        body: JSON.stringify({
          login: login.trim(),
          code: code.trim(),
          next: nextPath || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? "Ошибка входа")
        return
      }

      const target = safeAdminRedirectPath(
        typeof data.redirectTo === "string" ? data.redirectTo : null,
        safeAdminRedirectPath(nextPath, "/admin/dashboard"),
      )
      router.push(target)
      router.refresh()
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <Logo size="default" />
            <span className={styles.brandBadge}>admin</span>
          </div>
          <h1 className={styles.title}>Панель управления</h1>
          <p className={styles.subtitle}>Закрытый вход для сотрудников Нашло</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-login">
              Логин
            </label>
            <input
              id="admin-login"
              className={styles.input}
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              placeholder="your.login"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-code">
              Персональный код
            </label>
            <div className={styles.codeWrap}>
              <input
                id="admin-code"
                className={`${styles.input} ${styles.inputCode}`}
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="NSH-XXXX-XXXX"
              />
              <button
                type="button"
                className={styles.toggleCode}
                onClick={() => setShowCode((v) => !v)}
                tabIndex={-1}
              >
                {showCode ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button
            type="submit"
            className={styles.submit}
            disabled={loading || !login.trim() || !code.trim()}
          >
            {loading ? "Входим…" : "Войти"}
          </button>
        </form>

        <p className={styles.footer}>Доступ только для сотрудников nashlo.ru</p>
      </div>
    </main>
  )
}
