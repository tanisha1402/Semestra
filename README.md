# Semestra

**A retaker picks sections; Semestra finds the clash-free combinations.**

- **Live app:** <[YOUR-VERCEL-URL](https://semestra-eta.vercel.app/)>
- **Repository:** https://github.com/tanisha1402/Semestra
- Built for Hacktoberfest Hack Day Chittagong 2026.

## Overview
IIUC retake students choose their own sections for failed courses, and the timetable they must respect is spread over several routine files (their own semester plus the lower semesters where the retake runs), published as PDFs or images in English and Bangla. Semestra puts those files on one weekly view and checks every section combination for clashes. A student enters a profile and retake course codes, uploads the routine PDF, reviews the extracted classes, and gets ranked clash-free options, a weekly timetable, an optional plain-language explanation of clashes (English or Bangla) and a `.ics` calendar export. The problem is based on the author's understanding of how retakes work at IIUC; no user interviews or statistics are claimed.

## How it works
IIUC publishes one routine PDF per gender: every semester and section is a column (`3AF` = semester 3, section A, female), one page per day.
1. **Profile:** semester, section, routine group, retake course codes (`cse 2421` is normalised to `CSE-2421`).
2. **Upload** that PDF and press **Import my classes**. Semestra reads the PDF's text layer and cell borders in the browser, then picks your own column plus every section of each retake course. No model is needed for this step.
3. **You review:** every row is editable, and nothing joins your classes until you confirm. Rows can also be typed by hand.
4. **Solver:** plain TypeScript (`src/lib/solver.ts`) tries every one-section-per-course combination, counts overlaps with your regular classes and between retake courses, and ranks clash-free options first.
5. **Result:** ranked options (with teachers), a weekly timetable, optional Gemma explanation of clashes, and a `.ics` export.
6. **Photos and scans:** if the routine is an image or a scanned PDF, **Read with Gemma** extracts rows (validated with Zod, one retry), followed by the same review step.

**Division of labour:** the PDF parser and the solver are deterministic, tested code. Gemma reads images/scans and rewords clash lists; it never decides clashes. Results are advice, not an academic decision; confirm sections with your department.

## Setup and run

### Locally (Windows, PowerShell)
Prerequisite: Node.js 18.18 or newer. Inside the project folder:
```
npm install
copy .env.example .env
npm run dev:all
```
Open http://127.0.0.1:5173 (API on http://127.0.0.1:4000). For the local model, install [Ollama](https://ollama.com) and run `ollama pull gemma4:e2b`. To use hosted Gemma instead, set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` in `.env`.
Checks: `npm test` and `npm run build`.

### Deployed setup (what the live app uses)
- **API on Render** (`render.yaml` is a blueprint): build `npm install --include=dev && npm run build`, start `npm start`. Environment: `NODE_ENV=production`, `AI_PROVIDER=gemini`, `GEMMA_MODEL`, `GEMINI_API_KEY` (secret, set in the Render dashboard) and `ALLOWED_ORIGIN` (the frontend's URL, so the browser may call the API). Open `/api/v1/health`; it should show `"configured": true`.
- **Frontend on Vercel** (`vercel.json`): build `npm run build`, output `dist`. Set `VITE_API_URL` to the Render service URL (no trailing slash). It is baked in at build time, so redeploy after changing it.
- Render alone also works: the Express server serves `dist/` and the API from one origin, with no `VITE_API_URL` or `ALLOWED_ORIGIN` needed.
- Do not point a public deployment at a local Ollama. The API key lives only in server environment variables, never in the code or the browser.

## Technology stack
- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS 3, lucide-react, pdf.js (`pdfjs-dist`, loaded only for PDFs)
- **Backend:** Node.js, Express 5, Zod 4, tsx
- **Models:** Gemma 4 (see below)
- **Hosting:** Render (API), Vercel (frontend)
- **Storage:** browser localStorage only; no database or accounts

```
src/            React app (App.tsx, components/, lib/routine.ts PDF parser, lib/solver.ts, lib/ics.ts, lib/extract.ts)
server/         Express API (app.ts routes, extract.ts model calls + Zod, rateLimit.ts, index.ts)
Project Documentation/   PRD.md, Memory.md
```
API: `GET /api/v1/health`, `POST /api/v1/extract` (image data URL to rows), `POST /api/v1/explain` (clash list to text). Per-IP rate limit on the two AI endpoints.

## Templates and starter kits
No template or starter kit was used. [AUTHOR: confirm. If you began from one, e.g. a Vite React-TS template, name it here.] The libraries above are used as dependencies under their own licences. The only third-party data is the sample routine PDF in `test-data/` (see Attribution).

## Model and AI disclosure
**Model in the product (open-weight):** Gemma 4.
- Local development: `gemma4:e2b` through Ollama.
- Production: `gemma-4-26b-a4b-it` (Gemma 4 26B A4B) through the Google AI Studio (Gemini) API.
- Used for two things only: reading routine photos/scans into rows, and rewording clash lists in English or Bangla. It never decides clashes, and model output is validated and treated as data.

**AI used to build the project:** written with the help of Claude (Anthropic) as an AI coding assistant, including Claude Sonnet 5.5 for the deployment changes. [AUTHOR: list any other AI tools or models you used, matching what you ticked on the submission form.] All code was reviewed and run by the author.

## Known limitations
- Data is stored in your browser only (localStorage). No accounts, nothing shared between devices.
- PDF import depends on IIUC's current layout (column headers like `3AF`, one page per day, 50-minute slots). Only the CSE female Autumn 2026 file has been tested; the male file and other departments are untested.
- Gemma extraction from photos depends on image quality and the model; always review. 
- The solver ignores regular-vs-regular clashes and does not use the profile's semester/section/group (they are for your reference).
- No exam schedules. `.ics` events repeat weekly for 16 weeks because semester dates are unknown.
- No auth, so the AI endpoints are public with a basic in-memory rate limit that resets on restart.
- The free Render plan sleeps when idle, so the first request can take about a minute. Hosted Gemma free-tier quota applies.

## Attribution
The tested sample in `test-data/` is the CSE Department's public Autumn 2026 female class routine from IIUC, included only as a test fixture. React, Vite, Tailwind CSS, Lucide icons, Express, Zod, pdf.js and tsx are used under their own open-source licences. Sample timetable data in `src/sample.ts` is made up.

## License
MIT. See `LICENSE`.