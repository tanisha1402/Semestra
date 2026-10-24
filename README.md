# Semestra

**A retaker picks sections; Semestra finds the clash-free combinations.**

IIUC retake students choose their own sections for failed courses. The timetable they must respect is spread over several routine files (their own semester plus the lower semesters where the retake runs), published as PDFs or images in English and Bangla. Semestra puts those files on one weekly view and checks every section combination for clashes.

- **Live app:** _add the HTTPS URL before submitting_
- **Repository:** _add the public Git URL before submitting_
- Built for Hacktoberfest Hack Day Chittagong 2026. The problem is based on the author's understanding of how retakes work at IIUC; no user interviews or statistics are claimed.

## How it works
IIUC publishes one routine PDF per gender: every semester and section is a column (`3AF` = semester 3, section A, female), one page per day.
1. **Profile:** semester, section, routine group, retake course codes (`cse 2421` is normalised to `CSE-2421`).
2. **Upload** that one PDF and press **Import my classes**. Semestra reads the PDF's text layer and cell borders, then picks your own column plus every section of each retake course. No manual typing, no model needed for this step. Each row has course, section (= the column, e.g. `4AF`), day, exact start and end, room and teacher.
3. **You review:** every row is editable, and nothing joins your classes until you confirm. Rows can also be typed by hand.
4. **Solver:** plain TypeScript (`src/lib/solver.ts`) tries every one-section-per-course combination, counts overlaps with your regular classes and between retake courses, and ranks clash-free options first.
5. **Result:** ranked options (with teachers), a weekly timetable, optional Gemma explanation of clashes (English or Bangla), and a `.ics` calendar export.
6. **Photos and scans:** if the routine is an image or a scanned PDF, **Read with Gemma** extracts rows from it (validated with Zod, one retry), followed by the same review step.

**Division of labour:** the PDF parser and the solver are deterministic, tested code. Gemma reads images/scans and rewords clash lists; it never decides clashes. Results are advice, not an academic decision; confirm sections with your department.

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
src/            React app (App.tsx, components/, lib/routine.ts PDF parser, lib/solver.ts, lib/ics.ts, lib/extract.ts)
server/         Express API (app.ts routes, extract.ts model calls + Zod, rateLimit.ts, index.ts)
Project Documentation/   PRD.md, Memory.md
```
API: `GET /api/v1/health`, `POST /api/v1/extract` (image data URL to rows), `POST /api/v1/explain` (clash list to text). Per-IP rate limit on the two AI endpoints.

## Known limitations
- Data is stored in your browser only (localStorage). No accounts, nothing shared between devices.
- PDF import depends on IIUC's current layout (column headers like `3AF`, one page per day, 50-minute slots). Only the CSE female Autumn 2026 file has been tested; the male file and other departments are untested. Gemma extraction from photos depends on image quality and the model; always review.
- The solver ignores regular-vs-regular clashes and does not use the profile's semester/section/group (they are for your reference).
- No exam schedules. `.ics` events repeat weekly for 16 weeks because semester dates are unknown.
- No auth, so the AI endpoints are public with a basic rate limit. The rate limiter is in memory and resets on restart.
- Hosted Gemma free-tier quota and image-input behavior should be checked in Google AI Studio before relying on them.

## AI assistance disclosure
Written with the help of Claude (Anthropic) as an AI coding assistant, and reviewed and run by the author. At runtime the app uses Gemma 4 only.

## Attribution
The tested sample in `test-data/` is the CSE Department's public Autumn 2026 female class routine from IIUC, included only as a test fixture.
React, Vite, Tailwind CSS, Lucide icons, Express, Zod, pdf.js (pdfjs-dist), tsx. All under their own open-source licenses. Sample timetable data is made up.

## License
MIT. See `LICENSE`.
