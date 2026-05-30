import { createSectionCityMetadata, createSectionCityPage } from "@/lib/business/section-route"

const SECTION = "equipment" as const
export const generateMetadata = createSectionCityMetadata(SECTION)
export default createSectionCityPage(SECTION)
