# image convertor

Client-side **JavaScript** PNG/JPG → lossless WebP converter. Drop one or many images in the browser; each file is decoded and re-encoded with WASM codecs (`@jsquash/png`, `@jsquash/jpeg`, `@jsquash/webp`). Nothing is uploaded to a server.

This project is a small demo of browser JavaScript image pipelines: the File API, drag-and-drop, async batching, and WebAssembly codecs from the Squoosh / jSquash ecosystem.

## Features

- Batch convert PNG and JPG/JPEG via file picker or drag-and-drop
- **Lossless** WebP output (`lossless: 1`) so decoded pixel data is preserved
- Filename sanitization: spaces become underscores, extension becomes `.webp`
  - Example: `240*240 autumn delas.png` → `240*240_autumn_delas.webp`
  - Example: `photo summer sale.jpg` → `photo_summer_sale.webp`
- Single-file download, or a ZIP (`image-convertor-batch.zip`) for multiple outputs

## Run locally

```bash
npm install
npm run dev
```

Open the URL Parcel prints (usually `http://localhost:1234`).

## Deploy to GitHub Pages

This repo uses **Parcel** (not Vite) and a GitHub Actions workflow that publishes `dist/` to GitHub Pages.

1. Create a GitHub repo and push this project.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually).
4. Site URL will look like: `https://<username>.github.io/<repo>/`

The build uses `--public-url ./` so asset paths work under a project Pages subdirectory.

Manual build (optional):

```bash
npm run build
# output is in dist/
```

## How it works

| Module | Role |
|--------|------|
| [`src/filename.js`](src/filename.js) | Pure JS rename rules (`sanitizeFilename`) |
| [`src/convert.js`](src/convert.js) | PNG/JPEG decode → lossless WebP encode + batch concurrency |
| [`src/main.js`](src/main.js) | UI: drop zone, queue, progress, ZIP download |

All processing stays in the browser. No backend, accounts, or uploads.

## License

MIT
