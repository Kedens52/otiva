import { unlink } from "fs/promises"
import path from "path"

/**
 * Extracts the filename from an upload URL.
 * Handles both /api/uploads/filename.jpg and /uploads/filename.jpg
 */
function extractFilename(url: string): string | null {
  if (!url) return null
  const match = url.match(/\/(?:api\/)?uploads\/([^/?#]+)$/)
  return match ? match[1] : null
}

/**
 * Deletes a single uploaded file from disk.
 * Silently ignores missing files.
 */
export async function deleteUploadFile(url: string): Promise<void> {
  const filename = extractFilename(url)
  if (!filename) return
  // Prevent path traversal
  const safe = path.basename(filename)
  if (safe !== filename) return
  const filepath = path.join(process.cwd(), "public", "uploads", safe)
  try {
    await unlink(filepath)
  } catch (err: unknown) {
    // ENOENT = already deleted, ignore silently
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[upload-cleanup] Failed to delete", filepath, err)
    }
  }
}

/**
 * Deletes multiple upload files (images array + optional video).
 */
export async function deleteUploadFiles(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteUploadFile))
}

/**
 * Given old and new image/video lists, deletes only the files
 * that were removed (present in old, absent in new).
 */
export async function deleteRemovedFiles(
  oldImages: string[],
  newImages: string[],
  oldVideo?: string | null,
  newVideo?: string | null,
): Promise<void> {
  const newSet = new Set(newImages)
  const removedImages = oldImages.filter((url) => !newSet.has(url))
  const removedVideo = oldVideo && oldVideo !== newVideo ? [oldVideo] : []
  await deleteUploadFiles([...removedImages, ...removedVideo])
}
