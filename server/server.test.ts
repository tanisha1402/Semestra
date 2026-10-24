// Runs the real Express app against a FAKE Ollama. It proves our plumbing (validation, retry, errors, limits), not Gemma's quality.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { createApp } from './app'

let mode: 'good' | 'bad' | 'bad-then-good' | 'down' = 'good'; let calls = 0; let lastBody: any = null
const GOOD = JSON.stringify({ rows: [
  { course: 'cse-2101', section: 'A', day: 'Saturday', start: '9:00', end: '10:30', room: 'R101' },
  { course: 'CSE 2101', section: 'B', day: 'mon', start: '1:30', end: '3:00 PM', room: null },
  { course: 'MAT1101', section: 'A', day: 'Thu', start: '10:30 AM', end: '12:00', room: 'R5' },
] })
const fake = http.createServer((req, res) => {
  let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
    calls++; lastBody = JSON.parse(b)
    const out = mode === 'good' || (mode === 'bad-then-good' && calls > 1) ? GOOD : 'sorry, I cannot read this'
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ message: { content: mode === 'bad-then-good' || mode === 'good' || mode === 'bad' ? out : '' } }))
  })
})
const listen = (s: http.Server) => new Promise<number>((r) => s.listen(0, '127.0.0.1', () => r((s.address() as AddressInfo).port)))
const IMG = 'data:image/png;base64,iVBORw0KGgo='
const post = (base: string, p: string, body: unknown, raw = false) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw ? (body as string) : JSON.stringify(body) })

const fp = await listen(fake)
process.env.AI_PROVIDER = 'ollama'; process.env.OLLAMA_URL = `http://127.0.0.1:${fp}`; process.env.OLLAMA_MODEL = 'fake'
const main = createApp({ rateMax: 1000 }); const s1 = http.createServer(main); const base = `http://127.0.0.1:${await listen(s1)}`

// health
let r = await fetch(base + '/api/v1/health'); assert.equal(r.status, 200); assert.equal((await r.json()).provider, 'ollama')
// extract: normalisation of days, times, nulls
r = await post(base, '/api/v1/extract', { image: IMG }); assert.equal(r.status, 200)
const j = await r.json()
assert.deepEqual(j.rows[0], { course: 'cse-2101', section: 'A', day: 'Sat', start: '09:00', end: '10:30', room: 'R101' })
assert.deepEqual([j.rows[1].day, j.rows[1].start, j.rows[1].end, j.rows[1].room], ['Mon', '13:30', '15:00', ''])
assert.deepEqual([j.rows[2].start, j.rows[2].end], ['10:30', '12:00'])
assert.ok(Array.isArray(lastBody.messages[0].images) && lastBody.messages[0].images.length === 1, 'image reaches the model')
// retry once on invalid output
mode = 'bad-then-good'; calls = 0; r = await post(base, '/api/v1/extract', { image: IMG }); assert.equal(r.status, 200); assert.equal(calls, 2)
// two invalid answers -> 422, exactly two model calls, no invented rows
mode = 'bad'; calls = 0; r = await post(base, '/api/v1/extract', { image: IMG }); assert.equal(r.status, 422); assert.equal(calls, 2); assert.ok((await r.json()).error)
// validation and error shapes
mode = 'good'
assert.equal((await post(base, '/api/v1/extract', { image: 'hello' })).status, 400)
assert.equal((await post(base, '/api/v1/extract', { image: 'data:application/pdf;base64,AAAA' })).status, 400)
r = await post(base, '/api/v1/extract', '{not json', true); assert.equal(r.status, 400); assert.ok((await r.json()).error)
assert.equal((await fetch(base + '/api/v1/nope')).status, 404)
// explain
const ex = { language: 'en', label: 'CSE2101 section A', alternative: null, clashes: [{ a: 'CSE2101 A on Sat, 09:00 to 10:30', b: 'MAT1101 A on Sat, 10:00 to 11:00', minutes: 30 }] }
mode = 'bad'; r = await post(base, '/api/v1/explain', ex); assert.equal(r.status, 200); assert.ok((await r.json()).text.length > 0)
assert.equal((await post(base, '/api/v1/explain', { ...ex, clashes: [] })).status, 400)
assert.equal((await post(base, '/api/v1/explain', { ...ex, language: 'fr' })).status, 400)
// Ollama unreachable -> 502 with a readable message
fake.close(); fake.closeAllConnections(); r = await post(base, '/api/v1/extract', { image: IMG }); assert.equal(r.status, 502); assert.match((await r.json()).error, /Ollama/)
// gemini selected without a key -> clear 500, never a fake result
process.env.AI_PROVIDER = 'gemini'; delete process.env.GEMINI_API_KEY
r = await post(base, '/api/v1/extract', { image: IMG }); assert.equal(r.status, 500); assert.match((await r.json()).error, /GEMINI_API_KEY/)
process.env.AI_PROVIDER = 'ollama'
// rate limit
const s2 = http.createServer(createApp({ rateMax: 2 })); const b2 = `http://127.0.0.1:${await listen(s2)}`
assert.equal((await post(b2, '/api/v1/explain', { bad: 1 })).status, 400); assert.equal((await post(b2, '/api/v1/explain', { bad: 1 })).status, 400)
r = await post(b2, '/api/v1/explain', { bad: 1 }); assert.equal(r.status, 429); assert.ok(r.headers.get('retry-after'))
assert.equal((await fetch(b2 + '/api/v1/health')).status, 200, 'health is not limited')
// static frontend + security headers
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sem-')); fs.writeFileSync(path.join(dir, 'index.html'), '<h1>Semestra</h1>')
const s3 = http.createServer(createApp({ staticDir: dir })); const b3 = `http://127.0.0.1:${await listen(s3)}`
r = await fetch(b3 + '/'); assert.equal(r.status, 200); assert.match(await r.text(), /Semestra/); assert.equal(r.headers.get('x-content-type-options'), 'nosniff'); assert.equal(r.headers.get('x-powered-by'), null)
for (const s of [s1, s2, s3]) { s.close(); s.closeAllConnections() }
console.log('server tests passed')
process.exit(0)
