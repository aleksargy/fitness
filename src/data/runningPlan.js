// Sub-40 10K Plan · Apr 9 → Jul 19, 2026 · 15 weeks
// Phase colours match the HTML plan document

export const PHASES = {
  base:     { label: 'Base',          color: '#818cf8', weeks: '1–4' },
  build:    { label: 'Build',         color: '#38bdf8', weeks: '5–8' },
  specific: { label: 'Race-Specific', color: '#34d399', weeks: '9–13' },
  taper:    { label: 'Taper + Race',  color: '#f87171', weeks: '14–15' },
}

// badge: 'cutback' | 'test' | 'taper' | 'race' | null
export const PLAN_WEEKS = [
  {
    week: 1, phase: 'base', label: 'Aerobic Foundation',
    dates: 'Apr 9–15', badge: null,
    note: "Don't worry about pace targets yet. The goal is just consistent, relaxed running. Strides are short accelerations — not sprints.",
    sessions: [
      { day: 'Tue', type: 'easy',     name: 'Easy Run + Strides',      detail: '5 km at 5:10–5:30 · finish with 4×100m strides (relaxed, quick turnover, full recovery between)' },
      { day: 'Thu', type: 'easy',     name: 'Easy Run',                 detail: '6 km at 5:10–5:30 — keep it honest, no pace pressure' },
      { day: 'Sat', type: 'long',     name: 'Long Easy Run',            detail: '9 km at 5:15–5:35 — conversational effort throughout' },
      { day: 'Sun', type: 'optional', name: 'Easy Recovery Run',        detail: '5 km very easy — only if legs feel good, skip if calisthenics was heavy' },
    ],
  },
  {
    week: 2, phase: 'base', label: 'Building Volume',
    dates: 'Apr 16–22', badge: null,
    note: null,
    sessions: [
      { day: 'Tue', type: 'easy',     name: 'Easy Run + Strides',  detail: '5 km at 5:10–5:30 · finish with 6×100m strides' },
      { day: 'Thu', type: 'easy',     name: 'Easy Run',             detail: '7 km at 5:10–5:30' },
      { day: 'Sat', type: 'long',     name: 'Long Easy Run',        detail: '10 km at 5:15–5:30' },
      { day: 'Sun', type: 'optional', name: 'Easy 5 km',            detail: 'Only if Saturday felt comfortable' },
    ],
  },
  {
    week: 3, phase: 'base', label: 'First Steady State',
    dates: 'Apr 23–29', badge: null,
    note: "Thursday's steady state is your first taste of faster running. It should feel controlled — you should be able to speak in short phrases, not full sentences.",
    sessions: [
      { day: 'Tue', type: 'easy',   name: 'Easy Run + Strides', detail: '5 km easy · 4×100m strides' },
      { day: 'Thu', type: 'tempo',  name: 'Steady State Run',   detail: '1 km warm-up · 5 km at 4:40–4:50 · 1 km cool-down · This should feel "comfortably hard" — controlled breathing' },
      { day: 'Sat', type: 'long',   name: 'Long Easy Run',      detail: '11 km at 5:15–5:30' },
    ],
  },
  {
    week: 4, phase: 'base', label: 'Cutback Week',
    dates: 'Apr 30–May 6', badge: 'cutback',
    note: 'Cutback weeks are not optional. Adaptation happens during recovery. Embrace the lower volume — your body is getting stronger.',
    sessions: [
      { day: 'Tue', type: 'easy', name: 'Easy Run + Strides', detail: '5 km easy · 4×100m strides' },
      { day: 'Thu', type: 'easy', name: 'Easy Run',            detail: '5 km easy · no pressure' },
      { day: 'Sat', type: 'long', name: 'Easy Long Run',       detail: '8 km easy · let the legs rest up before the build phase' },
    ],
  },
  {
    week: 5, phase: 'build', label: 'First Intervals',
    dates: 'May 7–13', badge: null,
    note: "The 800s should feel hard but controlled — not a full sprint. If you're dying by rep 4, you started too fast. Aim to negative-split slightly (last rep = fastest).",
    sessions: [
      { day: 'Tue', type: 'interval', name: '6×800m Repeats',      detail: '1.5 km warm-up jog · 6×800m at 4:05–4:10 /km · 90 sec easy jog recovery between reps · 1 km cool-down · Total ~11–12 km' },
      { day: 'Thu', type: 'easy',     name: 'Easy Recovery Run',   detail: '6 km at 5:20–5:40 · keep it truly easy — legs will be tired' },
      { day: 'Sat', type: 'long',     name: 'Long Run',             detail: '11 km easy at 5:15–5:30' },
      { day: 'Sun', type: 'optional', name: 'Easy 5 km',            detail: "Only if Tuesday's session felt manageable" },
    ],
  },
  {
    week: 6, phase: 'build', label: 'Tempo Introduction',
    dates: 'May 14–20', badge: null,
    note: null,
    sessions: [
      { day: 'Tue', type: 'tempo', name: '2×15 min Tempo',             detail: '1.5 km warm-up · 15 min at 4:15–4:20 /km · 3 min easy jog · 15 min at 4:15–4:20 · 1 km cool-down' },
      { day: 'Thu', type: 'easy',  name: 'Easy Run + Strides',         detail: '6 km easy · 4×100m strides at the end' },
      { day: 'Sat', type: 'long',  name: 'Long Run with Steady Finish', detail: '12 km total · first 9 km easy at 5:15–5:30 · last 3 km at 4:40–4:50 (steady state)' },
    ],
  },
  {
    week: 7, phase: 'build', label: 'Race Pace Preview',
    dates: 'May 21–27', badge: null,
    note: "The 1000m reps at 4:00/km will reveal where you are. Don't panic if it feels hard — you have 8 more weeks to adapt to that pace.",
    sessions: [
      { day: 'Tue', type: 'interval', name: '5×1000m @ Race Pace',      detail: '1.5 km warm-up · 5×1000m at 4:00 /km · 90 sec jog recovery · 1 km cool-down · First feel of goal pace — it will feel fast right now, that\'s fine' },
      { day: 'Thu', type: 'easy',     name: 'Easy Run',                  detail: '7 km easy' },
      { day: 'Sat', type: 'long',     name: 'Progression Long Run',      detail: '13 km total · km 1–7 easy at 5:15–5:30 · km 7–13 at steady state 4:40–4:50' },
    ],
  },
  {
    week: 8, phase: 'build', label: '5K Time Trial',
    dates: 'May 28–Jun 3', badge: 'test',
    note: "This is a checkpoint, not a race. Use it to recalibrate your training paces if needed. A 5K time of ~20:30 min predicts a ~42:30 10K — you'll need to drop another 2:30 in the next 7 weeks.",
    sessions: [
      { day: 'Tue', type: 'easy', name: 'Easy Run + Strides', detail: '5 km easy · 4×100m strides · freshen up the legs' },
      { day: 'Thu', type: 'easy', name: 'Easy 4 km',           detail: 'Very light · save legs for Saturday' },
      { day: 'Sat', type: 'test', name: '5K Time Trial — Full Effort', detail: '1.5 km warm-up · 5K as fast as you can · 1 km cool-down · Target: sub-20:00 puts you on track · Under 19:30 = ahead of schedule' },
    ],
  },
  {
    week: 9, phase: 'specific', label: 'Race-Specific Volume',
    dates: 'Jun 4–10', badge: null,
    note: null,
    sessions: [
      { day: 'Tue', type: 'interval', name: '3×2000m @ Goal Pace',  detail: '1.5 km warm-up · 3×2000m at 4:00 /km · 3 min recovery jog · 1 km cool-down · Total ~12–13 km · Sustained goal pace efforts — this is the core work' },
      { day: 'Thu', type: 'easy',     name: 'Easy Recovery Run',    detail: '7 km at 5:20–5:40' },
      { day: 'Sat', type: 'long',     name: 'Long Easy Run',         detail: '13 km easy' },
    ],
  },
  {
    week: 10, phase: 'specific', label: 'Sub-Race Pace Sharpening',
    dates: 'Jun 11–17', badge: null,
    note: null,
    sessions: [
      { day: 'Tue', type: 'interval', name: '6×1000m — Faster Than Race Pace', detail: '1.5 km warm-up · 6×1000m at 3:55 /km · 90 sec jog recovery · 1 km cool-down · Running faster than race pace makes race pace feel easier' },
      { day: 'Thu', type: 'tempo',    name: '25 min Tempo',                    detail: '1.5 km warm-up · 25 min continuous at 4:15 /km · 1 km cool-down' },
      { day: 'Sat', type: 'long',     name: 'Long Run',                         detail: '14 km easy' },
      { day: 'Sun', type: 'optional', name: 'Easy 5 km',                        detail: 'Only if the week felt manageable volume-wise' },
    ],
  },
  {
    week: 11, phase: 'specific', label: 'Peak Quality',
    dates: 'Jun 18–24', badge: null,
    note: 'Tuesday is your hardest session. If you nail it, confidence will skyrocket. If you struggle with the 400s, drop pace to 3:50 — the quality of the 3000m reps matters more.',
    sessions: [
      { day: 'Tue', type: 'interval', name: '2×3000m + 4×400m',        detail: '1.5 km warm-up · 2×3000m at 4:00 /km (3 min recovery between) · 5 min easy · 4×400m at 3:45 /km (90 sec recovery) · 1 km cool-down · Hardest session of the plan' },
      { day: 'Thu', type: 'easy',     name: 'Easy Run',                  detail: '6 km easy — deserved recovery after Tuesday' },
      { day: 'Sat', type: 'long',     name: '10 km Progression Run',     detail: 'km 1–5 easy at 5:15–5:30 · km 5–10 at 4:10 /km (just above tempo) · A key workout for building race-day fatigue resistance' },
    ],
  },
  {
    week: 12, phase: 'specific', label: 'Lactate Threshold Peak',
    dates: 'Jun 25–Jul 1', badge: null,
    note: null,
    sessions: [
      { day: 'Tue', type: 'interval', name: '4×1500m',          detail: '1.5 km warm-up · 4×1500m at 3:55 /km · 2 min jog recovery · 1 km cool-down' },
      { day: 'Thu', type: 'tempo',    name: '30 min Tempo Run',  detail: '1.5 km warm-up · 30 min continuous at 4:15 /km · 1 km cool-down · Longest tempo of the plan — settle in and hold' },
      { day: 'Sat', type: 'long',     name: 'Easy Long Run',     detail: '12 km easy — protect the legs after a hard week' },
    ],
  },
  {
    week: 13, phase: 'specific', label: 'Tune-Up',
    dates: 'Jul 2–8', badge: 'test',
    note: "A 5K in ~19:15–19:30 predicts a sub-40 10K if you execute the race well. Don't obsess over the prediction — use it for confidence.",
    sessions: [
      { day: 'Tue', type: 'interval', name: '8×600m — Fast',          detail: '1.5 km warm-up · 8×600m at 3:50 /km · 90 sec recovery · 1 km cool-down · Short, fast, sharp — neuromuscular prep for race day' },
      { day: 'Thu', type: 'easy',     name: 'Easy 6 km',               detail: 'Easy, keep legs fresh for Saturday' },
      { day: 'Sat', type: 'test',     name: '5K Race or Hard Time Trial', detail: 'Find a local 5K or run a solo time trial · Target: sub-19:30 · This is your final fitness check — race it properly with full warm-up' },
    ],
  },
  {
    week: 14, phase: 'taper', label: 'Taper',
    dates: 'Jul 9–15', badge: 'taper',
    note: "Taper anxiety is real — the urge to run more will hit hard. Resist it. The fitness gains are locked in. Now it's about being fresh.",
    sessions: [
      { day: 'Tue', type: 'interval', name: '4×800m @ Race Pace',   detail: '1.5 km warm-up · 4×800m at 4:00 /km · 90 sec recovery · 1 km cool-down · Half the volume, full sharpness — keeps you dialled in without loading the legs' },
      { day: 'Thu', type: 'easy',     name: 'Easy Run + Strides',   detail: '5 km easy · 4×100m strides — feeling fast with rested legs' },
      { day: 'Sat', type: 'easy',     name: 'Easy 6 km',             detail: 'Relaxed, enjoy it · The work is done' },
    ],
  },
  {
    week: 15, phase: 'taper', label: 'Race Week',
    dates: 'Jul 16–19', badge: 'race',
    note: 'The first km will feel easy because of adrenaline — that\'s the trap. Start at 4:05 deliberately. Going out at 3:50 and blowing up at km 7 is how you miss the goal.',
    sessions: [
      { day: 'Mon', type: 'easy',     name: 'Easy 3 km',                      detail: 'Short, light, just keep the legs moving' },
      { day: 'Wed', type: 'easy',     name: 'Easy 3 km + Strides',            detail: '3 km very easy · 4×100m strides at race pace — confirm the legs are ready' },
      { day: 'Thu', type: 'optional', name: 'Rest / Very Easy Walk',          detail: 'Eat well, sleep well, hydrate' },
      { day: 'Fri', type: 'optional', name: 'Rest',                            detail: 'Lay out race kit, pin your bib, visualize the race' },
      { day: 'Sat', type: 'race',     name: '10K — Target: Sub-40:00',        detail: 'Warm-up: 1.5 km easy jog + 4 strides · Race strategy: run km 1 at 4:05 (don\'t go out hot), settle to 4:00 by km 2, hold through km 7, then give everything · You\'ve put in the work — trust the process' },
    ],
  },
]

