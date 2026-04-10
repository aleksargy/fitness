import { useState } from 'react'
import { TrainingProvider } from './context/TrainingContext'
import CalendarView from './components/Calendar/CalendarView'
import RunningTab from './components/Running/RunningTab'
import StrengthTab from './components/Strength/StrengthTab'
import PlanTab from './components/Running/PlanTab'
import StatsTab from './components/Stats/StatsTab'
import { C } from './theme'

const TABS = [
  { id: 'plan',     label: 'Plan',     accent: C.primary },
  { id: 'running',  label: 'Log',      accent: C.primary },
  { id: 'strength', label: 'Strength', accent: C.str },
  { id: 'stats',    label: 'Stats',    accent: C.primary },
]

function TabIcon({ id, active, accent }) {
  const col = active ? accent : C.muted
  if (id === 'plan') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke={col} strokeWidth="1.5"/>
      <path d="M7 2v4M13 2v4M3 9h14" stroke={col} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 13h2M11 13h2" stroke={col} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'running') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="13" cy="4.5" r="1.5" fill={col}/>
      <path d="M10 8l1.5-2.5 2 1.5 1.5 3.5H13l-1.5 3-3-1.5" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 11.5l1.5 1 .5 3.5M11.5 13l1 3" stroke={col} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'strength') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="8.5" width="3" height="3" rx="1" fill={col}/>
      <rect x="16" y="8.5" width="3" height="3" rx="1" fill={col}/>
      <rect x="4" y="7" width="2.5" height="6" rx="1" fill={col}/>
      <rect x="13.5" y="7" width="2.5" height="6" rx="1" fill={col}/>
      <rect x="6.5" y="9" width="7" height="2" rx="1" fill={col}/>
    </svg>
  )
  if (id === 'stats') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 15l4-5 3 3 3.5-5 3.5 3" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 17h14" stroke={col} strokeWidth="1.25" strokeLinecap="round"/>
      <circle cx="7" cy="10" r="1.5" fill={col}/>
      <circle cx="10" cy="13" r="1.5" fill={col}/>
      <circle cx="13.5" cy="8" r="1.5" fill={col}/>
    </svg>
  )
  return null
}

function AppShell() {
  const [activeTab,    setActiveTab]    = useState('plan')
  const [selectedDate, setSelectedDate] = useState(null)

  const showCalendar = activeTab === 'running' || activeTab === 'strength'
  const activeAccent = TABS.find(t => t.id === activeTab)?.accent ?? C.primary

  function handleSelectDay(iso) {
    setSelectedDate(prev => prev === iso ? null : iso)
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: C.bg }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 flex-shrink-0" style={{ paddingTop: 12, paddingBottom: 8 }}>
        <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 900, fontSize: 24, color: '#fff', letterSpacing: '-0.02em' }}>
          Train<span style={{ color: activeAccent }}>Log</span>
        </span>
        {selectedDate && showCalendar && (
          <button
            onClick={() => setSelectedDate(null)}
            style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.dim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', minHeight: 36 }}
          >
            ✕ clear
          </button>
        )}
      </header>

      {/* Calendar */}
      {showCalendar && (
        <div className="flex-shrink-0">
          <CalendarView onSelectDay={handleSelectDay} selectedDate={selectedDate}/>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'plan'     && <PlanTab />}
        {activeTab === 'running'  && <RunningTab  selectedDate={selectedDate}/>}
        {activeTab === 'strength' && <StrengthTab selectedDate={selectedDate}/>}
        {activeTab === 'stats'    && <StatsTab />}
      </div>

      {/* Bottom nav — 4 tabs */}
      <nav
        className="flex-shrink-0 flex items-stretch relative"
        style={{ background: C.surface, borderTop: `1px solid ${C.border}`, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(t => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); if (!showCalendar) setSelectedDate(null) }}
              className="flex-1 flex flex-col items-center justify-center gap-1"
              style={{ paddingTop: 9, paddingBottom: 9, minHeight: 54 }}
            >
              <TabIcon id={t.id} active={active} accent={t.accent}/>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? t.accent : C.muted }}>
                {t.label}
              </span>
            </button>
          )
        })}
        {/* Active indicator */}
        <div
          className="absolute top-0 h-0.5 transition-all duration-200"
          style={{
            width: `${100 / TABS.length}%`,
            left: `${(TABS.findIndex(t => t.id === activeTab) / TABS.length) * 100}%`,
            background: activeAccent,
          }}
        />
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <TrainingProvider>
      <AppShell />
    </TrainingProvider>
  )
}
