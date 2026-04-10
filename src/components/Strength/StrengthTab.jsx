import { useState } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { todayISO, format, parseISO } from '../../utils/date'
import { C } from '../../theme'
import { v4 as uuid } from 'uuid'

// ─── Preset exercises by category ────────────────────────────────────────────

const CATEGORIES = [
  {
    label: 'Push',
    exercises: ['Push-ups', 'Dips', 'Pike Push-ups', 'HSPU', 'Bench Press', 'OHP'],
  },
  {
    label: 'Pull',
    exercises: ['Pull-ups', 'Chin-ups', 'Muscle-ups', 'Rows', 'Face Pulls'],
  },
  {
    label: 'Core',
    exercises: ['L-sit', 'Hollow Body', 'Planche Lean', 'Ab Wheel', 'Hanging Leg Raises', 'Dragon Flag'],
  },
  {
    label: 'Legs',
    exercises: ['Pistol Squat', 'Bulgarian Split Squat', 'Box Jump', 'Nordic Curls', 'Calf Raises'],
  },
  {
    label: 'Skill',
    exercises: ['Handstand', 'Freestanding HS', 'Cartwheel', 'Planche', 'Front Lever', 'Back Lever', 'Human Flag'],
  },
  {
    label: 'Mobility',
    exercises: ['Wrist Mobility', 'Shoulder Mobility', 'Hip Flexors', 'Pancake Stretch', 'Bridge'],
  },
]

const ALL_PRESETS = CATEGORIES.flatMap(c => c.exercises)

const TAGS = ['skill', 'strength', 'hypertrophy', 'outdoor', 'gym', 'weighted', 'mobility', 'conditioning']

// ─── Set row inside exercise ──────────────────────────────────────────────────

function SetRow({ set, index, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.muted, width: 16, flexShrink: 0, textAlign: 'right' }}>
        {index + 1}
      </span>
      {/* Reps */}
      <input
        className="input"
        style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '6px 8px', minHeight: 36 }}
        placeholder="reps"
        value={set.reps}
        onChange={e => onChange({ ...set, reps: e.target.value })}
      />
      {/* Weight (optional) */}
      <input
        className="input"
        style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '6px 8px', minHeight: 36 }}
        placeholder="kg / time"
        value={set.load}
        onChange={e => onChange({ ...set, load: e.target.value })}
      />
      {/* Note */}
      <input
        className="input"
        style={{ flex: 2, fontSize: 12, padding: '6px 8px', minHeight: 36 }}
        placeholder="note"
        value={set.note}
        onChange={e => onChange({ ...set, note: e.target.value })}
      />
      <button
        onClick={onRemove}
        style={{ color: C.muted, padding: '4px 6px', flexShrink: 0, fontSize: 16, lineHeight: 1 }}
      >×</button>
    </div>
  )
}

// ─── Single exercise block ────────────────────────────────────────────────────

function ExerciseBlock({ ex, onChange, onRemove }) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = ex.name.length > 0
    ? ALL_PRESETS.filter(p => p.toLowerCase().includes(ex.name.toLowerCase()))
    : []

  function addSet() {
    onChange({ ...ex, sets: [...ex.sets, { id: uuid(), reps: '', load: '', note: '' }] })
  }
  function updateSet(id, val) {
    onChange({ ...ex, sets: ex.sets.map(s => s.id === id ? val : s) })
  }
  function removeSet(id) {
    onChange({ ...ex, sets: ex.sets.filter(s => s.id !== id) })
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 12px 8px', marginBottom: 8 }}>
      {/* Exercise name + remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="input"
            style={{ fontSize: 14, fontWeight: 600, minHeight: 40 }}
            placeholder="Exercise name…"
            value={ex.name}
            onChange={e => {
              onChange({ ...ex, name: e.target.value })
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {/* Autocomplete dropdown */}
          {showSuggestions && filtered.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              marginTop: 2, maxHeight: 160, overflowY: 'auto',
            }}>
              {filtered.slice(0, 8).map(p => (
                <button
                  key={p}
                  onMouseDown={() => { onChange({ ...ex, name: p }); setShowSuggestions(false) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px',
                    fontFamily: '"Barlow", sans-serif', fontSize: 13, color: '#e2e6ed',
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          style={{ color: C.muted, padding: 6, flexShrink: 0, fontSize: 18, lineHeight: 1 }}
        >×</button>
      </div>

      {/* Column headers */}
      {ex.sets.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 4, paddingLeft: 22 }}>
          {['Reps', 'Load', 'Note', ''].map((h, i) => (
            <div key={i} style={{
              flex: i === 2 ? 2 : i === 3 ? 0 : 1,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 8, color: C.muted,
              textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center',
              ...(i === 3 ? { width: 28 } : {}),
            }}>
              {h}
            </div>
          ))}
        </div>
      )}

      {/* Sets */}
      {ex.sets.map((s, i) => (
        <SetRow
          key={s.id}
          set={s}
          index={i}
          onChange={val => updateSet(s.id, val)}
          onRemove={() => removeSet(s.id)}
        />
      ))}

      {/* Notes per exercise */}
      <textarea
        className="input"
        style={{ fontSize: 12, resize: 'none', marginTop: 4, minHeight: 0, padding: '6px 8px' }}
        rows={2}
        placeholder="Notes (form cues, feel, progressions…)"
        value={ex.note}
        onChange={e => onChange({ ...ex, note: e.target.value })}
      />

      <button
        onClick={addSet}
        style={{
          marginTop: 6, width: '100%', padding: '6px', borderRadius: 6,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: C.str,
          background: `${C.str}10`, border: `1px solid ${C.str}25`,
          minHeight: 36,
        }}
      >
        + Set
      </button>
    </div>
  )
}

