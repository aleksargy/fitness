import { useState, useMemo } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { C } from '../../theme'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function parseNum(v)  { const n = parseFloat(v); return isNaN(n) ? 0 : n }
function parseKm(v)   { return parseNum(v) }   // "8 km" → parseFloat → 8

function getMonday(date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}
function addDays(d, n)  { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function toISO(d)       { return d.toISOString().slice(0, 10) }
function shortDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth()+1}/${d.getDate()}`
}
// Brzycki estimated 1RM
function est1RM(reps, load) {
  if (!load || !reps || reps <= 0) return 0
  if (reps === 1) return load
  return Math.round(load / (1.0278 - 0.0278 * reps))
}

// ─── Chart primitives ─────────────────────────────────────────────────────────

function Sparkline({ values, color, height = 52, id = 'sp' }) {
  if (!values || values.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.muted }}>
        log more sessions for a trend
      </span>
    </div>
  )
  const W = 300, H = height
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - 4 - ((v - min) / range) * (H - 10),
  ])
  const line = `M ${pts.map(([x,y]) => `${x} ${y}`).join(' L ')}`
  const area = `M 0 ${H} L ${pts.map(([x,y]) => `${x} ${y}`).join(' L ')} L ${W} ${H} Z`
  const gid  = `sg-${id}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4" fill={color}/>
    </svg>
  )
}

function Bars({ values, labels, color, height = 64 }) {
  const max = Math.max(...values, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: height + 18 }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0',
            background: v > 0 ? color : C.border,
            opacity: v > 0 ? 0.8 : 0.25,
            minHeight: v > 0 ? 3 : 1,
            height: Math.max(v > 0 ? 3 : 1, (v / max) * height),
          }}/>
          {labels?.[i] !== undefined && (
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 7, color: C.muted, lineHeight: 1 }}>
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function RadarChart({ values, labels, color }) {
  const n = values.length
  const max = Math.max(...values, 1)
  const cx = 70, cy = 70, r = 48
  const angle = i => (i / n) * 2 * Math.PI - Math.PI / 2
  const pt    = (i, mag) => [cx + mag * Math.cos(angle(i)), cy + mag * Math.sin(angle(i))]

  const bgPoly   = Array.from({length:n},(_,i) => pt(i, r).join(',')).join(' ')
  const midPoly  = Array.from({length:n},(_,i) => pt(i, r*0.5).join(',')).join(' ')
  const dataPoly = values.map((v,i) => pt(i, (v/max)*r).join(',')).join(' ')

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <polygon points={bgPoly}  fill="none" stroke={C.border} strokeWidth="1"/>
      <polygon points={midPoly} fill="none" stroke={C.border} strokeWidth="1" strokeDasharray="2,3"/>
      {Array.from({length:n},(_,i) => {
        const [x,y] = pt(i,r)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.border} strokeWidth="1"/>
      })}
      <polygon points={dataPoly} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5"/>
      {values.map((v,i) => {
        const [x,y] = pt(i,(v/max)*r)
        return <circle key={i} cx={x} cy={y} r="3" fill={color}/>
      })}
      {labels.map((lbl,i) => {
        const [x,y] = pt(i, r + 15)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill={C.dim} fontFamily="JetBrains Mono,monospace">
            {lbl}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Activity heatmap (15 weeks × 7 days) ────────────────────────────────────

function Heatmap({ sessions }) {
  const WEEKS = 15
  const today = new Date(); today.setHours(0,0,0,0)
  const todayISO = toISO(today)
  const start = getMonday(today)
  start.setDate(start.getDate() - (WEEKS - 1) * 7)

  const actMap = new Map()
  sessions.forEach(s => actMap.set(s.date, (actMap.get(s.date) ?? 0) + 1))

  const weeks = Array.from({length: WEEKS}, (_, w) =>
    Array.from({length: 7}, (_, d) => {
      const date = addDays(start, w * 7 + d)
      const iso  = toISO(date)
      return { iso, count: actMap.get(iso) ?? 0, isToday: iso === todayISO, future: date > today }
    })
  )

  // Month labels
  const monthLabels = []
  let lastM = -1
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].iso + 'T00:00:00').getMonth()
    if (m !== lastM) {
      monthLabels[wi] = new Date(week[0].iso + 'T00:00:00').toLocaleString('default',{month:'short'})
      lastM = m
    }
  })

  function cellBg(cell) {
    if (cell.future)        return C.border
    if (cell.count === 0)   return cell.isToday ? `${C.primary}20` : `${C.border}80`
    if (cell.count === 1)   return `${C.primary}50`
    if (cell.count === 2)   return `${C.primary}80`
    return C.primary
  }

  return (
    <div>
      {/* Month row */}
      <div style={{ display: 'flex', marginBottom: 3 }}>
        {weeks.map((_, wi) => (
          <div key={wi} style={{ flex: 1 }}>
            {monthLabels[wi] && (
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: C.muted }}>
                {monthLabels[wi]}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Day rows */}
      {[0,1,2,3,4,5,6].map(di => (
        <div key={di} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
          {weeks.map((week, wi) => {
            const cell = week[di]
            return (
              <div key={wi} title={`${cell.iso}: ${cell.count} session(s)`} style={{
                flex: 1, aspectRatio: '1', borderRadius: 3,
                background: cellBg(cell),
                border: cell.isToday ? `1px solid ${C.primary}` : '1px solid transparent',
              }}/>
            )
          })}
        </div>
      ))}
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 6 }}>
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: C.muted }}>less</span>
        {[`${C.border}80`, `${C.primary}50`, `${C.primary}80`, C.primary].map((c,i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }}/>
        ))}
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: C.muted }}>more</span>
      </div>
    </div>
  )
}

