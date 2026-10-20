import { describe, expect, it } from 'vitest'
import { formatDateList, getCampSeason, getSeasonCampDates, getSeasonClosedDates } from '@/lib/campSeason'

// 9 AM Sydney on the given day
const sydney = (dateKey: string) => new Date(`${dateKey}T09:00:00+11:00`)

describe('camp season', () => {
  it('promotes the next holidays during term and rolls over once the holidays end', () => {
    expect(getCampSeason(sydney('2026-10-20'))).toEqual({
      name: 'Summer',
      title: 'Summer Holiday Camps 2026–27',
      start: '2026-12-18',
      end: '2027-02-02'
    })
    expect(getCampSeason(sydney('2027-02-02'))?.name).toBe('Summer')
    expect(getCampSeason(sydney('2027-02-03'))?.title).toBe('Autumn Holiday Camps 2027')
  })

  it('offers every summer weekday at Neutral Bay except the studio closures', () => {
    const now = sydney('2026-10-20')
    const season = getCampSeason(now)!
    const dates = getSeasonCampDates(season, 'neutral-bay', now)

    expect(dates[0]).toBe('2026-12-18')
    expect(dates[dates.length - 1]).toBe('2027-02-02')
    expect(dates).toEqual(expect.arrayContaining(['2026-12-23', '2026-12-29', '2026-12-30', '2027-01-27']))
    for (const closed of ['2026-12-24', '2026-12-25', '2026-12-28', '2026-12-31', '2027-01-01', '2027-01-25', '2027-01-26']) {
      expect(dates).not.toContain(closed)
    }
    expect(formatDateList(getSeasonClosedDates(season))).toBe('24–25 Dec, 28 Dec, 31 Dec–1 Jan and 25–26 Jan')
  })

  it('offers only the scheduled Manly Library dates and drops days that have passed', () => {
    const season = getCampSeason(sydney('2026-10-20'))!

    expect(getSeasonCampDates(season, 'manly-library', sydney('2026-10-20'))).toEqual([
      '2027-01-12',
      '2027-01-13',
      '2027-01-14',
      '2027-01-19',
      '2027-01-20',
      '2027-01-21'
    ])
    expect(getSeasonCampDates(season, 'manly-library', sydney('2027-01-15'))).toEqual(['2027-01-19', '2027-01-20', '2027-01-21'])
  })
})
