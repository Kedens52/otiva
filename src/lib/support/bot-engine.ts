import { findAutoReply } from "@/lib/support/auto-replies"
import { getKnowledge } from "@/lib/support/knowledge"
import type { SupportBotState } from "@/lib/support/bot-state"
import {
  CLARIFY_OPTIONS,
  SUPPORT_TOPIC_TREE,
  findTopicNode,
  topicBreadcrumbLabels,
  type SupportTopicNode,
} from "@/lib/support/topics"

export type BotButton = { id: string; label: string }

export type BotListingCard = {
  id: string
  title: string
  price: number
  image: string | null
  status: string
}

export type BotReply = {
  text: string
  buttons?: BotButton[]
  listings?: BotListingCard[]
  breadcrumbs?: string[]
  expectDescription?: boolean
  createTicket?: boolean
  escalate?: boolean
  autoReplyId?: string
  knowledgeId?: string
  state: SupportBotState
  topicId?: string
  subtopicId?: string
  listingId?: string
}

export type UserSupportContext = {
  userId: string
  userName: string | null
  listings: BotListingCard[]
  adCampaigns: { id: string; title: string; status: string }[]
  bonusBalance: number
}

export type BotInput =
  | { type: "text"; text: string }
  | { type: "button"; buttonId: string }
  | { type: "listing"; listingId: string }

const VAGUE_RE =
  /^(не\s*(выдает|выдаёт|работает|показывает|грузит|открывается|могу|вижу)|пропало|ошибка|баг|сломал|не\s+работает|деньги|реклама|баллы|помогите|help|что\s+делать)[\s!.?]*$/i

const SHORT_VAGUE_MAX = 28

export function isVagueUserMessage(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  if (t.length <= SHORT_VAGUE_MAX && VAGUE_RE.test(t)) return true
  if (/^(не\s+\S+|не\s*$)/i.test(t) && t.length < 40) return true
  return false
}

function rootButtons(): BotButton[] {
  return [
    ...SUPPORT_TOPIC_TREE.map((t) => ({ id: `root:${t.id}`, label: t.label })),
    { id: "human", label: "Позвать человека" },
  ]
}

function clarifyButtons(): BotButton[] {
  return [...CLARIFY_OPTIONS.map((o) => ({ id: o.id, label: o.label })), { id: "human", label: "Позвать человека" }]
}

function childButtons(node: SupportTopicNode): BotButton[] {
  if (node.issueOptions?.length) {
    return [
      ...node.issueOptions.map((i) => ({ id: `issue:${i.id}`, label: i.label })),
      { id: "human", label: "Позвать человека" },
    ]
  }
  if (node.children?.length) {
    return [
      ...node.children.map((c) => ({ id: `sub:${c.id}`, label: c.label })),
      { id: "human", label: "Позвать человека" },
    ]
  }
  return [
    { id: "describe", label: "Описать проблему" },
    { id: "human", label: "Позвать человека" },
  ]
}

function listingIssueButtons(): BotButton[] {
  return [
    { id: "issue:not_in_search", label: "Не видно в поиске" },
    { id: "issue:not_in_category", label: "Не видно в категории" },
    { id: "issue:no_views", label: "Нет просмотров" },
    { id: "issue:wrong_city", label: "Не в том городе" },
    { id: "issue:other", label: "Другое" },
    { id: "human", label: "Позвать человека" },
  ]
}

function afterIssueButtons(issueId: string): BotButton[] {
  const kb = issueId === "no_views" ? "listing_search" : undefined
  return [
    ...(kb ? [{ id: `kb:${kb}`, label: "Как работает поиск" }] : []),
    { id: "ticket", label: "Создать обращение" },
    { id: "human", label: "Позвать человека" },
  ]
}

function formatKnowledgeReply(kbId: string, state: SupportBotState): BotReply {
  const kb = getKnowledge(kbId)
  if (!kb) {
    return {
      text: "Могу передать вопрос специалисту — нажмите «Позвать человека» или «Создать обращение».",
      buttons: [{ id: "ticket", label: "Создать обращение" }, { id: "human", label: "Позвать человека" }],
      state,
    }
  }
  const text = `${kb.summary}\n\n${kb.bullets.map((b) => `• ${b}`).join("\n")}`
  return {
    text,
    buttons: [
      { id: "ticket", label: "Создать обращение" },
      { id: "human", label: "Позвать человека" },
      { id: "root:menu", label: "Другая тема" },
    ],
    breadcrumbs: topicBreadcrumbLabels(state.topicId, state.subtopicId),
    knowledgeId: kbId,
    state,
  }
}

