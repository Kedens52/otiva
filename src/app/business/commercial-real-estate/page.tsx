import { createSectionRootMetadata, createSectionRootPage } from "@/lib/business/section-route"

const SECTION = "commercial-real-estate" as const
export const generateMetadata = () => createSectionRootMetadata(SECTION)
export default createSectionRootPage(SECTION)
