import { Plus, Trash2 } from 'lucide-react'
import { DAYS, rowOk, uid } from '../types'
import type { ClassRow, Day, Profile } from '../types'
import { isRetake } from '../types'
const inp = 'w-full rounded-[3px] border border-transparent bg-transparent px-2 py-1.5 outline-none hover:border-rule focus:border-teal focus:bg-white'
export default function RowTable({ rows, setRows, profile }: { rows: ClassRow[]; setRows: (r: ClassRow[]) => void; profile: Profile }) {
  const upd = (id: string, p: Partial<ClassRow>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const add = () => setRows([...rows, { id: uid(), course: '', section: '', day: 'Sat', start: '09:00', end: '10:30', room: '', teacher: '' }])
  const txt = (r: ClassRow, k: 'course' | 'section' | 'room' | 'teacher', label: string, i: number) => (
    <input className={inp} aria-label={`${label}, row ${i + 1}`} value={r[k] ?? ''} onChange={(e) => upd(r.id, { [k]: e.target.value })} />
  )
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-rule font-display">
            <tr>{['Course', 'Section', 'Day', 'Start', 'End', 'Room', 'Teacher', ''].map((h, i) => <th key={i} className="px-1 py-2 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={'border-b border-rule/70 ' + (rowOk(r) ? '' : 'bg-red-50')}>
                <td className="w-40 px-1 py-1">
                  {txt(r, 'course', 'Course', i)}
                  {isRetake(r, profile) && <span className="ml-2 rounded-[3px] bg-hatch px-1.5 text-xs font-semibold text-amberink">Retake</span>}
                </td>
                <td className="w-20 px-1">{txt(r, 'section', 'Section', i)}</td>
                <td className="w-24 px-1">
                  <select className={inp} aria-label={`Day, row ${i + 1}`} value={r.day} onChange={(e) => upd(r.id, { day: e.target.value as Day })}>
                    {DAYS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </td>
                <td className="w-28 px-1"><input type="time" className={inp} aria-label={`Start time, row ${i + 1}`} value={r.start} onChange={(e) => upd(r.id, { start: e.target.value })} /></td>
                <td className="w-28 px-1"><input type="time" className={inp} aria-label={`End time, row ${i + 1}`} value={r.end} onChange={(e) => upd(r.id, { end: e.target.value })} /></td>
                <td className="w-24 px-1">{txt(r, 'room', 'Room', i)}</td>
                <td className="w-24 px-1">{txt(r, 'teacher', 'Teacher', i)}</td>
                <td className="w-24 px-1 text-right">
                  {!rowOk(r) && <span className="mr-1 text-xs text-red-700">End must be after start</span>}
                  <button className="rounded-[3px] p-1.5 text-ink/60 hover:bg-red-50 hover:text-red-700" aria-label={`Delete row ${i + 1}`} onClick={() => setRows(rows.filter((x) => x.id !== r.id))}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-ghost mt-3" onClick={add}><Plus size={16} /> Add class row</button>
    </div>
  )
}
