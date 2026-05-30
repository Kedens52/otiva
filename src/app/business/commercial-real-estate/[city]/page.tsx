import { createSectionCityMetadata, createSectionCityPage } from "@/lib/business/section-route"

const SECTION = "commercial-real-estate" as const
export const generateMetadata = createSectionCityMetadata(SECTION)
export default createSectionCityPage(SECTION)
