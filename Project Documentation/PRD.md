# PRD: Semestra
**Purpose:** help IIUC retake students find clash-free section combinations across several routine files.
**User:** a retake student who must compare routine PDFs/images (English and Bangla, split by gender and semester) by hand. Unverified: how widespread or painful this is; whether the student portal already shows a personal timetable.
**Main journey:** profile with retake codes, upload routines, Gemma extracts rows, student reviews and fixes, solver ranks combinations, student picks one and sees the week (optionally exports .ics).
**Must have (shipped):** profile, upload, Gemma extraction with review and manual rows, deterministic solver with ranking and clash details, weekly timetable, browser persistence, graceful errors.
**Optional (shipped):** Gemma clash explanation (EN/BN), .ics export.
**Not built:** accounts, exam schedules, reminders, billing, shared database, photo capture.
**AI role:** Gemma 4 reads table images into validated JSON (Zod, one retry) and rewords clash lists. It never computes clashes.
**Personalization:** retake courses, routine group and the student's own confirmed rows drive the solver; the selected option is remembered.
**Risks:** extraction accuracy (mitigated by mandatory review), hosted quota/availability, public unauthenticated AI endpoints (rate limit only).
