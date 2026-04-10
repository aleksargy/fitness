import { createContext, useContext, useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'

const TrainingContext = createContext(null)

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

const DEMO_RACE = {
  id: 'demo-race',
  name: '10K',
  date: '2026-07-19',
  distanceM: 10000,
  goalTimeSecs: 2400, // 40:00
}

export function TrainingProvider({ children }) {
  const [sessions, setSessions]   = useState(() => load('tl_sessions', []))
  const [races, setRaces]         = useState(() => load('tl_races', [DEMO_RACE]))
  const [activeRaceId, setActiveRaceId] = useState(() => load('tl_activeRace', DEMO_RACE.id))

  // ── Sessions ─────────────────────────────────────────────────────────
  const addSession = useCallback((data) => {
    const s = { id: uuid(), createdAt: Date.now(), completed: false, ...data }
    setSessions(prev => {
      const next = [...prev, s]
      save('tl_sessions', next)
      return next
    })
    return s
  }, [])

  const updateSession = useCallback((id, patch) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s)
      save('tl_sessions', next)
      return next
    })
  }, [])

  const deleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      save('tl_sessions', next)
      return next
    })
  }, [])

  const toggleComplete = useCallback((id) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
      save('tl_sessions', next)
      return next
    })
  }, [])

  // ── Races ─────────────────────────────────────────────────────────────
  const addRace = useCallback((data) => {
    const r = { id: uuid(), ...data }
    setRaces(prev => {
      const next = [...prev, r]
      save('tl_races', next)
      return next
    })
    return r
  }, [])

  const updateRace = useCallback((id, patch) => {
    setRaces(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...patch } : r)
      save('tl_races', next)
      return next
    })
  }, [])

  const deleteRace = useCallback((id) => {
    setRaces(prev => {
      const next = prev.filter(r => r.id !== id)
      save('tl_races', next)
      return next
    })
  }, [])

  const setActiveRace = useCallback((id) => {
    setActiveRaceId(id)
    save('tl_activeRace', id)
  }, [])

  const activeRace = races.find(r => r.id === activeRaceId) ?? races[0] ?? null

  // ── Queries ───────────────────────────────────────────────────────────
  const sessionsForDate   = useCallback((isoDate) => sessions.filter(s => s.date === isoDate), [sessions])
  const runningSessions   = sessions.filter(s => s.type === 'running')
  const strengthSessions  = sessions.filter(s => s.type === 'strength')

  return (
    <TrainingContext.Provider value={{
      sessions, runningSessions, strengthSessions,
      sessionsForDate,
      addSession, updateSession, deleteSession, toggleComplete,
      races, activeRace, activeRaceId,
      addRace, updateRace, deleteRace, setActiveRace,
    }}>
      {children}
    </TrainingContext.Provider>
  )
}

export function useTraining() {
  const ctx = useContext(TrainingContext)
  if (!ctx) throw new Error('useTraining must be inside TrainingProvider')
  return ctx
}
