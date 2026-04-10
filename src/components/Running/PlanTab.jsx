import { useState } from 'react'
import { PLAN_WEEKS, PHASES, PLAN_TYPE_META } from '../../data/runningPlan'
import { C } from '../../theme'
import SessionForm from './SessionForm'

const BADGE_STYLE = {
  cutback: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', label: '↓ Cutback' },
  test:    { bg: 'rgba(251,191,36,0.1)',   color: '#fbbf24', label: '⏱ Test'    },
  taper:   { bg: 'rgba(240,242,245,0.08)', color: '#b0b8c8', label: '↓ Taper'  },
  race:    { bg: 'rgba(240,242,245,0.1)',  color: '#f0f2f5', label: '🏆 Race'   },
}

const PHASE_STYLE = {
  base:     { color: '#818cf8' },
  build:    { color: '#38bdf8' },
  specific: { color: '#34d399' },
  taper:    { color: '#f87171' },
}

// Map plan session type → SessionForm sessionType
const TYPE_TO_SESSION = {
  easy:     'easy',
  tempo:    'tempo',
  interval: 'interval',
  long:     'long',
  test:     'interval',
  race:     'interval',
  optional: 'easy',
}

function SessionRow({ s, weekDates, onLog }) {
  const meta = PLAN_TYPE_META[s.type] ?? PLAN_TYPE_META.easy

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 0',
      borderBottom: `1px solid ${C.border}`,
    }}>
      {/* Type badge + content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 600,
            padding: '2px 7px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
            flexShrink: 0,
          }}>
            {meta.label}
          </span>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 15, color: '#e2e6ed' }}>
            {s.name}
          </span>
        </div>
        <p style={{ fontFamily: '"Barlow", sans-serif', fontSize: 12, color: C.dim, lineHeight: 1.55, fontWeight: 300 }}>
          {s.detail}
        </p>
      </div>

      {/* Quick-log button */}
      <button
        onClick={() => onLog(s)}
        style={{
          flexShrink: 0, marginTop: 2,
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8,
          background: `${C.primary}15`,
          border: `1px solid ${C.primary}30`,
          color: C.primary,
        }}
        title="Log this session"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function WeekBlock({ wk, defaultOpen, onLog }) {
  const [open, setOpen] = useState(defaultOpen)
  const phase = PHASE_STYLE[wk.phase]
  const badge = wk.badge ? BADGE_STYLE[wk.badge] : null

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 14px', background: C.surface, textAlign: 'left', minHeight: 52,
        }}
      >
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700, color: C.muted, minWidth: 28, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
          W{String(wk.week).padStart(2, '0')}
        </span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: phase.color, flexShrink: 0 }} />
        <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 16, color: '#e2e6ed', flex: 1, letterSpacing: '0.01em' }}>
          {wk.label}
        </span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, flexShrink: 0, marginRight: 4 }}>
          {wk.dates}
        </span>
        {badge && (
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: badge.bg, color: badge.color, flexShrink: 0 }}>
            {badge.label}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: C.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', background: C.bg }}>
          {/* Session count hint */}
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, padding: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {wk.sessions.filter(s => s.type !== 'optional').length} sessions
            {wk.sessions.some(s => s.type === 'optional') ? ' + 1 optional' : ''}
          </div>
          {wk.sessions.map((s, i) => (
            <SessionRow key={i} s={s} weekDates={wk.dates} onLog={onLog} />
          ))}
          {wk.note && (
            <div style={{
              marginTop: 12, background: `${C.primary}08`,
              borderLeft: `2px solid ${C.primary}40`,
              borderRadius: '0 8px 8px 0',
              padding: '10px 12px', fontSize: 12, color: C.dim, lineHeight: 1.6,
              fontFamily: '"Barlow", sans-serif', fontWeight: 300,
            }}>
              <span style={{ color: C.primary, fontWeight: 600 }}>Note: </span>
              {wk.note}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getCurrentWeek() {
  const today = new Date()
  const start = new Date('2026-04-09T00:00:00')
  const diff  = Math.floor((today - start) / (7 * 24 * 3600 * 1000))
  return Math.max(1, Math.min(15, diff + 1))
}

const PACES = [
  { name: 'Easy',      pace: '5:10–5:30', color: '#7dd3fc' },
  { name: 'Steady',    pace: '4:40–4:50', color: '#94a3b8' },
  { name: 'Tempo',     pace: '4:10–4:20', color: '#fbbf24' },
  { name: 'Race 10K',  pace: '4:00',      color: '#f0f2f5' },
  { name: 'Intervals', pace: '3:45–3:55', color: '#f87171' },
]

export default function PlanTab() {
  const currentWeek = getCurrentWeek()
  const [filter, setFilter]     = useState('all')
  const [showPaces, setShowPaces] = useState(false)
  const [logging, setLogging]   = useState(null) // { sessionType, title, detail }

  const filteredWeeks = PLAN_WEEKS.filter(wk => {
    if (filter === 'upcoming') return wk.week >= currentWeek
    if (filter === 'done')     return wk.week <  currentWeek
    return true
  })

  function handleLog(s) {
    setLogging({
      sessionType: TYPE_TO_SESSION[s.type] ?? 'easy',
      title: s.name,
      notes: s.detail,
    })
  }

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', background: C.bg, WebkitOverflowScrolling: 'touch' }}>
        {/* Hero */}
        <div style={{
          padding: '18px 16px 16px', position: 'relative', overflow: 'hidden',
          borderBottom: `1px solid ${C.border}`,
          background: `linear-gradient(160deg, ${C.bg} 0%, #0a120b 50%, ${C.bg} 100%)`,
        }}>
          <div aria-hidden style={{
            position: 'absolute', right: -8, top: -10,
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 96, lineHeight: 1,
            color: `${C.primary}08`, pointerEvents: 'none', userSelect: 'none',
          }}>
            40:00
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.primary, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            10K Plan · Alex
          </div>
          <div style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 36, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Sub-<span style={{ color: C.primary }}>40:00</span>
          </div>
          <div style={{ fontFamily: '"Barlow", sans-serif', fontSize: 12, color: C.dim, fontWeight: 300, marginBottom: 14 }}>
            Apr 9 → Jul 19, 2026 · 15 weeks
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Target',    value: '39:59',          accent: true },
              { label: 'Goal Pace', value: '4:00 /km',       accent: false },
              { label: 'Week',      value: `${currentWeek} of 15`, accent: false },
              { label: 'Improve',   value: '~5 min',         accent: false },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 20, color: s.accent ? C.primary : '#e2e6ed' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phases */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(PHASES).map(([key, p]) => (
              <div key={key} style={{ borderRadius: 10, padding: '10px 12px', background: `${PHASE_STYLE[key].color}15`, border: `1px solid ${PHASE_STYLE[key].color}35` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: PHASE_STYLE[key].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: PHASE_STYLE[key].color }}>
                    {p.label}
                  </span>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Wks {p.weeks}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paces — collapsible */}
        <div style={{ padding: '0 16px 4px' }}>
          <button
            onClick={() => setShowPaces(p => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', minHeight: 44,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted,
              textTransform: 'uppercase', letterSpacing: '0.15em',
              borderBottom: showPaces ? 'none' : `1px solid ${C.border}`,
            }}
          >
            <span>Training Paces</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: showPaces ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showPaces && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              {PACES.map(p => (
                <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontFamily: '"Barlow", sans-serif', fontSize: 10, color: C.muted, marginBottom: 2, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 600, color: p.color }}>{p.pace}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px' }}>
          {[['all','All'],['upcoming','Upcoming'],['done','Done']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '7px 14px', minHeight: 36, borderRadius: 8,
                fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                background: filter === val ? `${C.primary}15` : 'transparent',
                color: filter === val ? C.primary : C.muted,
                border: filter === val ? `1px solid ${C.primary}35` : `1px solid transparent`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ padding: '0 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
          {filteredWeeks.map(wk => (
            <WeekBlock
              key={wk.week}
              wk={wk}
              defaultOpen={wk.week === currentWeek}
              onLog={handleLog}
            />
          ))}
        </div>
      </div>

      {/* Quick-log modal */}
      {logging && (
        <SessionForm
          prefillDate={new Date().toISOString().slice(0, 10)}
          prefill={logging}
          onClose={() => setLogging(null)}
        />
      )}
    </>
  )
}
