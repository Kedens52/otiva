import AdminLoginClient from "./AdminLoginClient"

export const metadata = {
  title: "Вход — админ-панель",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return <AdminLoginClient />
}
