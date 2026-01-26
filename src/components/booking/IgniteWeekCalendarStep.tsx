'use client'

import { useMemo } from 'react'

export interface IgniteSession {
  id: string
  name: string
  programType: 'in-school' | 'drop-off' | 'school-pickup'
  location: string
  address?: string
  dayOfWeek: string[]
  startTime: string
  endTime: string
  priceWeekly: number
  stripePriceId: string
  stripeProductId: string
}

interface IgniteWeekCalendarStepProps {
  selectedSession: IgniteSession | null
  onSessionSelect: (session: IgniteSession) => void
}

const IGNITE_SESSIONS: IgniteSession[] = [
  // In-School (green)
  {
    id: 'ignite-balgowlah-wed',
    name: 'In-School Ignite - Balgowlah Heights Public',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: ['wednesday'],
    startTime: '12:45',
    endTime: '13:45',
    priceWeekly: 25.99,
    stripePriceId: 'price_1StKP9DqupgKyrhoQxEg01ua',
    stripeProductId: 'prod_Tr2UrvopQoseGC'
  },
  {
    id: 'ignite-balgowlah-thu',
    name: 'In-School Ignite - Balgowlah Heights Public',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: ['thursday'],
    startTime: '15:45',
    endTime: '17:15',
    priceWeekly: 29.99,
    stripePriceId: 'price_1StKPADqupgKyrhoUmdMDcHc',
    stripeProductId: 'prod_Tr2UButkR3rLsu'
  },
  {
    id: 'ignite-ics-tue',
    name: 'In-School Ignite - International Chinese School',
    programType: 'in-school',
    location: 'International Chinese School',
    dayOfWeek: ['tuesday'],
    startTime: '16:00',
    endTime: '17:30',
    priceWeekly: 30.99,
    stripePriceId: 'price_1StKPBDqupgKyrhoFBdlmoKk',
    stripeProductId: 'prod_Tr2USER37jHSqK'
  },
  // Drop-Off Studio (blue)
  {
    id: 'ignite-nb-monfri',
    name: 'Drop-Off Studio Ignite - Neutral Bay',
    programType: 'drop-off',
    location: 'Neutral Bay Studio',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99,
    stripePriceId: 'price_1StKPCDqupgKyrho8MVv42fB',
    stripeProductId: 'prod_Tr2U8LvoUYQpUW'
  },
  {
    id: 'ignite-nb-sat',
    name: 'Drop-Off Studio Ignite - Neutral Bay',
    programType: 'drop-off',
    location: 'Neutral Bay Studio',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: ['saturday'],
    startTime: '10:00',
    endTime: '12:00',
    priceWeekly: 39.99,
    stripePriceId: 'price_1StKPEDqupgKyrhomgKCSdXu',
    stripeProductId: 'prod_Tr2UV2dbzeRGem'
  },
  {
    id: 'ignite-brookvale-cc',
    name: 'Drop-Off Studio Ignite - Brookvale Community Centre',
    programType: 'drop-off',
    location: 'Brookvale Community Centre',
    address: '2 Alfred Rd, Brookvale NSW 2100',
    dayOfWeek: ['monday'],
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99,
    stripePriceId: 'price_1StKPFDqupgKyrhoqs9xI4mj',
    stripeProductId: 'prod_Tr2UeutYss76YJ'
  },
  {
    id: 'ignite-manly-library',
    name: 'Drop-Off Studio Ignite - Manly Creative Library',
    programType: 'drop-off',
    location: 'Manly Creative Library',
    address: '1 Market Ln, Manly NSW 2095',
    dayOfWeek: ['wednesday'],
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99,
    stripePriceId: 'price_1StKPGDqupgKyrhoqKltUzlP',
    stripeProductId: 'prod_Tr2UMLGLz5ASmm'
  },
  // School Pickup (orange)
  {
    id: 'ignite-brookvale-ps',
    name: 'School Pickup Ignite - Brookvale Public School',
    programType: 'school-pickup',
    location: 'Brookvale Public School',
    dayOfWeek: ['monday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 44.99,
    stripePriceId: 'price_1StKPHDqupgKyrhoDoXly8g2',
    stripeProductId: 'prod_Tr2UsGEvnSNaK0'
  },
  {
    id: 'ignite-manly-village',
    name: 'School Pickup Ignite - Manly Village Public School',
    programType: 'school-pickup',
    location: 'Manly Village Public School',
    dayOfWeek: ['wednesday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    stripePriceId: 'price_1StKPIDqupgKyrhoYd0u5j2S',
    stripeProductId: 'prod_Tr2UHCCqGtGvCB'
  },
  {
    id: 'ignite-nb-ps',
    name: 'School Pickup Ignite - Neutral Bay Public School',
    programType: 'school-pickup',
    location: 'Neutral Bay Public School',
    dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    stripePriceId: 'price_1StKPKDqupgKyrho5L0t4yPu',
    stripeProductId: 'prod_Tr2U80JbdBmEQS'
  },
  {
    id: 'ignite-redlands',
    name: 'School Pickup Ignite - Redlands School',
    programType: 'school-pickup',
    location: 'Redlands School',
    dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    stripePriceId: 'price_1StKPLDqupgKyrhoXcJwf3Bp',
    stripeProductId: 'prod_Tr2UjbbOsxA9Yu'
  },
  {
    id: 'ignite-stmarys',
    name: 'School Pickup Ignite - St Marys Catholic School',
    programType: 'school-pickup',
    location: 'St Marys Catholic School',
    dayOfWeek: ['wednesday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    stripePriceId: 'price_1StKPMDqupgKyrho5Yb1KWKj',
    stripeProductId: 'prod_Tr2UU6GWX0k98g'
  }
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday'
}

function getProgramColors(programType: IgniteSession['programType']) {
  const colors = {
    'in-school': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-100 text-green-700',
      ring: 'ring-green-500',
      hover: 'hover:bg-green-100 hover:border-green-300'
    },
    'drop-off': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-700',
      ring: 'ring-blue-500',
      hover: 'hover:bg-blue-100 hover:border-blue-300'
    },
    'school-pickup': {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      badge: 'bg-orange-100 text-orange-700',
      ring: 'ring-orange-500',
      hover: 'hover:bg-orange-100 hover:border-orange-300'
    }
  }
  return colors[programType]
}

function getProgramLabel(programType: IgniteSession['programType']) {
  const labels = {
    'in-school': 'In-School',
    'drop-off': 'Drop-Off',
    'school-pickup': 'Pickup'
  }
  return labels[programType]
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return minutes === 0 ? `${displayHours}${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export default function IgniteWeekCalendarStep({ selectedSession, onSessionSelect }: IgniteWeekCalendarStepProps) {
  // Build sessions by day - expand Mon-Fri sessions to appear on each day
  const sessionsByDay = useMemo(() => {
    const byDay: Record<string, Array<IgniteSession & { displayDay: string }>> = {}

    DAYS.forEach(day => {
      byDay[day] = []
    })

    IGNITE_SESSIONS.forEach(session => {
      session.dayOfWeek.forEach(day => {
        if (byDay[day]) {
          byDay[day].push({ ...session, displayDay: day })
        }
      })
    })

    // Sort each day's sessions by start time
    Object.keys(byDay).forEach(day => {
      byDay[day].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    })

    return byDay
  }, [])

  // Check if a day has any sessions
  const daysWithSessions = DAYS.filter(day => sessionsByDay[day].length > 0)

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Session</h3>
      <p className="text-sm text-gray-600 mb-4">Choose a day and time that works for your schedule</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-gray-600">In-School</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-xs text-gray-600">Drop-Off Studio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-xs text-gray-600">School Pickup</span>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {daysWithSessions.map(day => (
          <div key={day} className="space-y-2">
            {/* Day header */}
            <div className="text-center py-2 bg-gray-100 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">{DAY_LABELS[day]}</span>
            </div>

            {/* Sessions for this day */}
            <div className="space-y-2">
              {sessionsByDay[day].map((session, idx) => {
                const colors = getProgramColors(session.programType)
                const isSelected = selectedSession?.id === session.id
                const isMultiDay = session.dayOfWeek.length > 1

                return (
                  <button
                    key={`${session.id}-${day}-${idx}`}
                    onClick={() => onSessionSelect(session)}
                    className={`
                      w-full text-left rounded-lg border-2 p-2 transition-all duration-150
                      ${colors.bg} ${colors.border} ${colors.text} ${colors.hover}
                      ${isSelected ? `ring-2 ${colors.ring} shadow-md border-transparent` : ''}
                    `}
                  >
                    {/* Program type badge */}
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.badge}`}>
                        {getProgramLabel(session.programType)}
                      </span>
                      {isMultiDay && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                          Daily
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <p className="text-xs font-semibold leading-tight truncate" title={session.location}>
                      {session.location}
                    </p>

                    {/* Time */}
                    <p className="text-[11px] opacity-75 mt-0.5">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </p>

                    {/* Price */}
                    <p className="text-xs font-bold mt-1">
                      ${session.priceWeekly.toFixed(2)}<span className="font-normal opacity-75">/wk</span>
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected session summary */}
      {selectedSession && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Selected Session</p>
              <p className="font-semibold text-gray-900 mt-1">{selectedSession.location}</p>
              <p className="text-sm text-gray-600">
                {selectedSession.dayOfWeek.length > 1
                  ? 'Monday - Friday'
                  : DAY_LABELS[selectedSession.dayOfWeek[0]]},{' '}
                {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}
              </p>
              {selectedSession.address && (
                <p className="text-xs text-gray-500 mt-1">{selectedSession.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">${selectedSession.priceWeekly.toFixed(2)}</p>
              <p className="text-xs text-gray-500">per week</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
