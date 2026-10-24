import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { uid } from '../types'
import type { ClassRow } from '../types'
const MAX = 1600
export const SERVER_DOWN = import.meta.env.DEV ? 'Cannot reach the Semestra server. Start it with: npm run dev:all' : 'Cannot reach the Semestra server. Check your connection and try again.'
const jpeg = (src: CanvasImageSource, w: number, h: number) => {
  const k = Math.min(1, MAX / Math.max(w, h)); const c = document.createElement('canvas')
  c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85)
}
async function pages(file: File): Promise<string[]> {
  if (file.type !== 'application/pdf') { const b = await createImageBitmap(file); return [jpeg(b, b.width, b.height)] }
  const pdfjs = await import('pdfjs-dist') // loaded only when a PDF is used, keeps the first page load small
  pdfjs.GlobalWorkerOptions.workerSrc = worker
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
    const r = await fetch('/api/v1/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imgs[i] }) })
      .catch(() => { throw new Error(SERVER_DOWN) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || `The server returned an error (${r.status}).`)
    model = j.model; rows.push(...(j.rows as Omit<ClassRow, 'id'>[]).map((x) => ({ ...x, id: uid() })))
  }
  return { rows, model }
}
