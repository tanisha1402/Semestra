// Reads IIUC's one-file-per-gender routine PDF from its TEXT LAYER (no model, no guessing).
// Layout it relies on: one page per day, one column per semester+section (header like "3AF"), rows are
// 50-minute slots labelled "08:20 AM" ..., and each class is a merged cell whose rectangle gives its exact length.
import { DAYS, uid } from '../types'
import type { ClassRow, Day, Profile } from '../types'

export interface TextBit { s: string; x: number; y: number; w: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface PageData { items: TextBit[]; rects: Rect[] }
export interface Cell { day: Day; column: string; course: string; teacher: string; room: string; start: string; end: string }

const DAY_NAMES: Record<string, Day> = { saturday: 'Sat', sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu' }
const CODE = /^[A-Z]{2,5}-\d{4}(\(\d+\))?$/
const COLUMN = /^\d[A-Z][A-Z]$/
const TIME = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
const ROOM_START = /^(F_|FLAB|PLAB|RCX|R\d)/
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** "cse 2421", "CSE2421", "cse-2421" all become "CSE-2421". Anything else is only trimmed and upper-cased. */
export const normCode = (s: string) => { const t = s.toUpperCase().replace(/\s+/g, ''); const m = t.match(/^([A-Z]+)-?(\d{3,4})$/); return m ? `${m[1]}-${m[2]}` : t }

/** Turn one PDF page into raw text bits and cell-sized rectangles. `pdfjs` is the pdf.js module (browser or Node). */
export async function pageData(pdfjs: any, page: any): Promise<PageData> {
  const tc = await page.getTextContent()
  const items: TextBit[] = tc.items.filter((i: any) => i.str && i.str.trim()).map((i: any) => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width }))
  const ol = await page.getOperatorList(); const O = pdfjs.OPS; const seen = new Set<string>(); const rects: Rect[] = []
  ol.fnArray.forEach((fn: number, n: number) => {
    if (fn !== O.constructPath) return
    const [ops, coords] = ol.argsArray[n] as [number[], number[]]; let p = 0
    for (const op of ops) {
      if (op === O.rectangle) {
        const r = { x: coords[p], y: coords[p + 1], w: coords[p + 2], h: coords[p + 3] }; p += 4
        const k = [r.x, r.y, r.w, r.h].map((v) => Math.round(v)).join(',')
        if (r.w > 50 && r.w < 80 && r.h > 40 && !seen.has(k)) { seen.add(k); rects.push(r) } // class cells are about 63 wide and at least one 53-tall slot
      } else if (op === O.moveTo || op === O.lineTo) p += 2
      else if (op === O.curveTo) p += 6
      else p += 4 // curveTo2 / curveTo3
    }
  })
  return { items, rects }
}

const lines = (bits: TextBit[]) => {
  const out: { y: number; text: string }[] = []
  for (const b of [...bits].sort((a, c) => c.y - a.y || a.x - c.x)) { const l = out.find((o) => Math.abs(o.y - b.y) < 2); if (l) l.text += ' ' + b.s; else out.push({ y: b.y, text: b.s }) }
  return out
}

/** Read every class on one page (one day). Returns the cells plus how many course codes could not be placed in a cell. */
export function parsePage(d: PageData): { day: Day | null; cells: Cell[]; unplaced: number } {
  const dayBit = d.items.filter((i) => DAY_NAMES[i.s.toLowerCase()]).sort((a, b) => b.y - a.y)[0]
  const day = dayBit ? DAY_NAMES[dayBit.s.toLowerCase()] : null
  const heads = d.items.filter((i) => COLUMN.test(i.s)).map((i) => ({ label: i.s, cx: i.x + i.w / 2 }))
  const slots = d.items.map((i) => ({ m: i.s.match(TIME), y: i.y })).filter((t) => t.m).map((t) => { let h = Number(t.m![1]) % 12; if (t.m![3].toUpperCase() === 'PM') h += 12; return { start: h * 60 + Number(t.m![2]), y: t.y } }).sort((a, b) => b.y - a.y)
  if (!day || heads.length === 0 || slots.length < 2 || d.rects.length === 0) return { day, cells: [], unplaced: 0 }
  const H = (slots[0].y - slots[slots.length - 1].y) / (slots.length - 1) // slot height in points
  const mins = (slots[slots.length - 1].start - slots[0].start) / (slots.length - 1) // slot length in minutes
  const cells: Cell[] = []; let unplaced = 0
  for (const rect of d.rects) {
    const inside = d.items.filter((i) => { const cx = i.x + i.w / 2; return cx >= rect.x && cx <= rect.x + rect.w && i.y >= rect.y && i.y <= rect.y + rect.h })
    const ls = lines(inside); if (!ls.some((l) => CODE.test(l.text))) continue
    const col = heads.reduce((b, h) => (Math.abs(h.cx - (rect.x + rect.w / 2)) < Math.abs(b.cx - (rect.x + rect.w / 2)) ? h : b)).label
    const k = Math.max(0, Math.round((slots[0].y + H / 2 + 3.5 - (rect.y + rect.h)) / H)), n = Math.max(1, Math.round(rect.h / H))
    const start = slots[0].start + k * mins
    // A cell is: code line, teacher line(s), room line(s). Room lines may wrap ("FLAB6_RCX10" then "1"), so they are joined.
    let cur: { code: string; rest: string[] } | null = null; const groups: { code: string; rest: string[] }[] = []
    for (const l of ls) { if (CODE.test(l.text)) { cur = { code: l.text, rest: [] }; groups.push(cur) } else cur?.rest.push(l.text) }
    for (const g of groups) {
      const r0 = g.rest.findIndex((t) => ROOM_START.test(t))
      const teacher = (r0 < 0 ? g.rest : g.rest.slice(0, r0)).join(' '), room = r0 < 0 ? '' : g.rest.slice(r0).join('')
      cells.push({ day, column: col, course: g.code.replace(/\(\d+\)$/, ''), teacher, room, start: hhmm(start), end: hhmm(start + n * mins) })
    }
  }
  const codes = d.items.filter((i) => CODE.test(i.s)).length
  unplaced = Math.max(0, codes - cells.length)
  return { day, cells, unplaced }
}

export interface Pick { rows: ClassRow[]; column: string | null; columns: string[]; missing: string[]; own: number; retake: number }
/** Choose the student's own column plus every class of their retake courses (any column = a section choice). */
export function pickRows(cells: Cell[], p: Profile): Pick {
  const columns = [...new Set(cells.map((c) => c.column))].sort()
  const want = `${p.semester}${p.section.trim().toUpperCase()}`
  const letter = p.gender === 'female' ? 'F' : 'M'
  const column = columns.includes(want + letter) ? want + letter : columns.find((c) => c.startsWith(want) && p.section.trim()) ?? null
  const retakes = p.retakes.map(normCode)
  const mine = cells.filter((c) => c.column === column), re = cells.filter((c) => retakes.includes(c.course))
  const all = [...new Map([...mine, ...re].map((c) => [`${c.course}|${c.column}|${c.day}|${c.start}`, c])).values()]
  const rows: ClassRow[] = all.map((c) => ({ id: uid(), course: c.course, section: c.column, day: c.day, start: c.start, end: c.end, room: c.room, teacher: c.teacher }))
  rows.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start))
  return { rows, column, columns, missing: retakes.filter((r) => !cells.some((c) => c.course === r)), own: mine.length, retake: re.length }
}
