# Memory (Semestra)
Purpose: help IIUC retakers find clash-free section combinations across routine files.
## Status: Phase 2 done (extraction)
Working: profile + retake chips, file upload/preview (images; PDFs open in new tab), editable row table, weekly timetable (Sat to Thu, 08:00 to 18:00), localStorage persistence under `semestra.v1`, sample data (made-up, labeled).
Stack: React 18, TS, Vite 5, Tailwind 3, lucide-react. No backend yet.
Files: `src/App.tsx` (page), `src/components/{RowTable,Timetable}.tsx`, `src/types.ts` (types, `rowOk`, `isRetake`), `src/sample.ts`.
Run: `npm install`, `npm run dev` (http://127.0.0.1:5173), `npm run build`.
Assumptions to verify: IIUC week days (Sat to Thu used), time range of routines.
## Phase 2 added
Backend `server/index.ts` + `server/extract.ts`: `GET /api/v1/health`, `POST /api/v1/extract` ({image: data URL} to {rows, provider, model}). Zod validation, one retry, errors 400/422/502. Providers by `AI_PROVIDER` (ollama `/api/chat`, gemini `generateContent` with `x-goog-api-key`); no JSON-mode flag sent (unverified for Gemma). Times: 12h or 24h; no AM/PM and hour 1 to 6 is read as PM. Client `src/lib/extract.ts`: images downscaled to 1600px, PDFs rasterized with pdfjs-dist 4.10.38 (first 3 pages), one request per page. Review box in `App.tsx`: rows editable before they join classes.
Run: `npm run dev:all` (web 5173, api 4000; Vite proxies /api). Tested: build; endpoint against a FAKE Ollama (retry, 400, 422, 502). NOT tested: real Ollama/Gemma output, hosted Gemini call, PDF rasterizing, UI in a browser.
## Next: Phase 3
Pure TS solver (`src/lib/solver.ts`): all section combinations per retake course vs regular classes and each other; overlap = same day and start < other end and end > other start; rank clash-free first; results panel; selecting an option updates the timetable.
## Known limits
No rate limiting on the API. Extraction accuracy on real routines unknown.
