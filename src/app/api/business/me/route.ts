import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserCompanyAccess, pickPrimaryCompanyAccess } from "@/lib/business/access"
import { buildPermissionFlags } from "@/lib/business/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  const companies = await getUserCompanyAccess(user.id)
  const primaryAccess = pickPrimaryCompanyAccess(companies)

  let primary = null
  if (primaryAccess) {
    const row = await prisma.company.findUnique({
      where: { id: primaryAccess.companyId },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        rejectionReason: true,
        ownerId: true,
      },
    })
    if (row) {
      primary = {
        companyId: row.id,
        companyName: row.name,
        role: primaryAccess.role,
        verificationStatus: row.verificationStatus,
        rejectionReason: row.rejectionReason,
        isOwner: row.ownerId === user.id,
        permissions: buildPermissionFlags(primaryAccess.role, row.verificationStatus),
      }
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified,
    },
    companies,
    hasBusinessProfile: companies.length > 0,
    primary,
  })
}
