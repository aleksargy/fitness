import { useState } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { paceToSecs, secsToStr } from '../../utils/pace'
import { C } from '../../theme'

const DISTANCES = [
  { label: '5K',   m: 5000 },
  { label: '10K',  m: 10000 },
  { label: 'Half', m: 21097 },
  { label: 'Full', m: 42195 },
]

function goalTimeFromInput(hh, mm, ss) {
  return (parseInt(hh) || 0) * 3600 + (parseInt(mm) || 0) * 60 + (parseInt(ss) || 0)
}

export default function RaceForm({ race, onClose }) {
  const { addRace, updateRace, setActiveRace } = useTraining()
  const existing = !!race

  const parseTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return { hh: String(h), mm: String(m).padStart(2, '0'), ss: String(s).padStart(2, '0') }
  }

  const init = existing ? parseTime(race.goalTimeSecs) : { hh: '0', mm: '40', ss: '00' }
  const [name,  setName]  = useState(race?.name ?? '10K Race')
  const [date,  setDate]  = useState(race?.date ?? '')
  const [distM, setDistM] = useState(race?.distanceM ?? 10000)
  const [hh,    setHh]    = useState(init.hh)
  const [mm,    setMm]    = useState(init.mm)
  const [ss,    setSs]    = useState(init.ss)

  const goalSecs     = goalTimeFromInput(hh, mm, ss)
  const racePaceSecs = goalSecs / (distM / 1000)

  function handleSave() {
    if (!date) return
    const data = { name, date, distanceM: distM, goalTimeSecs: goalSecs }
    if (existing) {
      updateRace(race.id, data)
    } else {
      const r = addRace(data)
      if (r?.id) setActiveRace(r.id)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 420,
          padding: '20px 16px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 20, color: '#e2e6ed' }}>
            {existing ? 'Edit Race Goal' : 'New Race Goal'}
          </span>
          <button onClick={onClose} style={{ color: C.muted, fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Race Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vienna 10K" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Race Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Distance</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DISTANCES.map(d => (
              <button
                key={d.label}
                onClick={() => setDistM(d.m)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, minHeight: 40,
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: distM === d.m ? `${C.primary}18` : C.card,
                  color: distM === d.m ? C.primary : C.dim,
                  border: `1px solid ${distM === d.m ? `${C.primary}40` : C.border}`,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="label">Goal Time</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input className="input" style={{ width: 52, textAlign: 'center' }} value={hh} onChange={e => setHh(e.target.value)} placeholder="0" maxLength={1} />
            <span style={{ color: C.muted, fontWeight: 700 }}>:</span>
            <input className="input" style={{ width: 52, textAlign: 'center' }} value={mm} onChange={e => setMm(e.target.value)} placeholder="40" maxLength={2} />
            <span style={{ color: C.muted, fontWeight: 700 }}>:</span>
            <input className="input" style={{ width: 52, textAlign: 'center' }} value={ss} onChange={e => setSs(e.target.value)} placeholder="00" maxLength={2} />
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.muted }}>h m s</span>
          </div>
          {goalSecs > 0 && (
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: C.primary, marginTop: 5 }}>
              → {secsToStr(Math.round(racePaceSecs))} /km
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={!date || goalSecs === 0} className="btn-primary" style={{ flex: 1, opacity: (!date || goalSecs === 0) ? 0.4 : 1 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
