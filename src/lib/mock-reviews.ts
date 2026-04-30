export type Review = {
  id: string
  author: string
  avatar: string
  rating: number
  date: string
  text: string
  listingTitle: string
  role: "buyer" | "seller"
  helpful: number
}

export const SELLER_REVIEWS: Record<string, Review[]> = {
  "Алексей Морозов": [
    { id: "r1", author: "Иван К.", avatar: "И", rating: 5, date: "12 апр 2025", text: "Отличный продавец, машина в точном соответствии с описанием. Быстро ответил, сделка прошла без сюрпризов. Рекомендую.", listingTitle: "BMW 3 Series", role: "buyer", helpful: 14 },
    { id: "r2", author: "Мария Л.", avatar: "М", rating: 5, date: "3 мар 2025", text: "Всё честно, без скрытых дефектов. Дал проверить машину на СТО — без вопросов. Цена соответствует состоянию.", listingTitle: "BMW 3 Series", role: "buyer", helpful: 8 },
    { id: "r3", author: "Олег П.", avatar: "О", rating: 4, date: "18 янв 2025", text: "Хороший продавец, но немного затянул с документами. В остальном всё нормально, машина в заявленном состоянии.", listingTitle: "BMW 3 Series", role: "buyer", helpful: 3 },
    { id: "r4", author: "Светлана Р.", avatar: "С", rating: 5, date: "5 дек 2024", text: "Приятная сделка. Алексей очень внимателен к покупателю, всё объяснил и показал. Буду обращаться ещё.", listingTitle: "BMW 3 Series", role: "buyer", helpful: 11 },
    { id: "r5", author: "Денис В.", avatar: "Д", rating: 5, date: "20 окт 2024", text: "Профессионал своего дела. Машина чистая, документы в порядке. Торг был адекватный.", listingTitle: "BMW 3 Series", role: "buyer", helpful: 6 },
  ],
  "Марина Волкова": [
    { id: "r6", author: "Артём Н.", avatar: "А", rating: 5, date: "8 апр 2025", text: "Продавец с душой — рассказала всю историю машины, показала все квитанции сервиса. Редкость сейчас.", listingTitle: "Mercedes-Benz E-Class", role: "buyer", helpful: 19 },
    { id: "r7", author: "Татьяна М.", avatar: "Т", rating: 4, date: "22 фев 2025", text: "Хороший продавец, честный. Единственный минус — долго отвечала в чате, но в итоге всё решили.", listingTitle: "Mercedes-Benz E-Class", role: "buyer", helpful: 5 },
    { id: "r8", author: "Кирилл Ф.", avatar: "К", rating: 5, date: "10 янв 2025", text: "Отличная сделка. Машина реально в отличном состоянии, как на фото. Чувствуется, что за ней ухаживали.", listingTitle: "Mercedes-Benz E-Class", role: "buyer", helpful: 9 },
  ],
  "Илья Соколов": [
    { id: "r9",  author: "Анастасия Г.", avatar: "А", rating: 5, date: "1 апр 2025", text: "Быстро, честно, по делу. Tesla в идеальном состоянии, зарядка полная при передаче. Алилуйя, нормальный продавец!", listingTitle: "Tesla Model 3", role: "buyer", helpful: 22 },
    { id: "r10", author: "Максим К.", avatar: "М", rating: 3, date: "14 мар 2025", text: "Машина нормальная, но продавец немного завысил цену. Пришлось поторговаться дольше обычного.", listingTitle: "Tesla Model 3", role: "buyer", helpful: 4 },
  ],
}

export function getReviews(sellerName: string): Review[] {
  return SELLER_REVIEWS[sellerName] ?? []
}

export function calcRating(reviews: Review[]): { avg: number; count: number; dist: number[] } {
  if (!reviews.length) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] }
  const dist = [0, 0, 0, 0, 0]
  let sum = 0
  for (const r of reviews) {
    sum += r.rating
    dist[r.rating - 1]++
  }
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length, dist }
}
