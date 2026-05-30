"use client"

type CompressOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: "image/jpeg" | "image/webp"
}

export async function compressImageFile(file: File, options: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith("image/")) return file
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = "image/jpeg",
  } = options

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return file
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })

  if (!blob || blob.size >= file.size) return file

  const baseName = file.name.replace(/\.[^.]+$/, "")
  const extension = mimeType === "image/webp" ? "webp" : "jpg"
  return new File([blob], `${baseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  })
}

export async function imageFileToCompressedDataUrl(file: File, options: CompressOptions = {}): Promise<string> {
  const compressed = await compressImageFile(file, {
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 0.9,
    mimeType: "image/webp",
    ...options,
  })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение"))
    reader.readAsDataURL(compressed)
  })
}
