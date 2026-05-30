"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { EmptyState } from "@/components/profile/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WantToBuyStatusBadge } from "@/components/want-to-buy/WantToBuyStatusBadge"
import type { WantToBuyCardItem } from "@/lib/want-to-buy/client-types"
import {
  formatDaysLeft,
  formatWantToBuyPriceMax,
  wantToBuyConditionLabel,
} from "@/lib/want-to-buy/labels"
import { getWantToBuyCreatePath, wantToBuyItemPath } from "@/lib/want-to-buy/routes"

type Tab = "all" | "active" | "moderation" | "closed" | "expired" | "rejected"

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "active", label: "Активные" },
  { key: "moderation", label: "На модерации" },
  { key: "closed", label: "Закрытые" },
  { key: "expired", label: "Истёкшие" },
  { key: "rejected", label: "Отклонённые" },
]

export function ProfileWantToBuyList() {
  const [items, setItems] = useState<WantToBuyCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<WantToBuyCardItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriceMax, setEditPriceMax] = useState("")
  const [editCity, setEditCity] = useState("")
  const [editCondition, setEditCondition] = useState<"NEW" | "USED" | "ANY">("ANY")
  const [editError, setEditError] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/want-to-buy?mine=1")
    if (res.ok) {
      const data = (await res.json()) as { items?: WantToBuyCardItem[] }
      setItems(data.items ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab === "all") return true
      if (tab === "active") return item.status === "ACTIVE"
      if (tab === "moderation") return item.status === "MODERATION"
      if (tab === "closed") return item.status === "CLOSED"
      if (tab === "expired") return item.status === "EXPIRED"
      if (tab === "rejected") return item.status === "REJECTED"
      return true
    })
  }, [items, tab])

  async function closeRequest(id: string) {
    setPendingId(id)
    const res = await fetch(`/api/want-to-buy/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close: true }),
    })
    if (res.ok) await load()
    setPendingId(null)
  }

  async function renewRequest(id: string) {
    setPendingId(id)
    const res = await fetch(`/api/want-to-buy/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ renew: true }),
    })
    if (res.ok) await load()
    setPendingId(null)
  }

  function openEdit(item: WantToBuyCardItem) {
    setEditItem(item)
    setEditTitle(item.title)
    setEditDescription(item.description)
    setEditPriceMax(item.priceMax != null ? String(item.priceMax) : "")
    setEditCity(item.city ?? "")
    setEditCondition(item.condition)
    setEditError(null)
  }

  async function saveEdit() {
    if (!editItem) return
    setEditError(null)
    const priceParsed =
      editPriceMax.trim() === ""
        ? null
        : Number.parseInt(editPriceMax.replace(/\s/g, ""), 10)
    if (priceParsed != null && (!Number.isFinite(priceParsed) || priceParsed < 0)) {
      setEditError("Некорректный бюджет")
      return
    }
    setPendingId(editItem.id)
    const res = await fetch(`/api/want-to-buy/${editItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim(),
        priceMax: priceParsed,
        city: editCity.trim() || null,
        condition: editCondition,
      }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setEditError(data.error ?? "Не удалось сохранить")
      setPendingId(null)
      return
    }
    setEditItem(null)
    await load()
    setPendingId(null)
  }

  const canEdit = (status: string) =>
    status === "ACTIVE" || status === "MODERATION" || status === "EXPIRED"

  return (
    <CabinetPage
      title="Мои заявки"
      subtitle="Заявки «Куплю» — управление и отклики продавцов"
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/my-offers">Мои отклики</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={getWantToBuyCreatePath()}>Новая заявка</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-[hsl(var(--nashlo-orange))] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Нет заявок в этом разделе"
          description="Создайте заявку — продавцы предложат подходящие товары."
          actionLabel="Куплю"
          actionHref={getWantToBuyCreatePath()}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <WantToBuyStatusBadge status={item.status} />
                    <span className="text-xs text-zinc-500">{item.category.nameRu}</span>
                  </div>
                  <Link
                    href={wantToBuyItemPath(item)}
                    className="mt-2 block font-semibold text-zinc-950 hover:text-[hsl(var(--nashlo-orange))]"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatWantToBuyPriceMax(item.priceMax)}
                    {item.city ? ` · ${item.city}` : ""}
                    {" · "}
                    {wantToBuyConditionLabel(item.condition)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {item.offerCount} откликов · {item.views} просмотров
                    {item.status === "ACTIVE"
                      ? ` · ${formatDaysLeft(item.expiresAt)}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={wantToBuyItemPath(item)}>Открыть</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/profile/want-to-buy/${item.id}/offers`}>
                    Отклики ({item.offerCount})
                  </Link>
                </Button>
                {canEdit(item.status) ? (
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                    Редактировать
                  </Button>
                ) : null}
                {item.status === "ACTIVE" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pendingId === item.id}
                    onClick={() => void closeRequest(item.id)}
                  >
                    Закрыть
                  </Button>
                ) : null}
                {item.status === "EXPIRED" ? (
                  <Button
                    size="sm"
                    disabled={pendingId === item.id}
                    onClick={() => void renewRequest(item.id)}
                  >
                    Продлить
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать заявку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Макс. цена, ₽</Label>
              <Input
                value={editPriceMax}
                onChange={(e) => setEditPriceMax(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Состояние</Label>
              <Select
                value={editCondition}
                onValueChange={(v) => setEditCondition(v as typeof editCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Новый</SelectItem>
                  <SelectItem value="USED">Б/у</SelectItem>
                  <SelectItem value="ANY">Любое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={pendingId === editItem?.id}
                onClick={() => void saveEdit()}
              >
                Сохранить
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CabinetPage>
  )
}
