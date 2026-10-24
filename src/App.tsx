import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FileImage, FileText, Loader2, Plus, RotateCcw, Sparkles, Upload, X } from 'lucide-react'
import RowTable from './components/RowTable'
import Timetable from './components/Timetable'
import { EMPTY_PROFILE, SAMPLE_PROFILE, SAMPLE_ROWS } from './sample'
import { extractFromFile } from './lib/extract'
import { rowOk } from './types'
import type { ClassRow, Profile } from './types'

interface State { profile: Profile; rows: ClassRow[]; sample: boolean }
interface UFile { id: string; name: string; url: string; pdf: boolean; file: File }
const KEY = 'semestra.v1'
const FIRST: State = { profile: SAMPLE_PROFILE, rows: SAMPLE_ROWS, sample: true }

function usePersist(): [State, (f: (s: State) => State) => void] {
  const [s, set] = useState<State>(() => { try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as State) : FIRST } catch { return FIRST } })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage unavailable */ } }, [s])
  return [s, (f) => set(f)]
}
const Sec = ({ title, hint, children }: { title: string; hint: string; children: ReactNode }) => (
  <section className="border-t border-rule py-8">
    <h2 className="font-display text-2xl font-bold">{title}</h2>
    <p className="mb-5 mt-1 max-w-prose text-sm text-ink/70">{hint}</p>
    {children}
  </section>
)

