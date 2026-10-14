import { decode as decodePng } from '@jsquash/png'
import { decode as decodeJpeg } from '@jsquash/jpeg'
import { encode as encodeWebp } from '@jsquash/webp'
import { isJpegFile, sanitizeFilename } from './filename.js'

/**
 * Decode a PNG or JPEG File and re-encode as lossless WebP.
 * @param {File} file
 * @returns {Promise<{ blob: Blob, outputName: string, inputBytes: number, outputBytes: number }>}
 */
export async function convertImageToWebp(file) {
  const inputBuffer = await file.arrayBuffer()
  const imageData = isJpegFile(file)
    ? await decodeJpeg(inputBuffer)
    : await decodePng(inputBuffer)
  const webpBuffer = await encodeWebp(imageData, { lossless: 1 })
  const blob = new Blob([webpBuffer], { type: 'image/webp' })
  const outputName = sanitizeFilename(file.name)

  return {
    blob,
    outputName,
    inputBytes: file.size,
    outputBytes: blob.size,
  }
}

/**
 * Convert files with limited concurrency.
 * @param {File[]} files
 * @param {{ concurrency?: number, onProgress?: (done: number, total: number, result: object, index: number) => void }} options
 */
export async function processBatch(files, options = {}) {
  const concurrency = options.concurrency ?? 2
  const onProgress = options.onProgress
  const results = new Array(files.length)
  let nextIndex = 0
  let doneCount = 0

  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex++
      const file = files[index]
      try {
        const converted = await convertImageToWebp(file)
        results[index] = { ok: true, file, ...converted }
      } catch (error) {
        results[index] = {
          ok: false,
          file,
          outputName: sanitizeFilename(file.name),
          error: error instanceof Error ? error.message : String(error),
        }
      }
      doneCount += 1
      onProgress?.(doneCount, files.length, results[index], index)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, files.length) },
    () => worker(),
  )
  await Promise.all(workers)
  return results
}
