import { startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, format, parseISO, differenceInCalendarDays, isSameDay } from 'date-fns'

export { format, parseISO, isSameDay, differenceInCalendarDays }

export function getWeekDays(baseDate = new Date()) {
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function prevWeek(date) { return subWeeks(date, 1) }
export function nextWeek(date) { return addWeeks(date, 1) }

export function toISO(date) { return format(date, 'yyyy-MM-dd') }
export function todayISO() { return toISO(new Date()) }

export function daysUntil(isoDate) {
  return differenceInCalendarDays(parseISO(isoDate), new Date())
}

export function formatShortDate(date) { return format(date, 'MMM d') }
export function formatDayLabel(date) { return format(date, 'EEE') }
export function formatMonthYear(date) { return format(date, 'MMMM yyyy') }
export function formatWeekRange(days) {
  if (!days?.length) return ''
  return `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`
}
