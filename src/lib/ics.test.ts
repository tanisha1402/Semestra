import assert from 'node:assert/strict'
import { makeIcs } from './ics'
import type { ClassRow } from '../types'
const row = (id: string, day: ClassRow['day'], start: string, end: string, course = 'CSE 1101', room = 'R1, B2'): ClassRow => ({ id, course, section: 'A', day, start, end, room })
const sat = new Date(2026, 9, 24, 10, 0) // Saturday 24 Oct 2026
const ics = makeIcs([row('1', 'Sat', '09:00', '10:30'), row('2', 'Sun', '13:00', '14:30'), row('3', 'Thu', '09:00', '10:30'), row('x', 'Mon', '11:00', '10:00')], sat)
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'))
assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 3, 'invalid row skipped')
for (const s of ['DTSTART:20261024T090000', 'BYDAY=SA', 'DTSTART:20261025T130000', 'BYDAY=SU', 'DTSTART:20261029T090000', 'BYDAY=TH', 'LOCATION:Room R1\\, B2']) assert.ok(ics.includes(s), s)
console.log('ics tests passed')
