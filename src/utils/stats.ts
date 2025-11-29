// src/utils/stats.ts

export function calculateStreak(dates: string[]) {
  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const uniqueDates = Array.from(new Set(dates)).sort();
  const dayNumbers = uniqueDates.map((d) =>
    Math.floor(new Date(d + "T00:00:00").getTime() / 86400000)
  );

  let bestStreak = 1;
  let current = 1;

  for (let i = 1; i < dayNumbers.length; i++) {
    if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
      current += 1;
      bestStreak = Math.max(bestStreak, current);
    } else {
      current = 1;
    }
  }

  const todayNum = Math.floor(
    new Date().setHours(0, 0, 0, 0) / 86400000
  );
  const dateSet = new Set(dayNumbers);

  let currentStreak = 0;
  let day = todayNum;
  while (dateSet.has(day)) {
    currentStreak += 1;
    day -= 1;
  }

  return { currentStreak, bestStreak };
}

export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun..6
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function getHeatmapClass(intensity: number, max: number): string {
  if (intensity <= 0 || max <= 0) {
    return "bg-slate-900 border-slate-800";
  }
  const ratio = intensity / max;
  if (ratio < 0.25) return "bg-emerald-950 border-emerald-900";
  if (ratio < 0.5) return "bg-emerald-900 border-emerald-800";
  if (ratio < 0.75) return "bg-emerald-700 border-emerald-700";
  return "bg-emerald-500 border-emerald-500";
}
