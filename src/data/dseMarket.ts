import { isDevMarketOverrideActive } from '../lib/devMarketOverride'

/** Dhaka Stock Exchange — Sun–Thu, pre-open 9:45 AM, trading 10:00 AM – 2:30 PM (Asia/Dhaka) */

export const DSE_SCHEDULE = {
  timezone: 'Asia/Dhaka',
  tradingDays: [0, 1, 2, 3, 4] as const, // Sunday – Thursday
  preOpen: { hour: 9, minute: 45 },
  open: { hour: 10, minute: 0 },
  close: { hour: 14, minute: 30 },
  hoursLabel: 'Sun–Thu · 10:00 AM–2:30 PM',
  preOpenLabel: 'Pre-open 9:45 AM',
} as const

export type DSEMarketStatus = 'Open' | 'Pre-open' | 'Closed'

function toDhakaMinutes(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DSE_SCHEDULE.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { day: dayMap[weekday] ?? date.getDay(), minutes: hour * 60 + minute }
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  const m = minute.toString().padStart(2, '0')
  return `${h}:${m} ${period}`
}

export function getDSEMarketInfo(now = new Date()) {
  const { day, minutes } = toDhakaMinutes(now)
  const preOpenMinutes = DSE_SCHEDULE.preOpen.hour * 60 + DSE_SCHEDULE.preOpen.minute
  const openMinutes = DSE_SCHEDULE.open.hour * 60 + DSE_SCHEDULE.open.minute
  const closeMinutes = DSE_SCHEDULE.close.hour * 60 + DSE_SCHEDULE.close.minute

  const isTradingDay = (DSE_SCHEDULE.tradingDays as readonly number[]).includes(day)

  let status: DSEMarketStatus = 'Closed'
  if (isTradingDay) {
    if (minutes >= openMinutes && minutes < closeMinutes) status = 'Open'
    else if (minutes >= preOpenMinutes && minutes < openMinutes) status = 'Pre-open'
  }

  const closeLabel = `Closes ${formatTime(DSE_SCHEDULE.close.hour, DSE_SCHEDULE.close.minute)}`
  const openLabel = `Opens ${formatTime(DSE_SCHEDULE.open.hour, DSE_SCHEDULE.open.minute)}`

  let sessionLabel: string = DSE_SCHEDULE.hoursLabel
  if (status === 'Open') sessionLabel = closeLabel
  else if (status === 'Pre-open') sessionLabel = openLabel
  else if (isTradingDay && minutes < preOpenMinutes) sessionLabel = openLabel

  const info = { status, sessionLabel, hoursLabel: DSE_SCHEDULE.hoursLabel }

  if (isDevMarketOverrideActive()) {
    return {
      ...info,
      status: 'Open' as const,
      sessionLabel: 'Dev market override — DSE treated as open for local testing',
    }
  }

  return info
}

export const DSE_STATUS_STYLES: Record<DSEMarketStatus, string> = {
  Open: 'bg-lenden-mint/15 text-lenden-mint',
  'Pre-open': 'bg-amber-500/15 text-amber-400',
  Closed: 'bg-white/10 text-lenden-muted',
}