function pickListingStep(
  ctx: UserSupportContext,
  state: SupportBotState,
  prompt: string
): BotReply {
  if (!ctx.listings.length) {
    return {
      text: "У вас пока нет объявлений в кабинете. Опишите проблему текстом или выберите другую тему.",
      buttons: [{ id: "describe", label: "Описать проблему" }, { id: "root:menu", label: "Выбрать тему" }],
      breadcrumbs: topicBreadcrumbLabels(state.topicId, state.subtopicId),
      state: { ...state, step: "await_description" },
      expectDescription: true,
    }
  }
  return {
    text:
      ctx.listings.length > 1
        ? `${prompt}\n\nНашёл ${ctx.listings.length} объявления — выберите, о каком идёт речь:`
        : `${prompt}\n\nВыберите объявление:`,
    listings: ctx.listings.slice(0, 8),
    buttons: [{ id: "root:menu", label: "Другая тема" }, { id: "human", label: "Позвать человека" }],
    breadcrumbs: topicBreadcrumbLabels(state.topicId, state.subtopicId),
    state: { ...state, step: "pick_listing" },
  }
}

function resolveTopicStep(
  topicId: string,
  subtopicId: string | undefined,
  ctx: UserSupportContext,
  state: SupportBotState
): BotReply {
  const node = findTopicNode(subtopicId ?? topicId)
  if (!node) {
    return {
      text: "Выберите тему обращения:",
      buttons: rootButtons(),
      state: { step: "pick_topic", clarifyAttempts: 0 },
    }
  }

  const n = node.node
  const nextState: SupportBotState = {
    ...state,
    topicId,
    subtopicId: subtopicId ?? topicId,
    step: "in_topic",
  }

  if (n.needsListing || n.id === "listing_search" || n.id === "my_listing") {
    return pickListingStep(ctx, nextState, `Тема: ${n.label}. О каком объявлении речь?`)
  }

  if (n.issueOptions?.length) {
    return {
      text: `${n.label}. Что именно происходит?`,
      buttons: childButtons(n),
      breadcrumbs: topicBreadcrumbLabels(topicId, subtopicId),
      state: { ...nextState, step: "pick_issue" },
    }
  }

  if (n.children?.length) {
    return {
      text: `${n.label}. Уточните, пожалуйста:`,
      buttons: childButtons(n),
      breadcrumbs: topicBreadcrumbLabels(topicId, subtopicId),
      state: { ...nextState, step: "pick_subtopic" },
    }
  }

  const kb = getKnowledge(n.id) ?? getKnowledge(topicId)
  if (kb) return formatKnowledgeReply(kb.id, nextState)

  return {
    text: `По теме «${n.label}» опишите проблему подробнее — передам специалисту при необходимости.`,
    buttons: [
      { id: "describe", label: "Описать проблему" },
      { id: "ticket", label: "Создать обращение" },
      { id: "human", label: "Позвать человека" },
    ],
    breadcrumbs: topicBreadcrumbLabels(topicId, subtopicId),
    state: { ...nextState, step: "await_description" },
    expectDescription: true,
  }
}

