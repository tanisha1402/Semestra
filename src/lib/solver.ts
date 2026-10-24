import { isRetake, rowOk, toMin } from '../types'
import type { ClassRow, Profile } from '../types'
export interface Clash { a: ClassRow; b: ClassRow; minutes: number }
export interface Option { id: string; label: string; rows: ClassRow[]; clashes: Clash[]; minutes: number; days: number }
export interface SolveResult { options: Option[]; missing: string[]; ignored: number; total: number; truncated: boolean }
export const MAX_COMBOS = 5000
const key = (s: string) => s.trim().toUpperCase()
/** Minutes two classes overlap. Classes that only touch (10:30 end, 10:30 start) do not overlap. */
export const overlap = (a: ClassRow, b: ClassRow) => (a.day === b.day ? Math.max(0, Math.min(toMin(a.end), toMin(b.end)) - Math.max(toMin(a.start), toMin(b.start))) : 0)

export function solve(rows: ClassRow[], profile: Profile): SolveResult {
  const good = rows.filter(rowOk), ignored = rows.length - good.length
  const regular = good.filter((r) => !isRetake(r, profile))
  const missing: string[] = []; const groups: { course: string; secs: { name: string; rows: ClassRow[] }[] }[] = []
  for (const course of profile.retakes.map(key)) {
    const m = new Map<string, ClassRow[]>()
    for (const r of good) if (key(r.course) === course) m.set(key(r.section), [...(m.get(key(r.section)) ?? []), r])
    if (m.size) groups.push({ course, secs: [...m].map(([name, rs]) => ({ name, rows: rs })) }); else missing.push(course)
  }
  if (!groups.length) return { options: [], missing, ignored, total: 0, truncated: false }
  const total = groups.reduce((n, g) => n * g.secs.length, 1)
  if (total > MAX_COMBOS) return { options: [], missing, ignored, total, truncated: true }
  let combos: { course: string; name: string; rows: ClassRow[] }[][] = [[]]
  for (const g of groups) combos = combos.flatMap((c) => g.secs.map((s) => [...c, { course: g.course, ...s }]))
  const options: Option[] = combos.map((c) => {
    const picked = c.flatMap((x) => x.rows), clashes: Clash[] = []
    for (const r of picked) for (const f of regular) { const m = overlap(r, f); if (m > 0) clashes.push({ a: r, b: f, minutes: m }) }
    for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) {
      if (key(picked[i].course) === key(picked[j].course)) continue
      const m = overlap(picked[i], picked[j]); if (m > 0) clashes.push({ a: picked[i], b: picked[j], minutes: m })
    }
    return { id: c.map((x) => `${x.course}:${x.name}`).join('|'), label: c.map((x) => `${x.course} section ${x.name || '(none)'}`).join(', '), rows: picked, clashes, minutes: clashes.reduce((n, k) => n + k.minutes, 0), days: new Set(picked.map((r) => r.day)).size }
  })
  options.sort((a, b) => a.clashes.length - b.clashes.length || a.minutes - b.minutes || a.days - b.days || a.label.localeCompare(b.label))
  return { options, missing, ignored, total, truncated: false }
}
