// Runs the real parser on the real IIUC CSE female Autumn 2026 routine PDF (test-data/). Expected values were checked by eye against the PDF pages.
import assert from 'node:assert/strict'
import fs from 'node:fs'
// @ts-ignore - Node-only build of pdf.js, used just by this test
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { normCode, pageData, parsePage, pickRows } from './routine'
import type { Cell } from './routine'
import { solve } from './solver'
import type { Profile } from '../types'

const file = new URL('../../test-data/IIUC_CSE_Female_Autumn_2026_routine.pdf', import.meta.url)
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0, useSystemFonts: true }).promise
const cells: Cell[] = []; const days: string[] = []; let unplaced = 0
for (let i = 1; i <= doc.numPages; i++) { const r = parsePage(await pageData(pdfjs, await doc.getPage(i))); cells.push(...r.cells); days.push(r.day ?? '?'); unplaced += r.unplaced }
assert.deepEqual(days, ['Sat', 'Sun', 'Mon', 'Tue', 'Wed']); assert.equal(unplaced, 0, 'every course code sits in a cell')
assert.equal(cells.length, 361); assert.equal(new Set(cells.map((c) => c.column)).size, 23)
assert.ok(cells.every((c) => c.room && c.teacher && c.start < c.end), 'every class has a room, teacher and a valid time')
const one = (day: string, column: string, course: string, start: string) => cells.find((c) => c.day === day && c.column === column && c.course === course && c.start === start)
// merged cells: 2 slots, 1 slot, 3-slot lab, wrapped room name
assert.deepEqual(one('Sat', '3AF', 'MATH-2307', '10:00'), { day: 'Sat', column: '3AF', course: 'MATH-2307', teacher: 'MAI', room: 'RCX404', start: '10:00', end: '11:40' })
assert.equal(one('Sat', '3AF', 'CHEM-2301', '08:20')?.end, '09:10')
assert.deepEqual([one('Sat', '2AF', 'PHY-1204', '10:50')?.end, one('Sat', '2AF', 'PHY-1204', '10:50')?.room], ['13:20', 'F_PHY_MP_LAB_R405'])
assert.equal(one('Mon', '2AF', 'EEE-1222', '08:20')?.room, 'F_ELECTROLAB_R506')
// the course CSE-2421 runs as two sections (columns 4AF and 4BF) with 4 meetings in total
assert.deepEqual(cells.filter((c) => c.course === 'CSE-2421').map((c) => `${c.column} ${c.day} ${c.start}-${c.end} ${c.teacher} ${c.room}`).sort(),
  ['4AF Sat 08:20-09:10 AJ R603', '4AF Wed 10:00-11:40 AJ R606', '4BF Mon 10:00-10:50 TA RCX403', '4BF Sat 08:20-10:00 TA R604'])
// normalising codes
assert.equal(normCode(' cse 2421 '), 'CSE-2421'); assert.equal(normCode('cse2421'), 'CSE-2421'); assert.equal(normCode('CSE-2421'), 'CSE-2421')
// pick: own column + retake sections; solver on top
const me: Profile = { semester: 3, section: 'a', gender: 'female', retakes: ['cse 2421'] }
const p = pickRows(cells, me)
assert.equal(p.column, '3AF'); assert.equal(p.retake, 4); assert.deepEqual(p.missing, []); assert.ok(p.own > 10)
assert.equal(p.rows.filter((r) => r.course === 'CSE-2421').length, 4)
const res = solve(p.rows, { ...me, retakes: me.retakes.map(normCode) })
assert.equal(res.total, 2); assert.deepEqual(res.options.map((o) => o.label).sort(), ['CSE-2421 section 4AF', 'CSE-2421 section 4BF'])
// both options clash with CHEM-2301 (3AF, Sat 08:20-09:10); the 4BF class overlaps it by the full 50 minutes
for (const o of res.options) assert.ok(o.clashes.some((c) => [c.a.course, c.b.course].includes('CHEM-2301') && c.minutes === 50), o.label)
assert.equal(pickRows(cells, { ...me, semester: 9 }).column, null, 'unknown column is reported, not guessed')
assert.deepEqual(pickRows(cells, { ...me, retakes: ['ZZZ-9999'] }).missing, ['ZZZ-9999'])
console.log('routine tests passed')
