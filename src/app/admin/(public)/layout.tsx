/**
 * Публичные страницы админки (вход) — без сайдбара и без шапки маркетплейса.
 */
export default function AdminPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(circle at top, rgba(255, 106, 0, 0.14), transparent 36%), #05070d",
      }}
    >
      {children}
    </div>
  )
}
