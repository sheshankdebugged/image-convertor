/**
 * image-convertor — browser JS helpers for PNG/JPG → lossless WebP.
 * Built on the jSquash / Squoosh WASM codecs for use in web apps.
 */
export {
  sanitizeFilename,
  isConvertibleImage,
  isJpegFile,
} from './filename.js'

export { convertImageToWebp, processBatch } from './convert.js'
