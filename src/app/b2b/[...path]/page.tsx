import { permanentRedirect } from "next/navigation"

export default function B2bLegacyCatchAll({ params }: { params: { path: string[] } }) {
  const suffix = params.path?.length ? `/${params.path.join("/")}` : ""
  permanentRedirect(`/business${suffix}`)
}
