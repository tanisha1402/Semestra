import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { pageData, parsePage } from './routine'
import type { Cell } from './routine'
import { uid } from '../types'
import type { ClassRow } from '../types'
const MAX = 1600
// Empty in dev and when the API serves the page (Render). On Vercel, set VITE_API_URL to the Render URL.
export const API = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')
export const SERVER_DOWN = import.meta.env.DEV ? 'Cannot reach the Semestra server. Start it with: npm run dev:all' : 'Cannot reach the Semestra server. Check your connection and try again.'
const jpeg = (src: CanvasImageSource, w: number, h: number) => {
  const k = Math.min(1, MAX / Math.max(w, h)); const c = document.createElement('canvas')
  c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85)
}
async function loadPdf() {
  const pdfjs = await import('pdfjs-dist') // loaded only when a PDF is used, keeps the first page load small
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  return pdfjs
}
/** Read a text-based routine PDF directly (no model): every class on every page. */
export async function routineFromPdf(file: File, onProgress: (m: string) => void): Promise<Cell[]> {
  const pdfjs = await loadPdf(); const cells: Cell[] = []
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise.catch(() => { throw new Error('This file could not be opened as a PDF.') })
  for (let i = 1; i <= doc.numPages; i++) { onProgress(`Reading page ${i} of ${doc.numPages}`); cells.push(...parsePage(await pageData(pdfjs, await doc.getPage(i))).cells) }
  return cells
}
async function pages(file: File): Promise<string[]> {
  if (file.type !== 'application/pdf') { const b = await createImageBitmap(file); return [jpeg(b, b.width, b.height)] }
  const pdfjs = await loadPdf()
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise; const out: string[] = []
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const vp = (await doc.getPage(i)).getViewport({ scale: 2 }); const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height
    await (await doc.getPage(i)).render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise; out.push(jpeg(c, c.width, c.height))
  }
  return out
}
export async function extractFromFile(file: File, onProgress: (m: string) => void) {
  onProgress('Preparing the file')
  const imgs = await pages(file).catch(() => { throw new Error('This file could not be opened. Try a photo or a different PDF.') })
  const rows: ClassRow[] = []; let model = ''
  for (let i = 0; i < imgs.length; i++) {
    onProgress(`Gemma is reading page ${i + 1} of ${imgs.length}. A local model can take a minute.`)
    const r = await fetch(`${API}/api/v1/extract`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imgs[i] }) })
      .catch(() => { throw new Error(SERVER_DOWN) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || `The server returned an error (${r.status}).`)
    model = j.model; rows.push(...(j.rows as Omit<ClassRow, 'id'>[]).map((x) => ({ ...x, id: uid() })))
  }
  return { rows, model }
}
