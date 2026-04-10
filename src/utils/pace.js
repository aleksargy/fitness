// Convert "MM:SS" string → total seconds
export function paceToSecs(str) {
  if (!str) return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

// Convert seconds → "M:SS" (pace) or "H:MM:SS" (duration)
export function secsToStr(secs, forceHours = false) {
  if (!secs || secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0 || forceHours) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

// Given a race goal time (secs) and distance (meters), return all training paces in sec/km
export function deriveTrainingPaces(goalTimeSecs, distanceMeters = 10000) {
  const racePaceSecPerKm = (goalTimeSecs / distanceMeters) * 1000

  return {
    race:     { min: racePaceSecPerKm,      max: racePaceSecPerKm + 5,  label: '10K Race Pace' },
    interval: { min: racePaceSecPerKm - 12, max: racePaceSecPerKm - 5,  label: 'Interval (5K pace)' },
    tempo:    { min: racePaceSecPerKm + 10, max: racePaceSecPerKm + 20, label: 'Tempo / Threshold' },
    steady:   { min: racePaceSecPerKm + 40, max: racePaceSecPerKm + 50, label: 'Steady State' },
    easy:     { min: racePaceSecPerKm + 70, max: racePaceSecPerKm + 90, label: 'Easy / Recovery' },
    long:     { min: racePaceSecPerKm + 60, max: racePaceSecPerKm + 80, label: 'Long Run' },
  }
}

// Format a pace range as "M:SS – M:SS /km"
export function formatPaceRange(minSecs, maxSecs) {
  return `${secsToStr(Math.round(minSecs))}–${secsToStr(Math.round(maxSecs))} /km`
}

// Predict 10K time from 5K time using Riegel formula
export function predict10k(fiveKSecs) {
  return fiveKSecs * Math.pow(2, 1.06)
}

export const SESSION_TYPES = ['easy', 'tempo', 'interval', 'long']

export const SESSION_TYPE_META = {
  easy:     { label: 'Easy',     color: 'text-blue-300',   bg: 'bg-blue-900/30',   border: 'border-blue-700/40' },
  tempo:    { label: 'Tempo',    color: 'text-amber-300',  bg: 'bg-amber-900/30',  border: 'border-amber-700/40' },
  interval: { label: 'Intervals',color: 'text-red-300',    bg: 'bg-red-900/30',    border: 'border-red-700/40' },
  long:     { label: 'Long',     color: 'text-green-300',  bg: 'bg-green-900/30',  border: 'border-green-700/40' },
}
