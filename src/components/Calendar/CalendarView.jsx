import { useState } from 'react'
import { getWeekDays, prevWeek, nextWeek, toISO, formatMonthYear } from '../../utils/date'
import { useTraining } from '../../context/TrainingContext'
import { getPlanByDate } from '../../data/runningPlan'
import { C } from '../../theme'

const PLAN_MAP = getPlanByDate()

const TYPE_DOT = {
  easy:     C.easy,
  tempo:    C.tempo,
  interval: C.interval,
  long:     C.long,
  test:     C.test,
  race:     C.primary,
  strength: C.str,
  optional: C.muted,
}

export default function CalendarView({ onSelectDay, selectedDate }) {
  const [base, setBase] = useState(new Date())
  const days = getWeekDays(base)
  const { sessionsForDate } = useTraining()
  const today = toISO(new Date())

  const firstMonth = formatMonthYear(days[0])
  const lastMonth  = formatMonthYear(days[6])
  const monthLabel = firstMonth === lastMonth
    ? firstMonth
    : `${firstMonth.split(' ')[0]} / ${lastMonth.split(' ')[0]}`

  const isCurrentWeek = days.some(d => toISO(d) === today)

  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      {/* Month + nav */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px 6px', gap: 4 }}>
        <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', flex: 1, letterSpacing: '-0.01em' }}>
          {monthLabel}
        </span>
        {!isCurrentWeek && (
          <button
            onClick={() => setBase(new Date())}
            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.primary, background: `${C.primary}18`, border: `1px solid ${C.primary}40`, borderRadius: 8, padding: '5px 10px', minHeight: 32, marginRight: 4 }}
          >
            Today
          </button>
        )}
        <button onClick={() => setBase(prevWeek(base))} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, borderRadius: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={() => setBase(nextWeek(base))} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, borderRadius: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px' }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, paddingBottom: 2 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 6px 8px', gap: 2 }}>
        {days.map(day => {
          const iso        = toISO(day)
          const isToday    = iso === today
          const isSelected = iso === selectedDate

          const logged = sessionsForDate(iso)
          const plan   = PLAN_MAP.get(iso) ?? []

          const dots = []
          plan.forEach(s => {
            const col = TYPE_DOT[s.type] ?? C.primary
            if (!dots.find(d => d.color === col)) dots.push({ color: col, dim: false })
          })
          logged.forEach(s => {
            const col = s.type === 'strength' ? C.str : (TYPE_DOT[s.sessionType] ?? C.primary)
            if (!dots.find(d => d.color === col)) dots.push({ color: col, dim: s.completed })
          })

          return (
            <button
              key={iso}
              onClick={() => onSelectDay?.(iso)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, minHeight: 56, borderRadius: 12,
                background: isSelected ? `${C.primary}20` : 'transparent',
                outline: isSelected ? `1px solid ${C.primary}50` : 'none',
              }}
            >
              <span style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 15,
                background: isToday ? C.primary : 'transparent',
                color: isToday ? C.bg : isSelected ? C.primary : '#e2e6ed',
              }}>
                {day.getDate()}
              </span>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', minHeight: 6 }}>
                {dots.slice(0, 3).map((dot, i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: dot.color, opacity: dot.dim ? 0.3 : 0.85, flexShrink: 0 }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
