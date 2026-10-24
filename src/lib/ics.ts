import { rowOk } from '../types'
import type { ClassRow } from '../types'
const BY: Record<string, [string, number]> = { Sun: ['SU', 0], Mon: ['MO', 1], Tue: ['TU', 2], Wed: ['WE', 3], Thu: ['TH', 4], Sat: ['SA', 6] }
export const WEEKS = 16
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => '\\' + c)
const d2 = (n: number) => String(n).padStart(2, '0')
/** Weekly repeating events in floating local time, starting at the next matching weekday. Semester dates are unknown, hence a fixed WEEKS count. */
export function makeIcs(rows: ClassRow[], from = new Date()): string {
  const stamp = `${from.getUTCFullYear()}${d2(from.getUTCMonth() + 1)}${d2(from.getUTCDate())}T${d2(from.getUTCHours())}${d2(from.getUTCMinutes())}00Z`
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Semestra//EN', 'CALSCALE:GREGORIAN']
  for (const r of rows.filter(rowOk)) {
    const [code, dow] = BY[r.day]; const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7))
    const date = `${d.getFullYear()}${d2(d.getMonth() + 1)}${d2(d.getDate())}`, t = (s: string) => s.replace(':', '') + '00'
    L.push('BEGIN:VEVENT', `UID:${r.id}-${date}@semestra`, `DTSTAMP:${stamp}`, `DTSTART:${date}T${t(r.start)}`, `DTEND:${date}T${t(r.end)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${WEEKS};BYDAY=${code}`, `SUMMARY:${esc(`${r.course} ${r.section}`.trim())}`, ...(r.room ? [`LOCATION:${esc('Room ' + r.room)}`] : []), 'END:VEVENT')
  }
  L.push('END:VCALENDAR'); return L.join('\r\n') + '\r\n'
}
export function downloadIcs(rows: ClassRow[]) {
  const url = URL.createObjectURL(new Blob([makeIcs(rows)], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = 'semestra-timetable.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
