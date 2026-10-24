# Semestra

**A retaker picks sections; Semestra finds the clash-free combinations.**

IIUC retake students choose their own sections for failed courses. The timetable they must respect is spread over several routine files (their own semester plus the lower semesters where the retake runs), published as PDFs or images in English and Bangla. Semestra puts those files on one weekly view and checks every section combination for clashes.

- **Live app:** _add the HTTPS URL before submitting_
- **Repository:** _add the public Git URL before submitting_
- Built for Hacktoberfest Hack Day Chittagong 2026. The problem is based on the author's understanding of how retakes work at IIUC; no user interviews or statistics are claimed.

## How it works
1. **Profile:** semester, section, routine group, retake course codes.
2. **Upload:** photos or PDFs of each routine (PDFs are rasterized in the browser, first 3 pages).
3. **Gemma reads the table** and returns rows (course, section, day, start, end, room). The server validates them with Zod and retries once if the output is invalid.
4. **You review:** every row is editable before it joins your classes. Nothing reaches the solver unconfirmed. Rows can also be typed by hand.
5. **Solver:** plain TypeScript (`src/lib/solver.ts`) tries every one-section-per-course combination, counts overlaps with regular classes and between retake courses, and ranks clash-free options first.
6. **Result:** ranked options, a weekly timetable, optional Gemma explanation of clashes (English or Bangla), and a `.ics` calendar export.

**Division of labour:** Gemma extracts structure from messy images and rewords clash lists. It never decides clashes. The solver is deterministic code, covered by unit tests. Results are advice, not an academic decision; confirm sections with your department.

## Open-weight model
Gemma 4. Local development uses Ollama (`gemma4:e2b`). Production uses hosted Gemma through the Google AI Studio (Gemini) API; the default ID is `gemma-4-26b-a4b-it`. The API key lives only in server environment variables.

## Run on Windows
Prerequisite: Node.js 18.18 or newer. In PowerShell, inside this folder:
```
npm install
copy .env.example .env
npm run dev:all
```
Open http://127.0.0.1:5173 (API on http://127.0.0.1:4000). For the local model, install Ollama and run `ollama pull gemma4:e2b`. Checks: `npm test` and `npm run build`.

## Deploy (one service: API + built frontend)
The Express server serves `dist/` and `/api/v1/*` from the same origin, so no CORS or API URL setup is needed.
- Build command: `npm install --include=dev && npm run build` (the build needs dev dependencies)
- Start command: `npm start`
- Environment: `NODE_ENV=production`, `AI_PROVIDER=gemini`, `GEMINI_API_KEY` (secret), `GEMMA_MODEL`. See `.env.example`. `render.yaml` is a ready blueprint for Render.
- After deploy open `/api/v1/health`; it should show `"configured": true`.
- Do not point a public deployment at a local Ollama.

## Structure
```
src/            React app (App.tsx, components/, lib/solver.ts, lib/ics.ts, lib/extract.ts)
server/         Express API (app.ts routes, extract.ts model calls + Zod, rateLimit.ts, index.ts)
Project Documentation/   PRD.md, Memory.md
```
API: `GET /api/v1/health`, `POST /api/v1/extract` (image data URL to rows), `POST /api/v1/explain` (clash list to text). Per-IP rate limit on the two AI endpoints.

## Known limitations
- Data is stored in your browser only (localStorage). No accounts, nothing shared between devices.
- Extraction quality depends on the image and model; always review. Bangla and low-resolution tables are the hardest.
- The solver ignores regular-vs-regular clashes and does not use the profile's semester/section/group (they are for your reference).
- No exam schedules. `.ics` events repeat weekly for 16 weeks because semester dates are unknown.
- No auth, so the AI endpoints are public with a basic rate limit. The rate limiter is in memory and resets on restart.
- Hosted Gemma free-tier quota and image-input behavior should be checked in Google AI Studio before relying on them.

## AI assistance disclosure
Written with the help of Claude (Anthropic) as an AI coding assistant, and reviewed and run by the author. At runtime the app uses Gemma 4 only.

## Attribution
React, Vite, Tailwind CSS, Lucide icons, Express, Zod, pdf.js (pdfjs-dist), tsx. All under their own open-source licenses. Sample timetable data is made up.

## License
MIT. See `LICENSE`.
