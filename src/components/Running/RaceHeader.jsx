import { useState } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { daysUntil } from '../../utils/date'
import { deriveTrainingPaces, formatPaceRange, secsToStr } from '../../utils/pace'
import { C } from '../../theme'
import RaceForm from './RaceForm'

export default function RaceHeader() {
  const { activeRace } = useTraining()
  const [showPaces, setShowPaces] = useState(false)
  const [editingRace, setEditingRace] = useState(false)

  if (!activeRace) return (
    <div className="card m-4 text-center">
      <p style={{ color: C.dim, fontSize: 13, marginBottom: 10 }}>No race goal set</p>
    </div>
  )

  const days  = daysUntil(activeRace.date)
  const paces = deriveTrainingPaces(activeRace.goalTimeSecs, activeRace.distanceM)

  return (
    <>
      <div style={{ margin: '16px 16px 0', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Goal Race
          </span>
          <button
            onClick={() => setEditingRace(true)}
            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', minHeight: 32, padding: '4px 8px' }}
          >
            edit
          </button>
        </div>

        {/* Race name + countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 32, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {activeRace.name}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.muted, marginTop: 3 }}>
              {activeRace.date}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 44, lineHeight: 1, color: C.primary }}>
              {Math.max(0, days)}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              days away
            </div>
          </div>
        </div>

        {/* Goal time + race pace */}
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px' }}>
          {[
            { label: 'Goal Time',  value: secsToStr(activeRace.goalTimeSecs, true), accent: false },
            { label: 'Race Pace',  value: `${secsToStr(Math.round(activeRace.goalTimeSecs / (activeRace.distanceM / 1000)))} /km`, accent: true },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: C.surface, borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 20, color: s.accent ? C.primary : '#e2e6ed' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Pace zones toggle */}
        <button
          onClick={() => setShowPaces(p => !p)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderTop: `1px solid ${C.border}`,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            minHeight: 42,
          }}
        >
          <span>Training Paces</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: showPaces ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showPaces && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 14px 14px' }}>
            {Object.entries(paces).map(([key, p]) => (
              <div key={key} style={{ background: C.surface, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.label}
                </div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#e2e6ed' }}>
                  {formatPaceRange(p.min, p.max)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingRace && <RaceForm race={activeRace} onClose={() => setEditingRace(false)} />}
    </>
  )
}
