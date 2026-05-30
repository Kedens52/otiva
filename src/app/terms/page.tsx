import { redirect } from "next/navigation"

/** Исторический URL — актуальный документ на /legal/user-agreement */
export default function TermsPage() {
  redirect("/legal/user-agreement")
}
