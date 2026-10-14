# image-convertor

**JavaScript library** for converting PNG/JPG to **lossless WebP** in the browser using WASM codecs from the [jSquash](https://github.com/jamsinclair/jSquash) / Squoosh ecosystem.

Use it in front-end apps (Vite, Parcel, webpack, plain ESM). The GitHub Pages site is the package documentation and a live demo of the same API.

## Install

```bash
npm install image-convertor
```

## Usage

```js
import {
  convertImageToWebp,
  processBatch,
  sanitizeFilename,
  isConvertibleImage,
} from 'image-convertor'

// One File → lossless WebP Blob
const { blob, outputName, inputBytes, outputBytes } =
  await convertImageToWebp(file)

// Batch with concurrency
const results = await processBatch(files, {
  concurrency: 2,
  onProgress(done, total, result, index) {
    console.log(done, '/', total, result.ok)
  },
})
```

## API

| Export | Description |
|--------|-------------|
| `convertImageToWebp(file)` | Decode PNG/JPEG `File`, encode lossless WebP → `{ blob, outputName, inputBytes, outputBytes }` |
| `processBatch(files, options?)` | Convert many files; `concurrency`, `onProgress` |
| `sanitizeFilename(name)` | Spaces → `_`, extension → `.webp` |
| `isConvertibleImage(file)` | MIME / extension check |
| `isJpegFile(file)` | JPEG detection helper |

## Why JavaScript developers use this

Browser pipelines often need image re-encoding without a backend. This package is a thin, documented JS module over `@jsquash/png`, `@jsquash/jpeg`, and `@jsquash/webp` so you can drop WASM codecs into an app without wiring each codec yourself.

## Docs & demo

- Site: https://sheshankdebugged.github.io/image-convertor/
- Source: https://github.com/sheshankdebugged/image-convertor

## Local docs site

```bash
npm install
npm run dev
```

## Publish notes

Library entry: [`src/index.js`](src/index.js). UI demo lives in [`src/main.js`](src/main.js) and is not part of the published package surface (`files` in `package.json`).

## License

MIT
