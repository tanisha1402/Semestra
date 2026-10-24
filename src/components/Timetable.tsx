import { DAYS, isRetake, rowOk, toMin } from '../types'
import type { ClassRow, Profile } from '../types'
const H0 = 8, H1 = 18, PX = 44
const hues = [165, 205, 265, 330, 25, 95]
const hue = (c: string) => hues[[...c].reduce((a, ch) => a + ch.charCodeAt(0), 0) % hues.length]
export default function Timetable({ rows, profile }: { rows: ClassRow[]; profile: Profile }) {
  const valid = rows.filter((r) => rowOk(r) && toMin(r.end) > H0 * 60 && toMin(r.start) < H1 * 60)
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i)
  const grid = `repeating-linear-gradient(to bottom, transparent 0 ${PX - 1}px, #C9D6D0 ${PX - 1}px ${PX}px)`
  return (
    <div className="overflow-x-auto" role="region" aria-label="Weekly timetable" tabIndex={0}>
      <div className="grid min-w-[700px]" style={{ gridTemplateColumns: '52px repeat(6, 1fr)' }}>
        <div className="border-b border-rule" />
        {DAYS.map((d) => <div key={d} className="border-b border-l border-rule py-2 text-center font-display text-sm font-bold">{d}</div>)}
        <div className="relative" style={{ height: (H1 - H0) * PX }}>
          {hours.map((h) => <span key={h} className="absolute right-2 text-[11px] tabular-nums text-ink/60" style={{ top: (h - H0) * PX + 2 }}>{String(h).padStart(2, '0')}:00</span>)}
        </div>
        {DAYS.map((d) => (
          <div key={d} className="relative border-l border-rule" style={{ height: (H1 - H0) * PX, backgroundImage: grid }}>
            {valid.filter((r) => r.day === d).map((r) => {
              const s = Math.max(toMin(r.start), H0 * 60), e = Math.min(toMin(r.end), H1 * 60)
              const rt = isRetake(r, profile), h = hue(r.course.trim().toUpperCase())
              return (
                <div key={r.id} title={`${r.course} ${r.section}, ${r.start} to ${r.end}`}
                  className={'absolute inset-x-1 overflow-hidden rounded-[3px] px-1.5 py-1 text-[11px] leading-tight ' + (rt ? 'hatch border-2 border-dashed' : 'border')}
                  style={{ top: ((s - H0 * 60) / 60) * PX, height: Math.max(((e - s) / 60) * PX - 2, 20), background: `hsla(${h},40%,90%,${rt ? 0.85 : 1})`, borderColor: `hsl(${h},45%,32%)`, color: `hsl(${h},50%,16%)` }}>
                  <b>{r.course} {r.section}</b>
                  <div className="tabular-nums">{r.start} to {r.end}</div>
                  {r.room && <div>Room {r.room}</div>}
                  {rt && <div className="font-semibold">Retake</div>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
