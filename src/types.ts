export const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const
export type Day = (typeof DAYS)[number]
export interface ClassRow { id: string; course: string; section: string; day: Day; start: string; end: string; room: string; teacher?: string }
export interface Profile { semester: number; section: string; gender: 'male' | 'female'; retakes: string[] }
export const uid = () => Math.random().toString(36).slice(2, 10)
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0) }
export const rowOk = (r: ClassRow) => /^\d{2}:\d{2}$/.test(r.start) && /^\d{2}:\d{2}$/.test(r.end) && toMin(r.end) > toMin(r.start)
export const isRetake = (r: ClassRow, p: Profile) => p.retakes.includes(r.course.trim().toUpperCase())
