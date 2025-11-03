'use client'

import { 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface CalendarControlsProps {
  currentView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  onViewChange: (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void
  totalEvents: number
  totalBookings: number
  totalCapacity: number
  revenue: number
  className?: string
}

export default function CalendarControls({
  currentView,
  onViewChange,
  totalEvents,
  totalBookings,
  totalCapacity,
  revenue,
  className
}: CalendarControlsProps) {
  const utilizationRate = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0

  const views = [
    { id: 'dayGridMonth' as const, label: 'Month', icon: CalendarIcon },
    { id: 'timeGridWeek' as const, label: 'Week', icon: ChartBarIcon },
    { id: 'timeGridDay' as const, label: 'Day', icon: ClockIcon }
  ]

  const stats = [
    {
      label: 'Total Events',
      value: totalEvents.toString(),
      icon: CalendarIcon,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Bookings',
      value: `${totalBookings}/${totalCapacity}`,
      icon: UserGroupIcon,
      color: 'text-green-600 bg-green-50'
    },
    {
      label: 'Utilization',
      value: `${utilizationRate.toFixed(1)}%`,
      icon: ChartBarIcon,
      color: utilizationRate >= 80 ? 'text-green-600 bg-green-50' : 
             utilizationRate >= 60 ? 'text-yellow-600 bg-yellow-50' : 
             'text-red-600 bg-red-50'
    },
    {
      label: 'Revenue',
      value: `$${revenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-purple-600 bg-purple-50'
    }
  ]

  return (
    <div className={clsx('border-b border-gray-200 bg-white', className)}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {views.map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    currentView === view.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{view.label}</span>
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Export
            </button>
            <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              New Event
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="flex items-center space-x-3">
                <div className={clsx('p-2 rounded-lg', stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Daily Utilization</span>
          <span>{utilizationRate.toFixed(1)}% ({totalBookings}/{totalCapacity})</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-300',
              utilizationRate >= 90 ? 'bg-red-500' :
              utilizationRate >= 80 ? 'bg-yellow-500' :
              utilizationRate >= 60 ? 'bg-blue-500' :
              'bg-green-500'
            )}
            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
