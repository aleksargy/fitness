import { useState } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { SESSION_TYPE_META } from '../../utils/pace'
import { C } from '../../theme'
import SessionForm from './SessionForm'

// Map old orange-based meta to green theme
const TYPE_META = {
  easy:     { label: 'Easy',      color: '#7dd3fc', bg: 'rgba(125,211,252,0.08)', border: 'rgba(125,211,252,0.2)' },
  tempo:    { label: 'Tempo',     color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  interval: { label: 'Intervals', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  long:     { label: 'Long',      color: '#6ee7b7', bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.2)' },
}

export default function SessionCard({ session }) {
  const { toggleComplete, deleteSession } = useTraining()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const meta = TYPE_META[session.sessionType] ?? TYPE_META.easy
  const hasIntervals = session.reps?.length > 0
  const hasNotes     = session.notes?.trim()

  return (
    <>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
        opacity: session.completed ? 0.55 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 12px' }}>
          {/* Complete toggle */}
          <button
            onClick={() => toggleComplete(session.id)}
            style={{
              marginTop: 2, width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: session.completed ? C.primary : 'transparent',
              border: `2px solid ${session.completed ? C.primary : C.muted}`,
            }}
          >
            {session.completed && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke={C.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }} onClick={() => (hasIntervals || hasNotes) && setExpanded(e => !e)}>
            {/* Type badge + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 600,
                padding: '2px 7px', borderRadius: 4,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                flexShrink: 0,
              }}>
                {meta.label}
              </span>
              {session.title && (
                <span style={{
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 15, color: '#e2e6ed',
                  textDecoration: session.completed ? 'line-through' : 'none',
                }}>
                  {session.title}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
              {session.distance  && <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.dim }}>{session.distance}</span>}
              {session.duration  && <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.dim }}>{session.duration}</span>}
              {session.paceRange && <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.dim }}>{session.paceRange}</span>}
            </div>

            {/* Expanded: intervals */}
            {expanded && hasIntervals && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {session.warmup && (
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.muted }}>↑ {session.warmup}</div>
                )}
                {session.reps.map((rep, i) => (
                  <div key={rep.id ?? i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.dim, display: 'flex', gap: 6 }}>
                    <span style={{ color: C.primary }}>{i + 1}.</span>
                    <span>{rep.distance}</span>
                    {rep.pace && <><span style={{ color: C.muted }}>@</span><span>{rep.pace}</span></>}
                    {rep.recovery && <span style={{ color: C.muted }}>· {rep.recovery} rec</span>}
                  </div>
                ))}
                {session.cooldown && (
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.muted }}>↓ {session.cooldown}</div>
                )}
              </div>
            )}

            {/* Expanded: notes */}
            {expanded && hasNotes && (
              <p style={{ marginTop: 6, fontFamily: '"Barlow", sans-serif', fontSize: 12, color: C.dim, lineHeight: 1.55 }}>
                {session.notes}
              </p>
            )}

            {(hasIntervals || hasNotes) && (
              <button style={{ marginTop: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {expanded ? '▲ less' : '▼ more'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{ color: C.muted, padding: '4px 6px', fontSize: 14, lineHeight: 1 }}>✎</button>
            <button onClick={() => deleteSession(session.id)} style={{ color: C.muted, padding: '4px 6px', fontSize: 14, lineHeight: 1 }}>✕</button>
          </div>
        </div>
      </div>

      {editing && <SessionForm session={session} onClose={() => setEditing(false)} />}
    </>
  )
}