// ─── Exercise spotlight ───────────────────────────────────────────────────────

function ExerciseSpotlight({ exerciseStats }) {
  const [selected, setSelected] = useState(exerciseStats[0]?.name ?? '')
  const [query, setQuery]       = useState('')
  const [showList, setShowList] = useState(false)

  const filtered = exerciseStats.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase())
  )
  const ex = exerciseStats.find(e => e.name === selected)

  const sparkVals = ex?.entries
    .slice().sort((a,b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map(e => e.totalReps > 0 ? e.totalReps : e.volume) ?? []

  // Volume trend: (last 3 sessions avg) vs (prev 3 sessions avg)
  const trend = (() => {
    if (!ex || ex.entries.length < 4) return null
    const sorted = ex.entries.slice().sort((a,b) => a.date.localeCompare(b.date))
    const last3 = sorted.slice(-3).reduce((s,e) => s + e.totalReps, 0) / 3
    const prev3 = sorted.slice(-6,-3).reduce((s,e) => s + e.totalReps, 0) / 3
    if (!prev3) return null
    const pct = Math.round(((last3 - prev3) / prev3) * 100)
    return pct
  })()

  const maxE1RM = ex
    ? Math.max(0, ...ex.entries.flatMap(e => e.sets.map(s => est1RM(s.reps, s.load))))
    : 0

  return (
    <div>
      {/* Selector */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#e2e6ed',
            fontFamily: '"Barlow",sans-serif', minHeight: 44,
          }}
          placeholder="Search exercise…"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowList(true) }}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 150)}
        />
        {showList && (filtered.length > 0 || query) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            marginTop: 3, maxHeight: 200, overflowY: 'auto',
          }}>
            {filtered.length === 0
              ? <div style={{ padding: '12px', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: C.muted, textAlign: 'center' }}>No match</div>
              : filtered.slice(0,10).map(e => (
                <button
                  key={e.name}
                  onMouseDown={() => { setSelected(e.name); setQuery(''); setShowList(false) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    fontFamily: '"Barlow",sans-serif', fontSize: 13, color: '#e2e6ed',
                    borderBottom: `1px solid ${C.border}`,
                    background: e.name === selected ? `${C.primary}10` : 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>{e.name}</span>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: C.muted }}>{e.sessions} sess.</span>
                </button>
              ))
            }
          </div>
        )}
      </div>

      {!ex && (
        <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: C.muted }}>
          Select an exercise above
        </div>
      )}

      {ex && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Exercise header */}
          <div style={{ padding: '13px 14px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 700, fontSize: 20, color: '#e2e6ed' }}>
                {ex.name}
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: C.muted, marginTop: 2 }}>
                last: {ex.lastDate}
              </div>
            </div>
            {trend !== null && (
              <div style={{
                padding: '4px 10px', borderRadius: 8,
                background: trend >= 0 ? `${C.primary}15` : 'rgba(248,113,113,0.12)',
                border: `1px solid ${trend >= 0 ? `${C.primary}30` : 'rgba(248,113,113,0.25)'}`,
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 700, fontSize: 18, color: trend >= 0 ? C.primary : C.interval }}>
                  {trend > 0 ? '+' : ''}{trend}%
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  trend
                </div>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${C.border}` }}>
            {[
              { label: 'Sessions',   value: ex.sessions },
              { label: 'Total Reps', value: ex.totalReps.toLocaleString() },
              { label: 'Best Set',   value: `${ex.prReps}r` },
              { label: maxE1RM > 0 ? 'Est. 1RM' : 'Best Load',
                value: maxE1RM > 0 ? `${maxE1RM}kg` : ex.prLoad > 0 ? `${ex.prLoad}kg` : '—' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '10px 6px', textAlign: 'center',
                borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 700, fontSize: 18, color: C.primary }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Reps per session · last {Math.min(sparkVals.length, 12)}
            </div>
            <Sparkline values={sparkVals} color={C.primary} id={ex.name.replace(/\W/g,'')} height={52}/>
          </div>

          {/* Session log */}
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              History
            </div>
            {ex.entries.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0,6).map((e, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
                borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : 'none',
              }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: C.muted, minWidth: 72 }}>
                  {e.date}
                </span>
                <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {e.sets.map((s, j) => (
                    <span key={j} style={{
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#e2e6ed',
                      background: C.surface, borderRadius: 5, padding: '2px 7px',
                    }}>
                      {s.reps > 0 ? s.reps : '—'}{s.load > 0 ? `×${s.load}` : ''}
                    </span>
                  ))}
                  {e.sets.length === 0 && (
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: C.muted }}>no sets logged</span>
                  )}
                </div>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: C.primary, fontWeight: 600 }}>
                  {e.totalReps > 0 ? `${e.totalReps}r` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Label helper ─────────────────────────────────────────────────────────────

function Label({ children, mt = 20 }) {
  return (
    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: mt, marginBottom: 8 }}>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StatsTab() {
  const { sessions } = useTraining()
  const [section, setSection] = useState('strength')

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const todayISO = toISO(today)

  const S = useMemo(() => {
    const strength = sessions.filter(s => s.type === 'strength')
    const running  = sessions.filter(s => s.type === 'running')

    // ── Streak ──────────────────────────────────────────────────────────────
    const dateSet = new Set(sessions.map(s => s.date))
    let streak = 0
    const d = new Date(today)
    while (dateSet.has(toISO(d))) { streak++; d.setDate(d.getDate() - 1) }

    const sortedDates = [...dateSet].sort()
    let longest = 0, cur = 0, prev = null
    sortedDates.forEach(iso => {
      const dt = new Date(iso + 'T00:00:00')
      if (prev && (dt - prev) / 86400000 === 1) cur++; else cur = 1
      longest = Math.max(longest, cur)
      prev = dt
    })

    // ── Last 8 weeks ─────────────────────────────────────────────────────────
    const monday = getMonday(today)
    const weekStarts = Array.from({length: 8}, (_, i) => {
      const m = new Date(monday); m.setDate(m.getDate() - (7 - i) * 7); return toISO(m)
    })
    const weekEnd = (iso) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate()+7); return toISO(d) }
    const weekLabels       = weekStarts.map(shortDate)
    const weekStrength     = weekStarts.map(w => strength.filter(s => s.date >= w && s.date < weekEnd(w)).length)
    const weekRunKm        = weekStarts.map(w => running.filter(s => s.date >= w && s.date < weekEnd(w)).reduce((a,s) => a + parseKm(s.distance), 0))
    const weekAllSessions  = weekStarts.map(w => sessions.filter(s => s.date >= w && s.date < weekEnd(w)).length)

    // This week
    const thisWeekStart = toISO(monday)
    const thisWeekEnd   = weekEnd(thisWeekStart)
    const thisWeekKm    = running.filter(s => s.date >= thisWeekStart && s.date < thisWeekEnd).reduce((a,s) => a + parseKm(s.distance), 0)
    const thisWeekSess  = sessions.filter(s => s.date >= thisWeekStart && s.date < thisWeekEnd).length

    // ── Exercise map ─────────────────────────────────────────────────────────
    const exMap = new Map()
    strength.forEach(sess => {
      ;(sess.exercises ?? []).forEach(ex => {
        const name = ex.name?.trim()
        if (!name) return
        if (!exMap.has(name)) exMap.set(name, [])
        const sets = (ex.sets ?? [])
          .map(s => ({ reps: parseNum(s.reps), load: parseNum(s.load), note: s.note ?? '' }))
          .filter(s => s.reps > 0 || s.load > 0)
        exMap.get(name).push({
          date:      sess.date,
          sets,
          totalReps: sets.reduce((a,s) => a + s.reps, 0),
          volume:    sets.reduce((a,s) => a + s.reps * (s.load || 1), 0),
          maxLoad:   sets.length ? Math.max(0, ...sets.map(s=>s.load)) : 0,
          maxReps:   sets.length ? Math.max(0, ...sets.map(s=>s.reps)) : 0,
        })
      })
    })
    const exerciseStats = Array.from(exMap.entries()).map(([name, entries]) => {
      const sorted = entries.slice().sort((a,b) => a.date.localeCompare(b.date))
      return {
        name, sessions: entries.length, entries: sorted,
        totalReps:   entries.reduce((a,e) => a + e.totalReps, 0),
        totalVolume: entries.reduce((a,e) => a + e.volume, 0),
        prReps:      Math.max(0, ...entries.map(e=>e.maxReps)),
        prLoad:      Math.max(0, ...entries.map(e=>e.maxLoad)),
        lastDate:    sorted[sorted.length-1]?.date ?? '—',
      }
    }).sort((a,b) => b.sessions - a.sessions)

    // ── Lifetime totals ──────────────────────────────────────────────────────
    const lifetimeReps = exerciseStats.reduce((a,e) => a + e.totalReps, 0)
    const lifetimeKm   = running.reduce((a,s) => a + parseKm(s.distance), 0)
    const lifetimeSets = strength.reduce((a,sess) => a + (sess.exercises??[]).reduce((b,ex) => b + (ex.sets??[]).length, 0), 0)

    // ── Muscle balance ────────────────────────────────────────────────────────
    const MUSCLES = {
      Push: ['Push-ups','Dips','Pike Push-ups','HSPU','Bench Press','OHP'],
      Pull: ['Pull-ups','Chin-ups','Muscle-ups','Rows','Face Pulls'],
      Core: ['L-sit','Hollow Body','Ab Wheel','Hanging Leg Raises','Dragon Flag','Planche Lean'],
      Legs: ['Pistol Squat','Bulgarian Split Squat','Nordic Curls','Calf Raises','Box Jump'],
      Skill:['Handstand','Freestanding HS','Planche','Front Lever','Back Lever','Human Flag'],
    }
    const muscleScores = Object.entries(MUSCLES).map(([group, names]) => ({
      group,
      total: names.reduce((a, n) => a + (exerciseStats.find(e => e.name.toLowerCase() === n.toLowerCase())?.sessions ?? 0), 0),
    }))

    // ── Running breakdown ────────────────────────────────────────────────────
    const runTypes = { easy:0, tempo:0, interval:0, long:0 }
    running.forEach(s => { const t = s.sessionType??'easy'; if(t in runTypes) runTypes[t]++ })
    const longestRun = Math.max(0, ...running.map(s => parseKm(s.distance)))
    const fastestPace = (() => {
      // Find sessions with both distance and duration parseable as minutes
      let best = Infinity
      running.forEach(s => {
        const km  = parseKm(s.distance)
        const dur = parseNum(s.duration) // assumes minutes for now
        if (km > 0 && dur > 0) {
          const pace = dur / km
          if (pace < best) best = pace
        }
      })
      return best === Infinity ? null : best
    })()

    return {
      strength, running,
      streak, longest,
      thisWeekKm, thisWeekSess,
      weekStarts, weekLabels,
      weekStrength, weekRunKm, weekAllSessions,
      exerciseStats, lifetimeReps, lifetimeKm, lifetimeSets,
      muscleScores, runTypes, longestRun, fastestPace,
      totalSessions: sessions.length,
    }
  }, [sessions, today])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, overflowY:'auto', background: C.bg, WebkitOverflowScrolling:'touch', paddingBottom:'calc(env(safe-area-inset-bottom) + 24px)' }}>

      {/* Header */}
      <div style={{ padding:'18px 16px 12px' }}>
        <h2 style={{ fontFamily:'"Barlow Condensed",sans-serif', fontWeight:900, fontSize:28, color:'#fff', letterSpacing:'-0.01em', lineHeight:1 }}>
          Stats
        </h2>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:C.muted, marginTop:3, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          {S.totalSessions} sessions logged
        </p>
      </div>

      {/* ── Overview cards ── */}
      <div style={{ padding:'0 16px 4px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { label:'Streak',       value:`${S.streak}d`,                  sub:`best ${S.longest}d`,         color:C.primary },
          { label:'This Week',    value:S.thisWeekSess,                  sub:'sessions',                    color:C.str },
          { label:'Lifetime Reps',value:S.lifetimeReps.toLocaleString(), sub:`${S.lifetimeSets} sets total`,color:C.primary },
          { label:'Total km',     value:`${Math.round(S.lifetimeKm)}`,   sub:`${S.running.length} runs`,    color:C.str },
        ].map(card => (
          <div key={card.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px' }}>
            <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>
              {card.label}
            </div>
            <div style={{ fontFamily:'"Barlow Condensed",sans-serif', fontWeight:900, fontSize:30, color:card.color, lineHeight:1, letterSpacing:'-0.02em' }}>
              {card.value}
            </div>
            <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:C.muted, marginTop:3 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Weekly overview bars ── */}
      <div style={{ padding:'0 16px' }}>
        <Label mt={16}>Sessions / week · last 8</Label>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px' }}>
          <Bars values={S.weekAllSessions} labels={S.weekLabels} color={C.primary} height={52}/>
        </div>
      </div>

      {/* ── Activity heatmap ── */}
      <div style={{ padding:'0 16px' }}>
        <Label mt={16}>Activity — 15 weeks</Label>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 12px' }}>
          <Heatmap sessions={sessions}/>
        </div>
      </div>

      {/* ── Section toggle ── */}
      <div style={{ display:'flex', margin:'16px 16px 0', background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:4, gap:4 }}>
        {[['strength','Strength'],['running','Running']].map(([id,label]) => {
          const active = section === id
          const col = id === 'strength' ? C.str : C.primary
          return (
            <button key={id} onClick={() => setSection(id)} style={{
              flex:1, padding:'9px', borderRadius:8, minHeight:38,
              fontFamily:'"Barlow Condensed",sans-serif', fontWeight:700, fontSize:15,
              textTransform:'uppercase', letterSpacing:'0.05em',
              background: active ? `${col}18` : 'transparent',
              color: active ? col : C.muted,
              border: active ? `1px solid ${col}35` : '1px solid transparent',
              transition:'all 0.15s',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* ── STRENGTH ── */}
      {section === 'strength' && (
        <div style={{ padding:'0 16px' }}>
          {S.exerciseStats.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', fontFamily:'"JetBrains Mono",monospace', fontSize:11, color:C.muted }}>
              Log strength sessions to see progress
            </div>
          ) : (
            <>
              {/* Exercise progress */}
              <Label>Exercise Progress</Label>
              <ExerciseSpotlight exerciseStats={S.exerciseStats}/>

              {/* Muscle balance */}
              <Label mt={20}>Muscle Balance</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px', display:'flex', alignItems:'center', gap:8 }}>
                <RadarChart
                  values={S.muscleScores.map(s=>s.total)}
                  labels={S.muscleScores.map(s=>s.group)}
                  color={C.str}
                />
                <div style={{ flex:1 }}>
                  {S.muscleScores.slice().sort((a,b)=>b.total-a.total).map(s => {
                    const maxTotal = Math.max(...S.muscleScores.map(m=>m.total), 1)
                    return (
                      <div key={s.group} style={{ marginBottom:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontFamily:'"Barlow Condensed",sans-serif', fontWeight:700, fontSize:13, color:'#e2e6ed' }}>{s.group}</span>
                          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:C.muted }}>{s.total}</span>
                        </div>
                        <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:2, background:`linear-gradient(90deg,${C.str},${C.primary})`, width:`${(s.total/maxTotal)*100}%` }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Strength sessions/week */}
              <Label mt={20}>Strength sessions / week</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px' }}>
                <Bars values={S.weekStrength} labels={S.weekLabels} color={C.str} height={56}/>
              </div>

              {/* PRs board */}
              <Label mt={20}>Personal Records</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
                {S.exerciseStats.filter(e=>e.prReps>0||e.prLoad>0).slice(0,12).map((ex,i,arr) => {
                  const maxE1RM = Math.max(0,...ex.entries.flatMap(e=>e.sets.map(s=>est1RM(s.reps,s.load))))
                  return (
                    <div key={ex.name} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:C.muted, minWidth:20, textAlign:'right' }}>
                        {i+1}
                      </span>
                      <span style={{ fontFamily:'"Barlow",sans-serif', fontWeight:500, fontSize:14, color:'#e2e6ed', flex:1 }}>
                        {ex.name}
                      </span>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:13, fontWeight:600, color:C.primary }}>
                          {ex.prReps > 0 ? `${ex.prReps}r` : '—'}{ex.prLoad > 0 ? ` @ ${ex.prLoad}kg` : ''}
                        </div>
                        {maxE1RM > 0 && (
                          <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:C.muted }}>
                            1RM ~{maxE1RM}kg
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Top exercises by total reps */}
              <Label mt={20}>Top Exercises by Volume</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px' }}>
                {S.exerciseStats.slice(0,8).map((ex,i,arr) => {
                  const maxReps = Math.max(...arr.map(e=>e.totalReps),1)
                  return (
                    <div key={ex.name} style={{ marginBottom: i<arr.length-1 ? 12 : 0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontFamily:'"Barlow",sans-serif', fontSize:13, color:'#e2e6ed', fontWeight:500 }}>
                          {ex.name}
                        </span>
                        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:C.dim }}>
                          {ex.totalReps.toLocaleString()}r · {ex.sessions}×
                        </span>
                      </div>
                      <div style={{ height:5, background:C.border, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.str},${C.primary})`, width:`${(ex.totalReps/maxReps)*100}%` }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── RUNNING ── */}
      {section === 'running' && (
        <div style={{ padding:'0 16px' }}>
          {S.running.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', fontFamily:'"JetBrains Mono",monospace', fontSize:11, color:C.muted }}>
              Log runs to see stats
            </div>
          ) : (
            <>
              {/* Weekly km */}
              <Label>km / week · last 8</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px' }}>
                <Bars values={S.weekRunKm.map(v=>parseFloat(v.toFixed(1)))} labels={S.weekLabels} color={C.primary} height={64}/>
              </div>

              {/* Running stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
                {[
                  { label:'Total Runs',   value:S.running.length,                                        color:C.primary },
                  { label:'This Week',    value:`${S.thisWeekKm.toFixed(1)}km`,                          color:C.primary },
                  { label:'Longest Run',  value:`${S.longestRun.toFixed(1)}km`,                          color:C.str },
                  { label:'Avg Distance', value:`${(S.lifetimeKm/(S.running.length||1)).toFixed(1)}km`,  color:C.str },
                ].map(s => (
                  <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily:'"Barlow Condensed",sans-serif', fontWeight:700, fontSize:26, color:s.color, lineHeight:1 }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Session type breakdown */}
              <Label mt={20}>By Session Type</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px' }}>
                {(() => {
                  const typeColors = { easy:C.easy, tempo:'#fbbf24', interval:C.interval, long:'#6ee7b7' }
                  const total = Object.values(S.runTypes).reduce((a,b)=>a+b,0)||1
                  return Object.entries(S.runTypes).filter(([,c])=>c>0).map(([type,count]) => {
                    const pct = Math.round((count/total)*100)
                    return (
                      <div key={type} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontFamily:'"Barlow Condensed",sans-serif', fontWeight:700, fontSize:14, textTransform:'uppercase', color:typeColors[type] }}>
                            {type}
                          </span>
                          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:11, color:C.dim }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div style={{ height:6, background:C.border, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:3, background:typeColors[type], width:`${pct}%`, opacity:0.8 }}/>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Recent runs list */}
              <Label mt={20}>Recent Runs</Label>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:8 }}>
                {S.running.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map((s,i,arr) => {
                  const km  = parseKm(s.distance)
                  const col = { easy:C.easy, tempo:'#fbbf24', interval:C.interval, long:'#6ee7b7' }[s.sessionType] ?? C.primary
                  return (
                    <div key={s.id??i} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                      borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:col, flexShrink:0 }}/>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:C.muted, minWidth:70 }}>{s.date}</span>
                      <span style={{ fontFamily:'"Barlow",sans-serif', fontSize:13, color:'#e2e6ed', flex:1, fontWeight:500 }}>
                        {s.title || (s.sessionType ? s.sessionType[0].toUpperCase()+s.sessionType.slice(1)+' run' : 'Run')}
                      </span>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:12, color:col }}>
                        {km > 0 ? `${km}km` : s.duration ?? '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