// Map day abbreviation + week start date (Monday Apr 9 = week 1) to an ISO date
const WEEK_MONDAYS = [
  '2026-04-09', // wk 1
  '2026-04-16', // wk 2
  '2026-04-23', // wk 3
  '2026-04-30', // wk 4
  '2026-05-07', // wk 5
  '2026-05-14', // wk 6
  '2026-05-21', // wk 7
  '2026-05-28', // wk 8
  '2026-06-04', // wk 9
  '2026-06-11', // wk 10
  '2026-06-18', // wk 11
  '2026-06-25', // wk 12
  '2026-07-02', // wk 13
  '2026-07-09', // wk 14
  '2026-07-16', // wk 15
]

const DAY_OFFSET = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// Returns a flat array of { isoDate, week, phase, type, name, detail }
export function getPlanSessionsFlat() {
  const result = []
  PLAN_WEEKS.forEach((wk, i) => {
    const monday = WEEK_MONDAYS[i]
    wk.sessions.forEach(s => {
      const offset = DAY_OFFSET[s.day] ?? 0
      result.push({
        isoDate: addDays(monday, offset),
        week: wk.week,
        phase: wk.phase,
        type: s.type,
        name: s.name,
        detail: s.detail,
      })
    })
  })
  return result
}

// Returns a Map<isoDate, session[]>
export function getPlanByDate() {
  const map = new Map()
  getPlanSessionsFlat().forEach(s => {
    if (!map.has(s.isoDate)) map.set(s.isoDate, [])
    map.get(s.isoDate).push(s)
  })
  return map
}

export const PLAN_TYPE_META = {
  easy:     { label: 'Easy',      color: '#7dd3fc', bg: 'rgba(125,211,252,0.08)', border: 'rgba(125,211,252,0.2)' },
  tempo:    { label: 'Tempo',     color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  interval: { label: 'Intervals', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  long:     { label: 'Long',      color: '#6ee7b7', bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.2)' },
  test:     { label: 'Time Trial',color: '#fcd34d', bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.2)'  },
  race:     { label: 'Race Day',  color: '#f0f2f5', bg: 'rgba(240,242,245,0.08)', border: 'rgba(240,242,245,0.2)' },
  optional: { label: 'Optional',  color: '#3f4756', bg: 'rgba(63,71,86,0.15)',    border: 'rgba(63,71,86,0.3)'    },
}
