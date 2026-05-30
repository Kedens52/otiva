type CompanyLike = {
  logoUrl?: string | null
  coverUrl?: string | null
  shortDescription?: string | null
  description?: string | null
  city?: string | null
  industry?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  paymentTerms?: string | null
  minOrderInfo?: string | null
  verificationStatus?: string
}

export function computeProfileCompleteness(
  company: CompanyLike,
  activeListings: number,
  catalogCategories: number,
  publicDocuments = 0,
): number {
  const checks = [
    Boolean(company.logoUrl),
    Boolean(company.coverUrl),
    Boolean(company.shortDescription || company.description),
    Boolean(company.city),
    Boolean(company.industry),
    Boolean(company.contactPhone || company.contactEmail),
    Boolean(company.paymentTerms || company.minOrderInfo),
    activeListings >= 1,
    catalogCategories >= 1 || activeListings >= 1,
    publicDocuments >= 1,
    company.verificationStatus === "VERIFIED",
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}
