import { createSectionRootMetadata, createSectionRootPage } from "@/lib/business/section-route"

const SECTION = "equipment" as const
export const generateMetadata = () => createSectionRootMetadata(SECTION)
export default createSectionRootPage(SECTION)
