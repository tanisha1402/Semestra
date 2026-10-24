import assert from 'node:assert/strict'
import { MAX_COMBOS, overlap, solve } from './solver'
import { SAMPLE_PROFILE, SAMPLE_ROWS } from '../sample'
import type { ClassRow } from '../types'
const row = (id: string, course: string, section: string, day: ClassRow['day'], start: string, end: string): ClassRow => ({ id, course, section, day, start, end, room: '' })
assert.equal(overlap(row('a', 'X', 'A', 'Sat', '09:00', '10:30'), row('b', 'Y', 'A', 'Sat', '10:30', '12:00')), 0, 'touching is not a clash')
assert.equal(overlap(row('a', 'X', 'A', 'Sat', '09:00', '10:30'), row('b', 'Y', 'A', 'Sun', '09:00', '10:30')), 0, 'different days')
assert.equal(overlap(row('a', 'X', 'A', 'Sat', '09:00', '10:30'), row('b', 'Y', 'A', 'Sat', '10:00', '11:00')), 30)
const r = solve(SAMPLE_ROWS, SAMPLE_PROFILE)
assert.equal(r.total, 6); assert.equal(r.options.length, 6)
assert.equal(r.options.filter((o) => o.clashes.length === 0).length, 2)
assert.equal(r.options[0].clashes.length, 0); assert.equal(r.options[5].clashes.length, 2)
assert.deepEqual(r.options.map((o) => o.clashes.length), [0, 0, 1, 1, 1, 2])
const m = solve(SAMPLE_ROWS, { ...SAMPLE_PROFILE, retakes: ['DEMO-201', 'NOPE-1'] }); assert.deepEqual(m.missing, ['NOPE-1']); assert.equal(m.total, 3)
const bad = solve([...SAMPLE_ROWS, row('z', 'DEMO-201', 'D', 'Mon', '11:00', '10:00')], SAMPLE_PROFILE); assert.equal(bad.ignored, 1); assert.equal(bad.total, 6)
const many = Array.from({ length: 20 }, (_, i) => row(`m${i}`, 'BIG-1', `S${i}`, 'Sat', '09:00', '10:00'))
const big = solve([...many, ...many.map((x) => ({ ...x, id: x.id + 'b', course: 'BIG-2' })), ...many.map((x) => ({ ...x, id: x.id + 'c', course: 'BIG-3' }))], { ...SAMPLE_PROFILE, retakes: ['BIG-1', 'BIG-2', 'BIG-3'] })
assert.ok(big.truncated && big.total > MAX_COMBOS && big.options.length === 0)
console.log('solver tests passed')
