import type { ClassRow, Profile } from './types'
// Made-up demo data. Not a real IIUC routine.
export const EMPTY_PROFILE: Profile = { semester: 1, section: '', gender: 'male', retakes: [] }
export const SAMPLE_PROFILE: Profile = { semester: 5, section: 'A', gender: 'male', retakes: ['DEMO-201', 'DEMO-302'] }
const r = (id: string, course: string, section: string, day: ClassRow['day'], start: string, end: string, room: string): ClassRow => ({ id, course, section, day, start, end, room })
export const SAMPLE_ROWS: ClassRow[] = [
  r('s1', 'DEMO-501', 'A', 'Sat', '09:00', '10:30', 'R101'),
  r('s2', 'DEMO-502', 'A', 'Sun', '10:30', '12:00', 'R102'),
  r('s3', 'DEMO-503', 'A', 'Mon', '09:00', '10:30', 'R103'),
  r('s4', 'DEMO-504', 'A', 'Tue', '11:00', '12:30', 'R104'),
  r('s5', 'DEMO-505', 'A', 'Wed', '09:00', '10:30', 'R105'),
  r('s6', 'DEMO-201', 'A', 'Sat', '09:30', '11:00', 'R201'),
  r('s7', 'DEMO-201', 'B', 'Sun', '13:00', '14:30', 'R202'),
  r('s8', 'DEMO-201', 'C', 'Tue', '09:00', '10:30', 'R203'),
  r('s9', 'DEMO-302', 'A', 'Mon', '10:00', '11:30', 'R301'),
  r('s10', 'DEMO-302', 'B', 'Thu', '09:00', '10:30', 'R302'),
]
