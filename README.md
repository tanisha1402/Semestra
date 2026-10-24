# Semestra

Clash-free class planning for IIUC retake students. Retakers pick their own sections, and their timetable spans several routine files. Semestra puts them on one weekly view and (from phase 3) finds section combinations without clashes.

**Status: phase 2 of 5.** Working: profile and retake courses, file upload, Gemma extraction with a review step, editable class rows, weekly timetable, browser storage. Not built yet: clash solver (phase 3), integration and explanations (phase 4).

## Run on Windows
Prerequisite: Node.js 18 or newer. In PowerShell, inside this folder:
```
npm install
copy .env.example .env
npm run dev:all
```
Open http://127.0.0.1:5173 (API on http://127.0.0.1:4000). Build check: `npm run build`.

**Local model (default):** install Ollama, then `ollama pull gemma4:e2b`. Keep `AI_PROVIDER=ollama` in `.env`.
**Hosted Gemma:** set `AI_PROVIDER=gemini`, `GEMINI_API_KEY` (server only) and `GEMMA_MODEL` in `.env`.

## Notes
- Sample data is made up, not a real IIUC routine.
- Data is stored in your browser only (localStorage).
- Open-weight model: Gemma 4 (local Ollama `gemma4:e2b`, hosted Gemma via the Gemini API). Wired in phase 2.
- License: MIT.
