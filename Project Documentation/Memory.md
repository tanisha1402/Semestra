# Memory (Semestra)
Purpose: help IIUC retakers find clash-free section combinations across routine files.
## Status: Phase 5 done (release candidate). Not yet deployed or tested with real Gemma.
Stack: React 18, TS, Vite 5, Tailwind 3, lucide-react; Express 5 + Zod 4; pdfjs-dist (lazy loaded). Persistence: localStorage `semestra.v1`.
## Files
`src/App.tsx` page and state. `src/components/{RowTable,Timetable,Results,Explain}.tsx`. `src/lib/{solver,ics,extract}.ts`, `src/types.ts`, `src/sample.ts` (made-up data).
`server/app.ts` routes, CORS, JSON errors, static `dist/`. `server/extract.ts` prompt, Zod, providers (ollama, gemini), retry, explain. `server/rateLimit.ts` per-IP, in memory. `server/index.ts` listen (0.0.0.0 in production, else 127.0.0.1).
## Endpoints
`GET /api/v1/health` (provider, model, configured). `POST /api/v1/extract` {image data URL} to {rows, provider, model}; 400/422/502/429. `POST /api/v1/explain` {language, label, alternative, clashes} to {text}. Rate limit `RATE_LIMIT_MAX` (60 per IP per 10 min) on the two AI routes.
## Commands
Dev: `npm run dev:all` (web 5173, api 4000, Vite proxies /api). Checks: `npm test` (solver, ics, server) and `npm run build`. Production: `npm install --include=dev && npm run build`, then `NODE_ENV=production npm start` (one service serves API and page). `render.yaml` is an unverified Render blueprint.
## Verified in Phase 5 (sandbox)
Fresh install, `npm run build`, `npm test` all pass. Server tests (real Express, FAKE Ollama): day/time normalisation, image reaches the model, retry once, 422 after two bad answers, 400 on bad input and bad JSON, 404, 502 when Ollama is down, missing Gemini key gives clear 500, rate limit 429 with Retry-After, static serving, security headers. `npm start` in production mode: page, assets and health served; no CORS header for foreign origins.
## NOT verified (do these before 12:15)
1. Real Gemma extraction on a real IIUC routine (local `gemma4:e2b` and hosted). Unknown: whether e2b accepts images, Bangla quality, time-format edge cases.
2. Hosted Gemini call (`generateContent` with `inline_data`) and quota. Gemini request code has never hit the real API.
3. Browser UI (clicks, responsive layout, keyboard use), PDF rasterizing, .ics import into a calendar app.
4. Live deployment, HTTPS URL, fresh-browser check. Devpost, repo URL.
## Release checklist
[ ] `.env` with real key stays local; set secrets in the host. [ ] Deploy; open `/api/v1/health`, expect `configured: true`. [ ] Upload one real routine image on the live URL; review rows; see ranked options. [ ] Fill README live URL and repo URL. [ ] First commit and history inside the build window (author's responsibility). [ ] Devpost.
## Known limits
localStorage only. Solver ignores regular-vs-regular clashes and does not use profile semester/section/group. Rate limiter resets on restart. Public AI endpoints with no auth. `.ics` repeats 16 weeks. Sat to Thu week assumed. Hosted free-tier limits unknown. Large bundles: pdf worker 1.4 MB (loaded only for PDFs).
## Failed or avoided
No JSON-mode flag for hosted Gemma (unverified); Zod plus retry instead. Never fabricate rows when the model fails; the user types rows by hand.
## Defense notes
Why not a chatbot: Gemma does perception (image to rows) and wording; correctness-critical clashes come from tested deterministic code on rows the student confirmed. Data flow: browser downsizes image, server calls the model, server validates with Zod, browser shows rows for review, solver runs in the browser, state stays in localStorage. Security: key server-side only, input size/type validated, per-IP limit, no CORS in production, model output treated as data. Trade-offs: no accounts, in-memory limiter, no semester dates, review step is mandatory because extraction can be wrong. With more time: regular-vs-regular clashes, exam routine, shared routines, persistent rate limiting, real user testing.
