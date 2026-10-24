# Memory (Semestra)
Purpose: help IIUC retakers find clash-free section combinations across routine files.
## Status: Phase 4 done (integration)
Working: profile + retake chips, file upload/preview (images; PDFs open in new tab), editable row table, weekly timetable (Sat to Thu, 08:00 to 18:00), localStorage persistence under `semestra.v1`, sample data (made-up, labeled).
Stack: React 18, TS, Vite 5, Tailwind 3, lucide-react. No backend yet.
Files: `src/App.tsx` (page), `src/components/{RowTable,Timetable}.tsx`, `src/types.ts` (types, `rowOk`, `isRetake`), `src/sample.ts`.
Run: `npm install`, `npm run dev` (http://127.0.0.1:5173), `npm run build`.
Assumptions to verify: IIUC week days (Sat to Thu used), time range of routines.
## Phase 2 added
Backend `server/index.ts` + `server/extract.ts`: `GET /api/v1/health`, `POST /api/v1/extract` ({image: data URL} to {rows, provider, model}). Zod validation, one retry, errors 400/422/502. Providers by `AI_PROVIDER` (ollama `/api/chat`, gemini `generateContent` with `x-goog-api-key`); no JSON-mode flag sent (unverified for Gemma). Times: 12h or 24h; no AM/PM and hour 1 to 6 is read as PM. Client `src/lib/extract.ts`: images downscaled to 1600px, PDFs rasterized with pdfjs-dist 4.10.38 (first 3 pages), one request per page. Review box in `App.tsx`: rows editable before they join classes.
Run: `npm run dev:all` (web 5173, api 4000; Vite proxies /api). Tested: build; endpoint against a FAKE Ollama (retry, 400, 422, 502). NOT tested: real Ollama/Gemma output, hosted Gemini call, PDF rasterizing, UI in a browser.
## Phase 3 added
`src/lib/solver.ts`: pure `solve(rows, profile)`. Regular = rows not matching a retake code. Per retake course, sections are grouped by course+section; every one-section-per-course combination is checked (cap 5000, else `truncated`). Clash = same day and real overlap (touching times are not clashes), regular vs retake and retake vs retake (different courses). Rank: fewer clashes, fewer overlap minutes, fewer days. Invalid-time rows ignored and counted. Tests: `npm test` (`src/lib/solver.test.ts`). UI: `components/Results.tsx` (ranked list, details for the selected option, "show every section"); the timetable shows regular classes plus the selected option (best by default) with red outlines on clashes.
## Phase 4 added
Selected option persisted in `semestra.v1` (`pick`). `src/lib/ics.ts`: weekly RRULE events, floating local time, 16 weeks from next matching weekday (semester dates unknown); `downloadIcs`. `POST /api/v1/explain` + `components/Explain.tsx`: Gemma rewords the solver's clash list in English or Bangla (text only, no JSON mode); labelled as written by Gemma; solver text stays the source of truth; failure shows an error and keeps the details. Skip link, `<main>`, aria-live on the result summary. `npm test` runs solver and ics tests.
Tested: unit tests, build, `/explain` and `/extract` against a FAKE Ollama (200, 400, 502). NOT tested: real Gemma output (extraction or explanation, incl. Bangla quality), browser UI, .ics import into a real calendar app, keyboard navigation.
## Next: Phase 5
Full end-to-end run with a real routine image, fix bugs, README/license/.env.example check, hosted Gemma config and deployment (frontend + API must be deployed together; the Vite proxy is dev-only), Devpost, defense notes.
## Known limits
No rate limiting. Solver ignores regular-vs-regular clashes. Production needs the API URL wired (not done yet).