// ─── Category quick-add ───────────────────────────────────────────────────────

function CategoryPicker({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].label)

  const cat = CATEGORIES.find(c => c.label === activeCategory) ?? CATEGORIES[0]

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderRadius: 10, minHeight: 44,
          background: C.surface, border: `1px solid ${C.border}`,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.dim,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}
      >
        <span>Add Exercise</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${C.border}`, padding: '6px 8px', gap: 4 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.label}
                onClick={() => setActiveCategory(c.label)}
                style={{
                  flexShrink: 0, padding: '5px 10px', borderRadius: 6, minHeight: 32,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: activeCategory === c.label ? `${C.str}18` : 'transparent',
                  color: activeCategory === c.label ? C.str : C.muted,
                  border: activeCategory === c.label ? `1px solid ${C.str}30` : '1px solid transparent',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          {/* Exercise buttons */}
          <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cat.exercises.map(e => (
              <button
                key={e}
                onClick={() => { onAdd(e); setOpen(false) }}
                style={{
                  padding: '7px 12px', borderRadius: 8, minHeight: 36,
                  fontFamily: '"Barlow", sans-serif', fontSize: 13, fontWeight: 500, color: '#e2e6ed',
                  background: C.card, border: `1px solid ${C.border}`,
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Entry form (modal) ────────────────────────────────────────────────────────

function EntryForm({ entry, prefillDate, onClose }) {
  const { addSession, updateSession } = useTraining()
  const existing = !!entry

  const [date,  setDate]  = useState(entry?.date ?? prefillDate ?? todayISO())
  const [title, setTitle] = useState(entry?.title ?? '')
  const [tags,  setTags]  = useState(entry?.tags ?? [])
  const [exercises, setExercises] = useState(entry?.exercises ?? [])
  const [freeNotes, setFreeNotes] = useState(entry?.freeNotes ?? '')

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function addExercise(name = '') {
    setExercises(prev => [...prev, { id: uuid(), name, sets: [], note: '' }])
  }
  function updateEx(id, val) {
    setExercises(prev => prev.map(e => e.id === id ? val : e))
  }
  function removeEx(id) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function handleSave() {
    const data = { type: 'strength', date, title, tags, exercises, freeNotes }
    if (existing) updateSession(entry.id, data)
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
            {existing ? 'Edit Workout' : 'Log Workout'}
          </span>
          <button onClick={onClose} style={{ color: C.muted, fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Session Title</label>
          <input className="input" placeholder="e.g. Push day · Skill practice" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAGS.map(t => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  padding: '6px 12px', borderRadius: 8, minHeight: 34,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: tags.includes(t) ? `${C.str}18` : C.card,
                  color: tags.includes(t) ? C.str : C.muted,
                  border: tags.includes(t) ? `1px solid ${C.str}30` : `1px solid ${C.border}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div style={{ marginBottom: 8 }}>
          <label className="label" style={{ marginBottom: 8 }}>Exercises</label>
          {exercises.map(ex => (
            <ExerciseBlock
              key={ex.id}
              ex={ex}
              onChange={val => updateEx(ex.id, val)}
              onRemove={() => removeEx(ex.id)}
            />
          ))}
          <CategoryPicker onAdd={name => addExercise(name)} />
          <button
            onClick={() => addExercise('')}
            style={{
              width: '100%', padding: '10px', borderRadius: 10, minHeight: 44,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: C.dim, background: 'transparent', border: `1px dashed ${C.border}`,
              marginBottom: 4,
            }}
          >
            + Custom Exercise
          </button>
        </div>

        {/* Free notes */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">General Notes</label>
          <textarea
            className="input"
            style={{ resize: 'none', fontSize: 13 }}
            rows={3}
            placeholder="How did it feel? Any wins, misses, or things to remember…"
            value={freeNotes}
            onChange={e => setFreeNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }} disabled={!date}>
            {existing ? 'Update' : 'Log it'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Entry card ────────────────────────────────────────────────────────────────

function ExerciseSummary({ exercises }) {
  if (!exercises?.length) return null
  return (
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {exercises.map(ex => (
        <div key={ex.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: '"Barlow", sans-serif', fontSize: 13, color: '#e2e6ed', fontWeight: 500 }}>
            {ex.name || '—'}
          </span>
          {ex.sets.length > 0 && (
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.dim }}>
              {ex.sets.length}×{ex.sets.map(s => s.reps).filter(Boolean).join('/')}
              {ex.sets.some(s => s.load) ? ` · ${ex.sets.find(s => s.load)?.load}` : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function EntryCard({ entry }) {
  const { deleteSession, toggleComplete } = useTraining()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const hasExercises = entry.exercises?.length > 0
  const hasNotes     = !!entry.freeNotes?.trim()
  const hasMore      = hasExercises || hasNotes

  return (
    <>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        overflow: 'hidden',
        opacity: entry.completed ? 0.55 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 12px' }}>
          {/* Done toggle */}
          <button
            onClick={() => toggleComplete(entry.id)}
            style={{
              marginTop: 2, width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: entry.completed ? C.str : 'transparent',
              border: `2px solid ${entry.completed ? C.str : C.muted}`,
            }}
          >
            {entry.completed && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke={C.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div style={{ flex: 1, minWidth: 0 }} onClick={() => hasMore && setExpanded(e => !e)}>
            {/* Tags */}
            {entry.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                {entry.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '1px 6px', borderRadius: 4,
                    background: `${C.str}15`, border: `1px solid ${C.str}25`, color: C.str,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {entry.title && (
              <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 16, color: '#e2e6ed', marginBottom: 2 }}>
                {entry.title}
              </p>
            )}

            {/* Exercise summary (collapsed = first 2) */}
            {hasExercises && (
              <ExerciseSummary exercises={expanded ? entry.exercises : entry.exercises.slice(0, 2)} />
            )}

            {!hasExercises && entry.freeNotes && (
              <p style={{ fontFamily: '"Barlow", sans-serif', fontSize: 12, color: C.dim, lineHeight: 1.5, marginTop: 3 }}>
                {expanded ? entry.freeNotes : entry.freeNotes.split('\n')[0]}
              </p>
            )}

            {expanded && hasNotes && hasExercises && (
              <p style={{ fontFamily: '"Barlow", sans-serif', fontSize: 12, color: C.dim, lineHeight: 1.5, marginTop: 6 }}>
                {entry.freeNotes}
              </p>
            )}

            {hasMore && (
              <button style={{ marginTop: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {expanded ? '▲ less' : `▼ ${hasExercises && entry.exercises.length > 2 ? `+${entry.exercises.length - 2} more` : 'more'}`}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{ color: C.muted, padding: '4px 6px', fontSize: 14, lineHeight: 1 }}>✎</button>
            <button onClick={() => deleteSession(entry.id)} style={{ color: C.muted, padding: '4px 6px', fontSize: 14, lineHeight: 1 }}>✕</button>
          </div>
        </div>
      </div>
      {editing && <EntryForm entry={entry} onClose={() => setEditing(false)} />}
    </>
  )
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export default function StrengthTab({ selectedDate }) {
  const { strengthSessions } = useTraining()
  const [adding, setAdding] = useState(false)
  const today = todayISO()

  const sessions = (selectedDate
    ? strengthSessions.filter(s => s.date === selectedDate)
    : [...strengthSessions].sort((a, b) => b.date.localeCompare(a.date))
  )

  const byDate = sessions.reduce((acc, s) => {
    acc[s.date] = acc[s.date] ?? []
    acc[s.date].push(s)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', background: C.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px 12px' }}>
        <div>
          <h2 style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Strength
          </h2>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Calisthenics · Gym · Skills
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '8px 16px', borderRadius: 10, minHeight: 44,
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase',
            background: `${C.str}18`, border: `1px solid ${C.str}30`, color: C.str,
          }}
        >
          + Log
        </button>
      </div>

      {/* Entries */}
      <div style={{ padding: '0 16px' }}>
        {Object.keys(byDate).length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontFamily: '"Barlow", sans-serif', fontSize: 14, color: C.muted, marginBottom: 12 }}>
              {selectedDate ? 'No strength sessions on this day' : 'Nothing logged yet'}
            </p>
            <button onClick={() => setAdding(true)} className="btn-secondary" style={{ fontSize: 12, padding: '8px 18px' }}>
              Log your first workout
            </button>
          </div>
        ) : (
          Object.entries(byDate).map(([date, entries]) => (
            <div key={date} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: date === today ? C.str : C.muted,
                }}>
                  {date === today ? 'Today' : format(parseISO(date), 'EEE, MMM d')}
                </span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map(e => <EntryCard key={e.id} entry={e} />)}
              </div>
            </div>
          ))
        )}
      </div>

      {adding && (
        <EntryForm
          prefillDate={selectedDate ?? todayISO()}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