export default function App() {
  const [{ profile, rows, sample }, update] = usePersist()
  const setProfile = (p: Profile) => update((s) => ({ ...s, profile: p }))
  const setRows = (r: ClassRow[]) => update((s) => ({ ...s, rows: r }))
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState<UFile[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [pending, setPending] = useState<ClassRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [exErr, setExErr] = useState('')
  const [note, setNote] = useState('')
  const runExtract = async () => {
    if (!current) return
    setBusy(true); setExErr(''); setNote('')
    try {
      const out = await extractFromFile(current.file, setNote)
      if (!out.rows.length) throw new Error('No classes were found in this file. Try a clearer image, or add rows by hand.')
      setPending(out.rows); setNote(`Read with ${out.model}. Check every row before adding it.`)
    } catch (e) { setExErr(e instanceof Error ? e.message : 'Extraction failed.'); setNote('') } finally { setBusy(false) }
  }
  const confirm = () => { if (!pending) return; update((s) => ({ ...s, sample: false, rows: s.sample ? pending : [...s.rows, ...pending] })); setPending(null); setNote('') }

  const addRetake = () => {
    const c = draft.trim().toUpperCase()
    if (c && !profile.retakes.includes(c)) setProfile({ ...profile, retakes: [...profile.retakes, c] })
    setDraft('')
  }
  const onFiles = (list: FileList | null) => {
    if (!list) return
    const ok: UFile[] = []; let bad = 0
    Array.from(list).forEach((f) => {
      const pdf = f.type === 'application/pdf'
      if (pdf || f.type.startsWith('image/')) ok.push({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, url: URL.createObjectURL(f), pdf, file: f }); else bad++
    })
    setErr(bad ? 'Only images and PDFs can be added. Other files were skipped.' : '')
    if (ok.length) { setFiles((x) => [...x, ...ok]); setSel(ok[0].id) }
  }
  const removeFile = (id: string) => {
    const f = files.find((x) => x.id === id); if (f) URL.revokeObjectURL(f.url)
    const rest = files.filter((x) => x.id !== id); setFiles(rest); if (sel === id) setSel(rest[0]?.id ?? null)
  }
  const current = files.find((f) => f.id === sel)
  const lbl = 'mb-1 block text-sm font-medium'
  const field = 'w-full rounded-[3px] border border-rule bg-white px-3 py-2 text-sm outline-none focus:border-teal'

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="py-8">
        <p className="font-display text-sm font-bold text-teal">Semestra <span className="ml-2 font-sans font-normal text-ink/60">Build preview, phase 2 of 5</span></p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">Pick your retake sections without the clashes.</h1>
        <p className="mt-4 max-w-prose text-ink/75">For IIUC students retaking courses. Add your routine and your retake courses, then see everything on one weekly timetable. Automatic clash finding arrives in phase 3.</p>
      </header>

      {sample && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-dashed border-amberink bg-hatch/50 px-4 py-3 text-sm" role="status">
          <span><b>Sample data.</b> These classes are made up so you can explore. They are not a real IIUC routine.</span>
          <button className="btn-ghost" onClick={() => { update(() => ({ profile: EMPTY_PROFILE, rows: [], sample: false })) }}>Start with my own data</button>
        </div>
      )}

      <Sec title="Your profile" hint="Tell Semestra which routine is yours and which courses you are retaking. Retake courses are drawn with hatching on the timetable.">
        <div className="grid gap-5 sm:grid-cols-3">
          <div><label className={lbl} htmlFor="sem">Semester</label>
            <select id="sem" className={field} value={profile.semester} onChange={(e) => setProfile({ ...profile, semester: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
            </select></div>
          <div><label className={lbl} htmlFor="sec">Section</label>
            <input id="sec" className={field} placeholder="For example A" value={profile.section} onChange={(e) => setProfile({ ...profile, section: e.target.value })} /></div>
          <div><label className={lbl} htmlFor="grp">Routine group</label>
            <select id="grp" className={field} value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value as Profile['gender'] })}>
              <option value="male">Male routine</option><option value="female">Female routine</option>
            </select></div>
        </div>
        <div className="mt-5 max-w-xl">
          <label className={lbl} htmlFor="rt">Retake courses</label>
          <div className="flex gap-2">
            <input id="rt" className={field} placeholder="Course code, then press Enter" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRetake() } }} />
            <button className="btn-primary" onClick={addRetake}><Plus size={16} /> Add</button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.retakes.length === 0 && <li className="text-sm text-ink/60">No retake courses yet. Add the course codes you are retaking.</li>}
            {profile.retakes.map((c) => (
              <li key={c} className="inline-flex items-center gap-1 rounded-[3px] border border-dashed border-amberink bg-hatch/60 py-1 pl-2 pr-1 text-sm font-medium">
                {c}<button aria-label={`Remove ${c}`} className="rounded-[3px] p-1 hover:bg-white" onClick={() => setProfile({ ...profile, retakes: profile.retakes.filter((x) => x !== c) })}><X size={14} /></button>
              </li>
            ))}
          </ul>
        </div>
      </Sec>

      <Sec title="Routine files" hint="Add a photo or PDF of each routine you need: your own semester, and the semesters where your retake courses run. Select a file and let Gemma read it, then check every row before it joins your classes. You can always type rows by hand.">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div>
            <label className="btn-primary cursor-pointer"><Upload size={16} /> Add routine files
              <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} /></label>
            <button className="btn-ghost ml-2" disabled={!current || busy} onClick={runExtract} title={current ? 'Read the selected file with Gemma' : 'Select a file first'}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {busy ? 'Reading' : 'Read with Gemma'}</button>
            <p className="mt-2 text-xs text-ink/60">Pick a file from the list, then read it. PDFs use their first three pages.</p>
            {note && <p className="mt-2 text-sm text-ink/80" role="status">{note}</p>}
            {exErr && <p className="mt-2 text-sm text-red-700" role="alert">{exErr} You can still type the rows by hand.</p>}
            {err && <p className="mt-2 text-sm text-red-700" role="alert">{err}</p>}
            <ul className="mt-4 space-y-1">
              {files.length === 0 && <li className="text-sm text-ink/60">No files yet. Images and PDFs work. Files stay in your browser.</li>}
              {files.map((f) => (
                <li key={f.id} className={'flex items-center gap-1 rounded-[3px] border px-2 py-1 text-sm ' + (f.id === sel ? 'border-teal bg-white' : 'border-rule')}>
                  <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSel(f.id)}>
                    {f.pdf ? <FileText size={16} /> : <FileImage size={16} />}<span className="truncate">{f.name}</span></button>
                  <button aria-label={`Remove ${f.name}`} className="p-1 hover:text-red-700" onClick={() => removeFile(f.id)}><X size={14} /></button>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-h-[200px] rounded-[3px] border border-rule bg-white p-2">
            {!current && <p className="p-6 text-sm text-ink/60">Select a file to view it here while you type its rows.</p>}
            {current && !current.pdf && <img src={current.url} alt={`Routine file ${current.name}`} className="max-h-[420px] w-full object-contain" />}
            {current?.pdf && <div className="p-6 text-sm"><p>PDF preview is not shown here, but Gemma can still read it.</p><a className="mt-2 inline-block font-medium text-teal underline" href={current.url} target="_blank" rel="noreferrer">Open {current.name} in a new tab</a></div>}
          </div>
        </div>
      </Sec>

      {pending && (
        <section className="my-6 rounded-[3px] border-2 border-dashed border-teal bg-white p-5" aria-label="Review extracted rows">
          <h2 className="font-display text-xl font-bold">Check what Gemma read</h2>
          <p className="mb-4 mt-1 text-sm text-ink/70">Compare each row with your file above. Fix mistakes or delete wrong rows. Nothing joins your classes until you confirm.</p>
          <RowTable rows={pending} setRows={(r) => setPending(r)} profile={profile} />
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" disabled={!pending.length || pending.some((r) => !rowOk(r))} onClick={confirm}>Add {pending.length} rows to my classes</button>
            <button className="btn-ghost" onClick={() => setPending(null)}>Discard</button>
          </div>
        </section>
      )}

      <Sec title="Class rows" hint="Every class from your routines. Edit any cell, add rows, or delete mistakes. Everything here shows up on the timetable.">
        {rows.length === 0 ? (
          <div className="rounded-[3px] border border-dashed border-rule bg-white p-6 text-sm">
            <p className="font-medium">No classes yet.</p>
            <p className="mt-1 text-ink/70">Add a row by hand, or load the made-up sample to see how Semestra works.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => setRows([{ id: Math.random().toString(36).slice(2, 10), course: '', section: '', day: 'Sat', start: '09:00', end: '10:30', room: '' }])}><Plus size={16} /> Add first row</button>
              <button className="btn-ghost" onClick={() => update(() => ({ profile: SAMPLE_PROFILE, rows: SAMPLE_ROWS, sample: true }))}><RotateCcw size={16} /> Load sample data</button>
            </div>
          </div>
        ) : <RowTable rows={rows} setRows={setRows} profile={profile} />}
      </Sec>

      <Sec title="Your week" hint="Solid blocks are your regular classes. Hatched, dashed blocks are retake courses. Overlapping blocks are clashes. Phase 3 will find clash-free section combinations for you.">
        <Timetable rows={rows} profile={profile} />
      </Sec>
    </div>
  )
}
