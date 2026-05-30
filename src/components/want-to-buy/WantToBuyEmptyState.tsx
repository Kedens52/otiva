import { EmptyState } from "@/components/marketplace/EmptyState"
import { getWantToBuyCreatePath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"

type WantToBuyEmptyStateProps = {
  variant?: "feed" | "offers" | "mine" | "category"
}

export function WantToBuyEmptyState({ variant = "feed" }: WantToBuyEmptyStateProps) {
  if (variant === "mine") {
    return (
      <EmptyState
        title="У вас пока нет заявок"
        description="Разместите заявку — продавцы сами предложат подходящий товар."
        actionLabel="Создать заявку"
        actionHref={getWantToBuyCreatePath()}
        compact
      />
    )
  }

  if (variant === "category") {
    return (
      <EmptyState
        title="В этой категории пока нет заявок"
        description="Будьте первым продавцом с откликом или загляните в другие разделы."
        actionLabel="Все заявки"
        actionHref={getWantToBuyHubPath()}
        compact
      />
    )
  }

  if (variant === "offers") {
    return (
      <EmptyState
        title="Пока нет откликов"
        description="Когда продавцы предложат товар, отклики появятся здесь."
        compact
      />
    )
  }

  return (
    <EmptyState
      title="Пока нет активных заявок"
      description="Станьте первым — разместите заявку или загляните позже."
      actionLabel="Создать заявку"
      actionHref={getWantToBuyCreatePath()}
      compact
    />
  )
}
