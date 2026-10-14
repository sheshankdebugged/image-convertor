/**
 * Turn a PNG/JPG filename into a WebP name with spaces replaced by underscores.
 * Example: "240*240 autumn delas.png" → "240*240_autumn_delas.webp"
 */
export function sanitizeFilename(name) {
  const base = String(name).replace(/\.(png|jpe?g)$/i, '')
  return `${base.replaceAll(' ', '_')}.webp`
}

export function isConvertibleImage(file) {
  if (!file) return false
  if (file.type === 'image/png' || file.type === 'image/jpeg') return true
  return /\.(png|jpe?g)$/i.test(file.name)
}

export function isJpegFile(file) {
  if (!file) return false
  if (file.type === 'image/jpeg') return true
  return /\.jpe?g$/i.test(file.name)
}
