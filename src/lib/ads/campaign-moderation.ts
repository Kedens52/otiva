/** Поля, изменение которых у ACTIVE-кампании отправляет на повторную модерацию. */
export const MODERATION_SENSITIVE_FIELDS = new Set([
  "title",
  "description",
  "imageUrl",
  "mediaType",
  "mediaUrl",
  "mediaPosterUrl",
  "mediaAlt",
  "mediaWidth",
  "mediaHeight",
  "mediaDuration",
  "mediaSize",
  "mediaMimeType",
  "targetUrl",
  "ctaText",
  "companyName",
  "phone",
  "type",
  "placements",
  "categoryIds",
  "subcategoryIds",
  "cityIds",
  "regionIds",
  "districtIds",
  "device",
  "keywords",
  "interests",
  "city",
  "label",
])

export function hasModerationSensitiveChanges(changedKeys: string[]): boolean {
  return changedKeys.some((k) => MODERATION_SENSITIVE_FIELDS.has(k))
}
