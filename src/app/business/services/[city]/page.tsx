import { createSectionCityMetadata, createSectionCityPage } from "@/lib/business/section-route"

const SECTION = "services" as const
export const generateMetadata = createSectionCityMetadata(SECTION)
export default createSectionCityPage(SECTION)
