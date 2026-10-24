import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { ExplainBody, ExtractError, config, explain, extract } from './extract'
import { rateLimit } from './rateLimit'

const Body = z.object({ image: z.string().max(14_000_000).refine((s) => /^data:image\/(png|jpeg|jpg|webp);base64,/.test(s)) })
const fail = (e: unknown, fallback: string) => ({ status: e instanceof ExtractError ? e.status : 500, error: e instanceof Error ? e.message : fallback })

export function createApp(opts: { rateMax?: number; rateWindowMs?: number; staticDir?: string } = {}) {
  const prod = process.env.NODE_ENV === 'production'
  const app = express()
  if (prod) app.set('trust proxy', 1) // the host's proxy sets X-Forwarded-For; needed so the limiter sees real client IPs
  app.disable('x-powered-by')
  app.use((_q, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' }); next() })
  // In production the API and the page share one origin, so CORS is only for local dev (or an explicit ALLOWED_ORIGIN).
  const origins = process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : prod ? [] : [/^http:\/\/(127\.0\.0\.1|localhost):\d+$/]
  if (origins.length) app.use(cors({ origin: origins }))
  app.use(express.json({ limit: '15mb' }))
  const limit = rateLimit(opts.rateMax ?? (Number(process.env.RATE_LIMIT_MAX) || 60), opts.rateWindowMs ?? 10 * 60_000)

  app.get('/api/v1/health', (_q, res) => { res.json({ ok: true, ...config() }) })
  app.post('/api/v1/extract', limit, async (req, res) => {
    const p = Body.safeParse(req.body)
    if (!p.success) { res.status(400).json({ error: 'Send JSON with an "image" data URL (PNG, JPEG or WebP).' }); return }
    try { res.json(await extract(p.data.image)) } catch (e) { const f = fail(e, 'Extraction failed.'); res.status(f.status).json({ error: f.error }) }
  })
  app.post('/api/v1/explain', limit, async (req, res) => {
    const p = ExplainBody.safeParse(req.body)
    if (!p.success) { res.status(400).json({ error: 'Send language, label, alternative and a list of clashes.' }); return }
    try { res.json(await explain(p.data)) } catch (e) { const f = fail(e, 'Explanation failed.'); res.status(f.status).json({ error: f.error }) }
  })
  app.use('/api', (_q, res) => { res.status(404).json({ error: 'Not found.' }) })

  // Serve the built frontend (npm run build creates dist/). Absent in dev, where Vite serves the page.
  const dist = opts.staticDir ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
  if (fs.existsSync(path.join(dist, 'index.html'))) app.use(express.static(dist))

  // Bad JSON or an oversized body would otherwise return an HTML error page.
  const onError: ErrorRequestHandler = (err, _q, res, _n) => {
    const status = err?.status === 413 ? 413 : 400
    res.status(status).json({ error: status === 413 ? 'The image is too large. Try a smaller file.' : 'The request could not be read.' })
  }
  app.use(onError)
  return app
}
