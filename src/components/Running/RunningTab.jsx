import { useState } from 'react'
import { useTraining } from '../../context/TrainingContext'
import { todayISO, toISO, getWeekDays } from '../../utils/date'
import RaceHeader from './RaceHeader'
import SessionCard from './SessionCard'
import SessionForm from './SessionForm'
import RaceForm from './RaceForm'

export default function RunningTab({ selectedDate }) {
  const { runningSessions, activeRace } = useTraining()
  const [adding, setAdding] = useState(false)
  const [addingRace, setAddingRace] = useState(false)
  const [filter, setFilter] = useState('upcoming') // upcoming | all | completed

  const today = todayISO()

  const filtered = runningSessions
    .filter(s => {
      if (filter === 'upcoming')  return !s.completed && s.date >= today
      if (filter === 'completed') return s.completed
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // If a day is selected from calendar, show that day's sessions instead
  const displaySessions = selectedDate
    ? runningSessions.filter(s => s.date === selectedDate).sort((a,b) => a.date.localeCompare(b.date))
    : filtered

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
      {/* Race goal */}
      <RaceHeader />

      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <span className="font-display font-black text-xl text-white tracking-tight">
          {selectedDate ? selectedDate : 'Sessions'}
        </span>
        <button onClick={() => setAdding(true)} className="btn-primary py-1.5 text-xs">
          + Session
        </button>
      </div>

      {/* Filter tabs — only show when not date-filtered */}
      {!selectedDate && (
        <div className="flex gap-1 px-4 mb-3">
          {['upcoming','all','completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors
                ${filter === f ? 'bg-run/20 text-run border border-run/30' : 'text-muted hover:text-dimtext'}`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Session list */}
      <div className="px-4 space-y-2">
        {displaySessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted text-sm mb-3">
              {selectedDate ? 'No sessions on this day' : 'No sessions yet'}
            </p>
            <button onClick={() => setAdding(true)} className="btn-secondary text-xs py-1.5">
              Add one
            </button>
          </div>
        ) : (
          displaySessions.map(s => <SessionCard key={s.id} session={s} />)
        )}
      </div>

      {/* No race? prompt */}
      {!activeRace && (
        <div className="mx-4 mt-4 card text-center">
          <p className="text-dimtext text-sm mb-2">Set a race goal to see training paces</p>
          <button onClick={() => setAddingRace(true)} className="btn-primary text-xs py-1.5">
            Add Race Goal
          </button>
        </div>
      )}

      {adding && (
        <SessionForm
          prefillDate={selectedDate ?? todayISO()}
          onClose={() => setAdding(false)}
        />
      )}
      {addingRace && <RaceForm onClose={() => setAddingRace(false)} />}
    </div>
  )
}
