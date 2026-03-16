/**
 * Indian Standard Time (IST) date/time utilities.
 * All display formatting uses timezone "Asia/Kolkata" for consistent Indian time across the app.
 */

export const INDIAN_TZ = "Asia/Kolkata"

const locale = "en-IN"

/** Format options for IST - reuse to avoid creating new Intl objects everywhere */
const dateTimeFormatOpts: Intl.DateTimeFormatOptions = {
  timeZone: INDIAN_TZ,
}

/**
 * Format a date (no time) in IST.
 * e.g. "15 Mar 2025"
 */
export function formatDateIST(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date)
  return d.toLocaleDateString(locale, {
    ...dateTimeFormatOpts,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  })
}

/**
 * Format time only in IST.
 * e.g. "2:30 PM"
 */
export function formatTimeIST(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date)
  return d.toLocaleTimeString(locale, {
    ...dateTimeFormatOpts,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  })
}

/**
 * Format date and time in IST.
 * e.g. "15 Mar 2025, 2:30 PM"
 */
export function formatDateTimeIST(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date)
  return d.toLocaleString(locale, {
    ...dateTimeFormatOpts,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  })
}

/**
 * Short date + time for cards/lists in IST.
 * e.g. "Mon, 15 Mar · 2:30 PM"
 */
export function formatDateTimeShortIST(date: Date | string | number): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date)
  const dateStr = d.toLocaleDateString(locale, {
    ...dateTimeFormatOpts,
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const timeStr = formatTimeIST(d)
  return `${dateStr} · ${timeStr}`
}

/**
 * Long date only in IST (e.g. ride detail page).
 * e.g. "Monday, 15 March 2025"
 */
export function formatDateLongIST(date: Date | string | number): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date)
  return d.toLocaleDateString(locale, {
    ...dateTimeFormatOpts,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Date only short in IST (e.g. "15 Mar").
 */
export function formatDateShortIST(date: Date | string | number): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date)
  return d.toLocaleDateString(locale, {
    ...dateTimeFormatOpts,
    month: "short",
    day: "numeric",
  })
}

/**
 * Get calendar date parts in IST for a given instant.
 */
function getISTDateParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: INDIAN_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10)
  return { year: get("year"), month: get("month"), day: get("day") }
}

/**
 * Today's date in IST as YYYY-MM-DD (for form defaults, e.g. date input).
 */
export function todayDateStringIST(): string {
  const now = new Date()
  const { year, month, day } = getISTDateParts(now)
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

/**
 * Relative time for notifications (IST-aware).
 * e.g. "Just now", "5m ago", "2h ago", "Yesterday", "Mon, 15 Mar"
 */
export function formatRelativeTimeIST(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3600_000)
  const diffDays = Math.floor(diffMs / 86400_000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateIST(d)
}

/**
 * Date label for grouping (Today / Yesterday / short date) in IST.
 */
export function formatDateLabelIST(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = getISTDateParts(now)
  const dateParts = getISTDateParts(d)
  if (
    dateParts.year === today.year &&
    dateParts.month === today.month &&
    dateParts.day === today.day
  )
    return "Today"
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayParts = getISTDateParts(yesterday)
  if (
    dateParts.year === yesterdayParts.year &&
    dateParts.month === yesterdayParts.month &&
    dateParts.day === yesterdayParts.day
  )
    return "Yesterday"
  return d.toLocaleDateString(locale, {
    ...dateTimeFormatOpts,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

/** Noon UTC on a calendar day in IST: 00:00 IST = 18:30 previous day UTC, so noon IST = 06:30 UTC. */
function noonISTMillis(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day, 6, 30)
}

/**
 * For share message: date and relative string in IST.
 */
export function formatShareDateIST(
  departureTime: Date | string
): { dateStr: string; relativeStr: string } {
  const d = new Date(departureTime)
  const { year, month, day } = getISTDateParts(d)
  const dateStr = `${day}/${month}/${year}`

  const now = new Date()
  const today = getISTDateParts(now)
  const diffDays =
    (noonISTMillis(year, month, day) - noonISTMillis(today.year, today.month, today.day)) /
    (1000 * 60 * 60 * 24)
  const diffDaysRounded = Math.round(diffDays)

  let relativeStr = ""
  if (diffDaysRounded === 0) relativeStr = "Today"
  else if (diffDaysRounded === 1) relativeStr = "Tomorrow"
  else if (diffDaysRounded === 2) relativeStr = "Day after tomorrow"
  else if (diffDaysRounded > 2 && diffDaysRounded <= 7) relativeStr = `In ${diffDaysRounded} days`

  const hour = parseInt(
    new Intl.DateTimeFormat(locale, { timeZone: INDIAN_TZ, hour: "numeric", hour12: false }).format(
      d
    ),
    10
  )
  const timeOfDay =
    hour >= 4 && hour < 12
      ? "Morning"
      : hour >= 12 && hour < 17
        ? "Afternoon"
        : hour >= 17 && hour < 21
          ? "Evening"
          : "Night"
  if (relativeStr) relativeStr = `${relativeStr} ${timeOfDay}`

  return { dateStr, relativeStr: relativeStr.trim() }
}

/**
 * Time string for share message in IST (e.g. "2:30 PM").
 */
export function formatShareTimeIST(
  departureTime: Date | string,
  fromSlot: string | null
): string {
  if (fromSlot?.trim()) return fromSlot.trim()
  return formatTimeIST(departureTime)
}

/**
 * Human-friendly time-to-departure string in IST for rides.
 * e.g. "Starts in 2h 15m", "Started 5m ago".
 */
export function formatTimeToDepartureIST(
  date: Date | string | number
): string {
  const target =
    typeof date === "object" && "getTime" in date ? date : new Date(date)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const absMinutes = Math.round(Math.abs(diffMs) / 60_000)

  if (absMinutes < 1) return "Starting now"

  const minutesInDay = 60 * 24
  const days = Math.floor(absMinutes / minutesInDay)
  const hours = Math.floor((absMinutes % minutesInDay) / 60)
  const minutes = absMinutes % 60

  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (!days && minutes) parts.push(`${minutes}m`)

  const base = parts.join(" ")

  if (diffMs > 0) {
    return base ? `Starts in ${base}` : "Starts soon"
  }

  return base ? `Started ${base} ago` : "Started recently"
}
