import { permanentRedirect } from "next/navigation"

export default function BusinessCatalogLegacyRedirect() {
  permanentRedirect("/business/listings")
}
