import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { ExtractError, config, extract } from './extract'
const app = express()
app.use(cors({ origin: [/^http:\/\/(127\.0\.0\.1|localhost):\d+$/] }))
app.use(express.json({ limit: '15mb' }))
const Body = z.object({ image: z.string().max(14_000_000).refine((s) => /^data:image\/(png|jpeg|jpg|webp);base64,/.test(s)) })
app.get('/api/v1/health', (_q, res) => { res.json({ ok: true, ...config() }) })
app.post('/api/v1/extract', async (req, res) => {
  const p = Body.safeParse(req.body)
  if (!p.success) { res.status(400).json({ error: 'Send JSON with an "image" data URL (PNG, JPEG or WebP).' }); return }
  try { res.json(await extract(p.data.image)) }
  catch (e) { const s = e instanceof ExtractError ? e.status : 500; res.status(s).json({ error: e instanceof Error ? e.message : 'Extraction failed.' }) }
})
const port = Number(process.env.PORT) || 4000
app.listen(port, '127.0.0.1', () => console.log(`Semestra API on http://127.0.0.1:${port} (${config().provider}, ${config().model})`))
