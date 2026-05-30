import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sellerPhoneAvailable } from "@/lib/phone-privacy"

export const dynamic = "force-dynamic"

/** Раскрытие номера продавца — только если он разрешил показ в настройках. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: params.id },
      select: { phone: true, showPhone: true, isBanned: true },
    })

    if (!seller || seller.isBanned || !sellerPhoneAvailable(seller)) {
      return NextResponse.json({ error: "Телефон недоступен" }, { status: 404 })
    }

    return NextResponse.json({ phone: seller.phone })
  } catch (error) {
    console.error("contact-phone GET:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
