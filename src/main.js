import './ui.css'
import JSZip from 'jszip'
import { isConvertibleImage, sanitizeFilename } from './filename.js'
import { processBatch } from './convert.js'

/** @type {{ file: File, outputName: string, status: string, error?: string, inputBytes?: number, outputBytes?: number, blob?: Blob }[]} */
let queue = []

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="hero">
    <h1 class="brand">image convertor</h1>
    <p class="title">Drop PNG or JPG. Get clean WebP files.</p>
    <p class="lede">
      Convert batches of PNG and JPG images to lossless WebP right in your browser.
      Files never leave your device.
    </p>
  </header>

  <section
    class="dropzone"
    id="dropzone"
    tabindex="0"
    aria-label="Drop PNG or JPG files here"
  >
    <div class="dropzone-icon" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="10" width="28" height="22" rx="4" stroke="currentColor" stroke-width="1.75"/>
        <path d="M14 22l4.5-4.5L24 23l3-3 5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="15" cy="16" r="2" fill="currentColor"/>
      </svg>
    </div>
    <p class="dropzone-title">Drag &amp; drop PNG or JPG files here</p>
    <p class="dropzone-hint">or pick multiple files at once</p>
    <label class="file-label">
      Choose images
      <input
        class="file-input"
        id="file-input"
        type="file"
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        multiple
      />
    </label>
  </section>

  <p class="notice" id="notice" role="status"></p>

  <ul class="queue" id="queue" aria-live="polite"></ul>

  <div class="progress-wrap" id="progress-wrap">
    <div class="progress-bar" aria-hidden="true"><span id="progress-fill"></span></div>
    <p class="progress-label" id="progress-label">0 / 0</p>
  </div>

  <div class="actions">
    <button type="button" class="btn-primary" id="btn-convert" disabled>Convert all</button>
    <button type="button" class="btn-secondary" id="btn-download" disabled>Download</button>
    <button type="button" class="btn-secondary" id="btn-clear" disabled>Clear queue</button>
  </div>

  <aside class="tips" aria-label="What happens on convert">
    <div class="tip">
      <h2>Cleaner filenames</h2>
      <p>
        Spaces become underscores so downloads are web-friendly.
        <span class="example"><code>240*240 autumn delas.png</code>
        <span class="arrow">→</span>
        <code>240*240_autumn_delas.webp</code></span>
      </p>
    </div>
    <div class="tip">
      <h2>No quality loss</h2>
      <p>
        Every pixel is preserved with lossless WebP encoding.
        Smaller files, same sharpness — processed fully on your machine.
      </p>
    </div>
  </aside>
`

const dropzone = document.querySelector('#dropzone')
const fileInput = document.querySelector('#file-input')
const noticeEl = document.querySelector('#notice')
const queueEl = document.querySelector('#queue')
const progressWrap = document.querySelector('#progress-wrap')
const progressFill = document.querySelector('#progress-fill')
const progressLabel = document.querySelector('#progress-label')
const btnConvert = document.querySelector('#btn-convert')
const btnDownload = document.querySelector('#btn-download')
const btnClear = document.querySelector('#btn-clear')

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function setNotice(message) {
  noticeEl.textContent = message || ''
}

function renderQueue() {
  queueEl.innerHTML = queue
    .map((item, index) => {
      let meta = item.status
      if (item.status === 'done' && item.inputBytes != null) {
        meta = `done · ${formatBytes(item.inputBytes)} → ${formatBytes(item.outputBytes)}`
      } else if (item.status === 'error') {
        meta = `error · ${item.error || 'failed'}`
      }

      return `
        <li class="queue-item" data-index="${index}">
          <div class="names">
            <span class="from">${escapeHtml(item.file.name)}</span>
            <span class="to">→ ${escapeHtml(item.outputName)}</span>
          </div>
          <div class="meta status-${item.status}">${escapeHtml(meta)}</div>
        </li>
      `
    })
    .join('')

  const hasItems = queue.length > 0
  const hasPending = queue.some((item) => item.status === 'pending')
  const hasDone = queue.some((item) => item.status === 'done' && item.blob)

  btnConvert.disabled = !hasPending
  btnDownload.disabled = !hasDone
  btnClear.disabled = !hasItems
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function addFiles(fileList) {
  const files = Array.from(fileList || [])
  if (!files.length) return

  const images = files.filter(isConvertibleImage)
  const skipped = files.length - images.length

  for (const file of images) {
    queue.push({
      file,
      outputName: sanitizeFilename(file.name),
      status: 'pending',
    })
  }

  if (skipped > 0) {
    setNotice(`Skipped ${skipped} unsupported file${skipped === 1 ? '' : 's'} (PNG/JPG only).`)
  } else {
    setNotice(images.length ? `Added ${images.length} image${images.length === 1 ? '' : 's'}.` : '')
  }

  renderQueue()
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function convertAll() {
  const pendingIndexes = queue
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === 'pending')

  if (!pendingIndexes.length) return

  btnConvert.disabled = true
  btnClear.disabled = true
  btnDownload.disabled = true
  progressWrap.classList.add('is-visible')
  progressFill.style.width = '0%'
  progressLabel.textContent = `0 / ${pendingIndexes.length}`

  const files = pendingIndexes.map(({ item }) => item.file)

  await processBatch(files, {
    concurrency: 2,
    onProgress(done, total, result, batchIndex) {
      const entry = pendingIndexes[batchIndex]
      const target = queue[entry.index]
      if (result.ok) {
        target.status = 'done'
        target.blob = result.blob
        target.inputBytes = result.inputBytes
        target.outputBytes = result.outputBytes
        target.outputName = result.outputName
      } else {
        target.status = 'error'
        target.error = result.error
      }
      progressFill.style.width = `${Math.round((done / total) * 100)}%`
      progressLabel.textContent = `${done} / ${total}`
      renderQueue()
    },
  })

  btnClear.disabled = false
  renderQueue()
  setNotice('Conversion finished. Download when ready.')
}

async function downloadResults() {
  const done = queue.filter((item) => item.status === 'done' && item.blob)
  if (!done.length) return

  if (done.length === 1) {
    downloadBlob(done[0].blob, done[0].outputName)
    return
  }

  const zip = new JSZip()
  for (const item of done) {
    zip.file(item.outputName, item.blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'image-convertor-batch.zip')
}

function clearQueue() {
  queue = []
  setNotice('')
  progressWrap.classList.remove('is-visible')
  progressFill.style.width = '0%'
  progressLabel.textContent = '0 / 0'
  renderQueue()
}

;['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault()
    dropzone.classList.add('is-dragover')
  })
})

;['dragleave', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault()
    if (eventName === 'dragleave' && event.target !== dropzone) return
    dropzone.classList.remove('is-dragover')
  })
})

dropzone.addEventListener('drop', (event) => {
  addFiles(event.dataTransfer?.files)
})

fileInput.addEventListener('change', () => {
  addFiles(fileInput.files)
  fileInput.value = ''
})

btnConvert.addEventListener('click', () => {
  convertAll().catch((error) => {
    setNotice(error instanceof Error ? error.message : String(error))
    renderQueue()
  })
})

btnDownload.addEventListener('click', () => {
  downloadResults().catch((error) => {
    setNotice(error instanceof Error ? error.message : String(error))
  })
})

btnClear.addEventListener('click', clearQueue)

renderQueue()
