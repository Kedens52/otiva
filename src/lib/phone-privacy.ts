type SellerContactFields = {
  id: string
  phone?: string | null
  showPhone?: boolean | null
}

export type PublicSellerContact = Omit<SellerContactFields, "phone"> & {
  phone?: string | null
  phoneAvailable: boolean
  phoneMasked?: string
}

/** Маска для UI до раскрытия номера (без полного номера в ответе API). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 4) return "•••"
  const last2 = digits.slice(-2)
  if (digits.length >= 11 && (digits[0] === "7" || digits[0] === "8")) {
    return `+7 *** ***-**-${last2}`
  }
  return `${digits.slice(0, Math.min(3, digits.length - 2))}••••••${last2}`
}

export function sellerPhoneAvailable(seller: {
  phone?: string | null
  showPhone?: boolean | null
}): boolean {
  return Boolean(seller.phone?.trim()) && Boolean(seller.showPhone)
}

export function toPublicSellerContact<T extends SellerContactFields>(
  seller: T,
  viewerUserId?: string | null,
): Omit<T, "phone"> & PublicSellerContact {
  const hasPhone = Boolean(seller.phone?.trim())
  const canReveal = sellerPhoneAvailable(seller)
  const isSelf = Boolean(viewerUserId && seller.id === viewerUserId)

  if (isSelf) {
    return {
      ...seller,
      phone: seller.phone ?? null,
      phoneAvailable: hasPhone,
      phoneMasked: hasPhone ? maskPhone(seller.phone!) : undefined,
    }
  }

  const { phone: _phone, ...rest } = seller
  return {
    ...rest,
    phoneAvailable: canReveal,
    phoneMasked: canReveal && hasPhone ? maskPhone(seller.phone!) : undefined,
  }
}
