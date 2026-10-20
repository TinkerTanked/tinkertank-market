import { SCHOOL_TERMS } from '@/config/schoolTerms'
import { isClosureDate } from '@/data/closureDates'
import { getLocationAvailabilityById, isDateKeyAvailableForLocation } from '@/data/locationAvailability'
import { addDaysToKey, schoolHolidayWindow, sydneyDateKey, weekdayOfKey } from '@/lib/adminAnalytics'

export interface CampSeason {
  /** e.g. 'Summer' */
  name: string
  /** e.g. 'Summer Holiday Camps 2026–27' */
  title: string
  /** First and last days of the school holidays (YYYY-MM-DD). */
  start: string
  end: string
}

/**
 * The school holiday camp season to promote now: the holidays we are in, or
 * the next ones. Derived from the NSW school terms, so camp pages roll over to
 * the next season automatically when the holidays end.
 */
export function getCampSeason(now: Date = new Date()): CampSeason | null {
  const holiday = schoolHolidayWindow(SCHOOL_TERMS, sydneyDateKey(now))
  if (!holiday) return null

  const startYear = holiday.start.slice(0, 4)
  const endYear = holiday.end.slice(0, 4)
  const years = startYear === endYear ? startYear : `${startYear}–${endYear.slice(2)}`
  return { name: holiday.season, title: `${holiday.season} Holiday Camps ${years}`, start: holiday.start, end: holiday.end }
}

function closed(dateKey: string) {
  return isClosureDate(new Date(`${dateKey}T12:00:00`))
}

function weekdaysIn(season: CampSeason) {
  const days: string[] = []
  for (let key = season.start; key <= season.end; key = addDaysToKey(key, 1)) {
    const weekday = weekdayOfKey(key)
    if (weekday !== 0 && weekday !== 6) days.push(key)
  }
  return days
}

/**
 * Bookable camp dates for a location in the season, excluding weekends,
 * closures and days that have already passed.
 */
export function getSeasonCampDates(season: CampSeason, locationId: string, now: Date = new Date()): string[] {
  const location = getLocationAvailabilityById(locationId)
  if (!location) return []
  const today = sydneyDateKey(now)
  return weekdaysIn(season).filter(key => key >= today && !closed(key) && isDateKeyAvailableForLocation(key, location.locationName))
}

/** Weekdays in the season when TinkerTank is closed. */
export function getSeasonClosedDates(season: CampSeason): string[] {
  return weekdaysIn(season).filter(closed)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function parts(dateKey: string) {
  return {
    weekday: WEEKDAYS[weekdayOfKey(dateKey)],
    day: Number(dateKey.slice(8, 10)),
    month: MONTHS[Number(dateKey.slice(5, 7)) - 1],
    year: dateKey.slice(0, 4)
  }
}

/** e.g. '18 December 2026' */
export function formatLongDate(dateKey: string) {
  const { day, month, year } = parts(dateKey)
  return `${day} ${month} ${year}`
}

/** e.g. 'Tue 12 Jan' */
export function formatShortDate(dateKey: string) {
  const { weekday, day, month } = parts(dateKey)
  return `${weekday} ${day} ${month.slice(0, 3)}`
}

/** Groups sorted date keys into runs of consecutive calendar days. */
export function consecutiveRuns(dateKeys: string[]): string[][] {
  const runs: string[][] = []
  for (const key of dateKeys) {
    const run = runs[runs.length - 1]
    if (run && addDaysToKey(run[run.length - 1], 1) === key) run.push(key)
    else runs.push([key])
  }
  return runs
}

/** e.g. 'Mon 4–Fri 8 Jan', 'Wed 30 Dec–Fri 1 Jan' or 'Fri 18 Dec'. */
export function formatRun(run: string[], { weekday = true }: { weekday?: boolean } = {}) {
  const first = run[0]
  const last = run[run.length - 1]
  const day = (key: string) => (weekday ? `${parts(key).weekday} ${parts(key).day}` : `${parts(key).day}`)
  const dayMonth = (key: string) => `${day(key)} ${parts(key).month.slice(0, 3)}`
  if (first === last) return dayMonth(first)
  if (first.slice(0, 7) === last.slice(0, 7)) return `${day(first)}–${dayMonth(last)}`
  return `${dayMonth(first)}–${dayMonth(last)}`
}

/** e.g. '24–25 Dec, 31 Dec–1 Jan and 25–26 Jan' */
export function formatDateList(dateKeys: string[]) {
  const parts = consecutiveRuns(dateKeys).map(run => formatRun(run, { weekday: false }))
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : (parts[0] ?? '')
}
