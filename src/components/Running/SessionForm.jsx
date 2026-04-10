import { useState } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { C } from '../../theme'
import { todayISO } from '../../utils/date'

const SESSION_TYPES = ['easy', 'tempo', 'interval', 'long']

const TYPE_META = {
  easy:     { label: 'Easy',      color: '#7dd3fc', bg: 'rgba(125,211,252,0.08)', border: 'rgba(125,211,252,0.2)' },
  tempo:    { label: 'Tempo',     color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  interval: { label: 'Intervals', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  long:     { label: 'Long',      color: '#6ee7b7', bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.2)' },
}

function IntervalRow({ rep, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
      <input className="input" style={{ width: 72, textAlign: 'center', fontSize: 12, padding: '6px 8px', minHeight: 38 }} placeholder="800m" value={rep.distance} onChange={e => onChange({ ...rep, distance: e.target.value })} />
      <span style={{ color: C.muted, fontSize: 12 }}>@</span>
      <input className="input" style={{ flex: 1, textAlign: 'center', fontSize: 12, padding: '6px 8px', minHeight: 38 }} placeholder="4:00–4:10 /km" value={rep.pace} onChange={e => onChange({ ...rep, pace: e.target.value })} />
      <input className="input" style={{ width: 64, textAlign: 'center', fontSize: 12, padding: '6px 8px', minHeight: 38 }} placeholder="90s" value={rep.recovery} onChange={e => onChange({ ...rep, recovery: e.target.value })} />
      <button onClick={onRemove} style={{ color: C.muted, fontSize: 18, lineHeight: 1, padding: '4px 4px' }}>×</button>
    </div>
  )
}

export default function SessionForm({ session, prefillDate, prefill, onClose }) {
  const { addSession, updateSession } = useTraining()
  const existing = !!session

  const [date,      setDate]      = useState(session?.date ?? prefillDate ?? todayISO())
  const [sessType,  setSessType]  = useState(session?.sessionType ?? prefill?.sessionType ?? 'easy')
  const [title,     setTitle]     = useState(session?.title ?? prefill?.title ?? '')
  const [distance,  setDistance]  = useState(session?.distance ?? '')
  const [duration,  setDuration]  = useState(session?.duration ?? '')
  const [paceRange, setPaceRange] = useState(session?.paceRange ?? '')
  const [notes,     setNotes]     = useState(session?.notes ?? prefill?.notes ?? '')
  const [warmup,    setWarmup]    = useState(session?.warmup ?? '1.5 km easy jog')
  const [cooldown,  setCooldown]  = useState(session?.cooldown ?? '1 km easy jog')
  const [reps,      setReps]      = useState(session?.reps ?? [])

  function addRep() {
    setReps(r => [...r, { id: Date.now(), distance: '', pace: '', recovery: '90s' }])
  }
  function updateRep(id, val) { setReps(r => r.map(x => x.id === id ? val : x)) }
  function removeRep(id)      { setReps(r => r.filter(x => x.id !== id)) }

  function handleSave() {
    const data = {
      type: 'running', date, sessionType: sessType, title,
      distance, duration, paceRange, notes, warmup, cooldown,
      ...(sessType === 'interval' ? { reps } : {}),
    }
    if (existing) updateSession(session.id, data)
    else          addSession(data)
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
          borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520,
          maxHeight: '92dvh', overflowY: 'auto',
          padding: '20px 16px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 20, color: '#e2e6ed' }}>
            {existing ? 'Edit Session' : 'Log Run'}
          </span>
          <button onClick={onClose} style={{ color: C.muted, fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Type */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Type</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SESSION_TYPES.map(t => {
              const m = TYPE_META[t]
              const active = sessType === t
              return (
                <button
                  key={t}
                  onClick={() => setSessType(t)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, minHeight: 38,
                    fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 13,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: active ? m.bg : C.card,
                    color: active ? m.color : C.dim,
                    border: `1px solid ${active ? m.border : C.border}`,
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Title</label>
          <input className="input" placeholder={sessType === 'interval' ? 'e.g. 6×800m @ Race Pace' : 'e.g. Easy Recovery Run'} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Distance + Duration */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Distance</label>
            <input className="input" placeholder="8 km" value={distance} onChange={e => setDistance(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Duration</label>
            <input className="input" placeholder="45 min" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
        </div>

        {/* Pace */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Target Pace</label>
          <input className="input" placeholder="5:10–5:30 /km" value={paceRange} onChange={e => setPaceRange(e.target.value)} />
        </div>

        {/* Intervals */}
        {sessType === 'interval' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="label" style={{ marginBottom: 0 }}>Intervals</label>
              <button
                onClick={addRep}
                style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                + rep
              </button>
            </div>
            {reps.length === 0 && (
              <p style={{ fontFamily: '"Barlow", sans-serif', fontSize: 12, color: C.muted, textAlign: 'center', padding: '8px 0' }}>
                No reps yet
              </p>
            )}
            {reps.map(rep => (
              <IntervalRow key={rep.id} rep={rep} onChange={val => updateRep(rep.id, val)} onRemove={() => removeRep(rep.id)} />
            ))}
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="label">Warm-up</label>
                <input className="input" style={{ fontSize: 12 }} value={warmup} onChange={e => setWarmup(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Cool-down</label>
                <input className="input" style={{ fontSize: 12 }} value={cooldown} onChange={e => setCooldown(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Notes</label>
          <textarea
            className="input"
            style={{ resize: 'none', fontSize: 13 }}
            rows={3}
            placeholder="How did it go?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>
            {existing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
