import { useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import type { SolveResult } from '../lib/solver'
import type { ClassRow } from '../types'
const when = (r: ClassRow) => `${r.course} ${r.section} on ${r.day}, ${r.start} to ${r.end}`
const teachers = (rows: ClassRow[]) => [...new Map(rows.filter((r) => r.teacher).map((r) => [`${r.course}|${r.section}`, `${r.course} ${r.section}: ${r.teacher}`])).values()].join(' · ')
interface P { result: SolveResult; retakeCount: number; activeId: string | null; showAll: boolean; onPick: (id: string) => void; onShowAll: () => void }
export default function Results({ result, retakeCount, activeId, showAll, onPick, onShowAll }: P) {
  const [more, setMore] = useState(false)
  const { options, missing, ignored, total, truncated } = result
  const free = options.filter((o) => o.clashes.length === 0).length
  const list = more ? options : options.slice(0, 8)
  return (
    <div>
      {retakeCount === 0 && <p className="text-sm">Add your retake courses in the profile above to see options.</p>}
      {missing.length > 0 && <p className="mb-3 rounded-[3px] bg-hatch/60 px-3 py-2 text-sm" role="status">No class rows yet for {missing.join(', ')}. Add the routine file or rows that list its sections.</p>}
      {ignored > 0 && <p className="mb-3 text-sm text-red-700" role="status">{ignored} row{ignored > 1 ? 's have' : ' has'} an end time that is not after its start, so {ignored > 1 ? 'they were' : 'it was'} left out.</p>}
      {truncated && <p className="text-sm text-red-700" role="alert">That is {total.toLocaleString()} section combinations, which is too many to check. Remove some sections or retake courses.</p>}
      {options.length > 0 && (
        <>
          <p className="mb-3 text-sm font-medium" aria-live="polite">{options.length} combination{options.length > 1 ? 's' : ''} checked. {free > 0 ? `${free} without any clash.` : 'None are clash-free. The least clashing come first.'}</p>
          <ul className="space-y-2">
            {list.map((o) => {
              const on = !showAll && o.id === activeId, ok = o.clashes.length === 0
              return (
                <li key={o.id} className={'rounded-[3px] border ' + (on ? 'border-teal bg-white' : 'border-rule')}>
                  <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left" aria-pressed={on} onClick={() => onPick(o.id)}>
                    <span className="min-w-0"><span className="text-sm font-medium">{o.label}</span>{teachers(o.rows) && <span className="block text-xs text-ink/60">{teachers(o.rows)}</span>}</span>
                    <span className={'inline-flex shrink-0 items-center gap-1 rounded-[3px] px-2 py-0.5 text-xs font-semibold ' + (ok ? 'bg-teal text-white' : 'bg-red-100 text-red-800')}>
                      {ok ? <><Check size={13} /> No clashes</> : <><AlertTriangle size={13} /> {o.clashes.length} clash{o.clashes.length > 1 ? 'es' : ''}</>}
                    </span>
                  </button>
                  {on && (
                    <div className="border-t border-rule px-3 py-2 text-sm">
                      {ok ? <p>None of these classes overlap your regular classes or each other. They meet on {o.days} day{o.days > 1 ? 's' : ''}.</p>
                        : <ul className="space-y-1">{o.clashes.map((c, i) => <li key={i}>{when(c.a)} overlaps {when(c.b)} by {c.minutes} minutes.</li>)}</ul>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.length > 8 && <button className="btn-ghost" onClick={() => setMore(!more)}>{more ? 'Show fewer options' : `Show all ${options.length} options`}</button>}
            <button className="btn-ghost" onClick={onShowAll}>{showAll ? 'Show the selected option' : 'Show every section on the timetable'}</button>
          </div>
        </>
      )}
    </div>
  )
}
