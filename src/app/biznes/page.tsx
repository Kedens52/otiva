import { permanentRedirect } from "next/navigation"

/** Legacy URL → канон B2B */
export default function BiznesLegacyRedirect() {
  permanentRedirect("/business")
}
