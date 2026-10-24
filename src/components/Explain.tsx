import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { API, SERVER_DOWN } from '../lib/extract'
import type { Option } from '../lib/solver'
import type { ClassRow } from '../types'
const when = (r: ClassRow) => `${r.course} ${r.section} on ${r.day}, ${r.start} to ${r.end}`
export default function Explain({ option, alternative }: { option: Option; alternative: string | null }) {
  const [lang, setLang] = useState<'en' | 'bn'>('en'); const [busy, setBusy] = useState(false); const [text, setText] = useState(''); const [err, setErr] = useState('')
  const run = async () => {
    setBusy(true); setErr(''); setText('')
    try {
      const r = await fetch(`${API}/api/v1/explain`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, label: option.label, alternative, clashes: option.clashes.map((c) => ({ a: when(c.a), b: when(c.b), minutes: c.minutes })) }) })
        .catch(() => { throw new Error(SERVER_DOWN) })
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || `The server returned an error (${r.status}).`)
      setText(j.text)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not write an explanation.') } finally { setBusy(false) }
  }
  return (
    <div className="mt-4 rounded-[3px] border border-dashed border-rule p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded-[3px] border border-rule bg-white px-2 py-1.5" aria-label="Explanation language" value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'bn')}>
          <option value="en">English</option><option value="bn">বাংলা</option>
        </select>
        <button className="btn-ghost" disabled={busy} onClick={run}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {busy ? 'Writing' : 'Explain these clashes in plain language'}</button>
      </div>
      {text && <><p lang={lang} className="mt-3 max-w-prose whitespace-pre-line" role="status">{text}</p><p className="mt-1 text-xs text-ink/60">Written by Gemma from the clash list above. The list is the source of truth.</p></>}
      {err && <p className="mt-3 text-red-700" role="alert">{err} The clash details above are still correct.</p>}
    </div>
  )
}
