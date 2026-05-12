/**
 * Корень /admin: без проверки сессии.
 * Вход — сегмент (public), панель — (panel) со своим layout и сайдбаром.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
