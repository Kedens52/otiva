"use client"

import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getStoredCity,
  isCityFilterActive,
  NASHLO_CITIES_FOR_LISTING,
  NASHLO_CITY_ANYWHERE,
  NASHLO_CITY_CHANGE_EVENT,
} from "@/lib/city-selection"

type WantToBuyCityFieldProps = {
  value: string
  onChange: (city: string) => void
  label?: string
  /** Для поиска: «Везде» = без фильтра по городу */
  allowAnywhere?: boolean
  /** Подставить город из шапки, если поле пустое */
  useStoredCityDefault?: boolean
  id?: string
}

export function WantToBuyCityField({
  value,
  onChange,
  label = "Город",
  allowAnywhere = false,
  useStoredCityDefault = false,
  id = "wtb-city",
}: WantToBuyCityFieldProps) {
  useEffect(() => {
    if (!useStoredCityDefault || value.trim()) return
    const stored = getStoredCity()
    if (isCityFilterActive(stored)) onChange(stored)
  }, [useStoredCityDefault, value, onChange])

  useEffect(() => {
    if (!useStoredCityDefault) return
    function onCityChange() {
      const stored = getStoredCity()
      if (isCityFilterActive(stored) && !value.trim()) onChange(stored)
    }
    window.addEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
    return () => window.removeEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
  }, [useStoredCityDefault, value, onChange])

  const selectValue =
    value.trim() ||
    (allowAnywhere ? NASHLO_CITY_ANYWHERE : "") ||
    (useStoredCityDefault && isCityFilterActive(getStoredCity()) ? getStoredCity() : "")

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select
        value={selectValue || undefined}
        onValueChange={(v) => {
          if (allowAnywhere && v === NASHLO_CITY_ANYWHERE) onChange("")
          else onChange(v)
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={allowAnywhere ? "Везде" : "Выберите город"} />
        </SelectTrigger>
        <SelectContent className="max-h-[min(320px,70vh)]">
          {allowAnywhere ? (
            <SelectItem value={NASHLO_CITY_ANYWHERE}>{NASHLO_CITY_ANYWHERE}</SelectItem>
          ) : null}
          {NASHLO_CITIES_FOR_LISTING.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
