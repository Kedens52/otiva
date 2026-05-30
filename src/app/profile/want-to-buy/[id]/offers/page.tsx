import { ProfileWantToBuyOffers } from "@/components/want-to-buy/profile/ProfileWantToBuyOffers"

type PageProps = {
  params: { id: string }
}

export default function ProfileWantToBuyOffersPage({ params }: PageProps) {
  return <ProfileWantToBuyOffers wantToBuyId={params.id} />
}