export function processSupportBot(
  input: BotInput,
  state: SupportBotState,
  ctx: UserSupportContext
): BotReply {
  const greet = ctx.userName ? `${ctx.userName}, ` : ""

  if (input.type === "button") {
    const id = input.buttonId

    if (id === "human") {
      return {
        text: `${greet}передам обращение специалисту. Кратко опишите проблему — это ускорит ответ.`,
        buttons: [{ id: "ticket", label: "Отправить обращение" }],
        state: { ...state, step: "await_description" },
        expectDescription: true,
        escalate: true,
      }
    }

    if (id === "ticket") {
      return {
        text: state.description
          ? "Создаю обращение с собранными данными. Специалист ответит здесь в чате."
          : "Опишите проблему одним сообщением — после этого создам обращение.",
        state: { ...state, step: state.description ? "ticket_ready" : "await_description" },
        expectDescription: !state.description,
        createTicket: Boolean(state.description),
        escalate: Boolean(state.description),
      }
    }

    if (id === "describe" || id === "root:menu") {
      if (id === "root:menu") {
        return {
          text: "Выберите тему обращения:",
          buttons: rootButtons(),
          state: { step: "pick_topic", clarifyAttempts: 0 },
        }
      }
      return {
        text: "Опишите проблему своими словами — что делали и что пошло не так.",
        state: { ...state, step: "await_description" },
        expectDescription: true,
      }
    }

    if (id.startsWith("clarify:")) {
      const opt = CLARIFY_OPTIONS.find((o) => o.id === id)
      if (opt) {
        return resolveTopicStep(opt.topicId, opt.subtopicId, ctx, {
          ...state,
          clarifyAttempts: (state.clarifyAttempts ?? 0) + 1,
        })
      }
    }

    if (id.startsWith("root:")) {
      const topicId = id.slice(5)
      if (topicId === "menu") {
        return {
          text: "Выберите тему:",
          buttons: rootButtons(),
          state: { step: "pick_topic" },
        }
      }
      const found = findTopicNode(topicId)
      if (!found) return { text: "Выберите тему:", buttons: rootButtons(), state: { step: "pick_topic" } }
      if (found.node.children?.length) {
        return {
          text: `${found.node.label}. Уточните:`,
          buttons: childButtons(found.node),
          breadcrumbs: [found.node.label],
          state: { ...state, topicId, step: "pick_subtopic" },
        }
      }
      return resolveTopicStep(topicId, topicId, ctx, state)
    }

    if (id.startsWith("sub:")) {
      const subId = id.slice(4)
      return resolveTopicStep(state.topicId ?? subId, subId, ctx, state)
    }

    if (id.startsWith("issue:")) {
      const issueId = id.slice(6)
      const next: SupportBotState = { ...state, issueId, step: "after_issue" }
      if (issueId === "no_views" && state.listingId) {
        const text =
          "Просмотры зависят от категории, города, качества объявления, фото, цены и продвижения. Могу подсказать общие правила или передать запрос специалисту."
        return {
          text,
          buttons: afterIssueButtons(issueId),
          breadcrumbs: topicBreadcrumbLabels(state.topicId, state.subtopicId),
          state: next,
        }
      }
      return {
        text: "Понял. Могу подсказать по правилам сервиса или создать обращение для проверки.",
        buttons: afterIssueButtons(issueId),
        state: next,
      }
    }

    if (id.startsWith("kb:")) {
      return formatKnowledgeReply(id.slice(3), state)
    }
  }

  if (input.type === "listing") {
    const listing = ctx.listings.find((l) => l.id === input.listingId)
    const next: SupportBotState = {
      ...state,
      listingId: input.listingId,
      step: "pick_issue",
    }
    if (!listing) {
      return {
        text: "Не удалось найти это объявление. Выберите другое или опишите проблему текстом.",
        buttons: listingIssueButtons(),
        state: next,
      }
    }
    return {
      text: `Объявление «${listing.title}». Что именно происходит?`,
      buttons: listingIssueButtons(),
      breadcrumbs: [...topicBreadcrumbLabels(state.topicId, state.subtopicId), listing.title],
      state: next,
    }
  }

  const text = input.type === "text" ? input.text.trim() : ""

  if (state.step === "await_description" || state.step === "ticket_ready") {
    const next: SupportBotState = { ...state, description: text, step: "ticket_ready" }
    return {
      text: `${greet}спасибо. Обращение передано специалисту — ответ появится в этом чате. Номер темы: ${topicBreadcrumbLabels(state.topicId, state.subtopicId).join(" → ") || "общий вопрос"}.`,
      buttons: [{ id: "root:menu", label: "Новый вопрос" }],
      state: next,
      createTicket: true,
      escalate: true,
      topicId: state.topicId,
      subtopicId: state.subtopicId,
      listingId: state.listingId,
    }
  }

  if (state.step === "pick_listing" && text) {
    const byTitle = ctx.listings.find((l) => l.title.toLowerCase().includes(text.toLowerCase()))
    if (byTitle) {
      return processSupportBot({ type: "listing", listingId: byTitle.id }, state, ctx)
    }
  }

  const auto = findAutoReply(text)
  if (auto && !isVagueUserMessage(text)) {
    return {
      text: `${auto.title}\n\n${auto.answer}`,
      buttons: [
        { id: "bot:helpful", label: "Помогло" },
        { id: "bot:escalate", label: "Нужен оператор" },
        { id: "root:menu", label: "Другая тема" },
      ],
      state: { ...state, step: "auto_answered" },
      autoReplyId: auto.id,
    }
  }

  if (isVagueUserMessage(text) || (state.clarifyAttempts ?? 0) < 1) {
    const attempts = (state.clarifyAttempts ?? 0) + 1
    if (attempts >= 3) {
      return {
        text: `${greet}чтобы быстрее помочь, передам вопрос специалисту. Опишите проблему одним сообщением.`,
        buttons: [{ id: "ticket", label: "Создать обращение" }, { id: "human", label: "Позвать человека" }],
        state: { ...state, step: "await_description", clarifyAttempts: attempts },
        expectDescription: true,
        escalate: true,
      }
    }
    return {
      text: `${greet}понял, нужен контекст. Уточните, что именно не выдаёт / не работает?`,
      buttons: clarifyButtons(),
      state: { ...state, step: "clarify", clarifyAttempts: attempts },
    }
  }

  if (!state.topicId) {
    return {
      text: `${greet}выберите тему — задам уточняющие вопросы по шагам.`,
      buttons: rootButtons(),
      state: { step: "pick_topic" },
    }
  }

  return {
    text: "Могу подсказать по выбранной теме или передать специалисту.",
    buttons: [
      { id: "root:menu", label: "Выбрать тему" },
      { id: "ticket", label: "Создать обращение" },
      { id: "human", label: "Позвать человека" },
    ],
    state: { ...state, description: text, step: "await_description" },
    expectDescription: false,
  }
}
