import type { RequestHandler } from 'express'
/** Fixed-window limiter per client IP, kept in memory. Good enough for one server process; resets on restart. */
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const hits = new Map<string, { n: number; reset: number }>()
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset <= now) hits.delete(k) }, windowMs).unref()
  return (req, res, next) => {
    const now = Date.now(); const ip = req.ip ?? 'unknown'; let h = hits.get(ip)
    if (!h || h.reset <= now) { h = { n: 0, reset: now + windowMs }; hits.set(ip, h) }
    if (++h.n > max) { res.set('Retry-After', String(Math.ceil((h.reset - now) / 1000))); res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' }); return }
    next()
  }
}
