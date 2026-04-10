// ─── Neutral dark / futuristic palette ───────────────────────────────────────
// Chrome is monochrome. Color is reserved for data (session badges, charts).

export const C = {
  // Backgrounds — stepped from deepest to lightest
  bg:       '#07080a',
  surface:  '#0c0e12',
  card:     '#111418',
  border:   '#1e222c',

  // Accent — single near-white. Used for Today circle, tab indicator, key numbers.
  primary:  '#f0f2f5',

  // Secondary accent — cool slate, used for strength
  str:      '#8b95a8',

  // Text
  text:     '#e2e6ed',
  dim:      '#636b7a',
  muted:    '#2c313c',

  // ── Session type colors (kept for data legibility, not UI chrome) ──────────
  easy:     '#7dd3fc',   // sky-300
  tempo:    '#fbbf24',   // amber-400
  interval: '#f87171',   // red-400
  long:     '#6ee7b7',   // emerald-300 (one green — only here)
  test:     '#fcd34d',   // yellow-300
  race:     '#f0f2f5',   // near-white
  optional: '#3f4756',   // muted gray

  // ── Phase colors (plan tab only) ──────────────────────────────────────────
  phase: {
    base:     '#818cf8',   // indigo
    build:    '#38bdf8',   // sky
    specific: '#34d399',   // emerald
    taper:    '#f87171',   // red
  },
}

export const SESSION_COLORS = {
  easy:     { color: C.easy,     bg: 'rgba(125,211,252,0.08)', border: 'rgba(125,211,252,0.2)' },
  tempo:    { color: C.tempo,    bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  interval: { color: C.interval, bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  long:     { color: C.long,     bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.2)' },
  test:     { color: C.test,     bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.2)'  },
  race:     { color: C.race,     bg: 'rgba(240,242,245,0.08)', border: 'rgba(240,242,245,0.2)' },
  optional: { color: C.optional, bg: 'rgba(63,71,86,0.2)',     border: 'rgba(63,71,86,0.35)'   },
  strength: { color: C.str,      bg: 'rgba(139,149,168,0.1)',  border: 'rgba(139,149,168,0.2)' },
}
