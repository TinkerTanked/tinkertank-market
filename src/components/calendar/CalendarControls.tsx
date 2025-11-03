'use client'

import { 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  PlusIcon
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
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      label: 'Bookings',
      value: `${totalBookings}/${totalCapacity}`,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      label: 'Utilization',
      value: `${utilizationRate.toFixed(1)}%`,
      icon: ArrowTrendingUpIcon,
      color: utilizationRate >= 80 ? 'bg-green-500' : 
             utilizationRate >= 60 ? 'bg-amber-500' : 
             'bg-red-500',
      lightColor: utilizationRate >= 80 ? 'bg-green-50' : 
                  utilizationRate >= 60 ? 'bg-amber-50' : 
                  'bg-red-50',
      textColor: utilizationRate >= 80 ? 'text-green-700' : 
                 utilizationRate >= 60 ? 'text-amber-700' : 
                 'text-red-700'
    },
    {
      label: 'Revenue',
      value: `$${(revenue / 1000).toFixed(1)}k`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ]

  return (
    <div className={clsx('border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white', className)}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
            {views.map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                    currentView === view.id
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{view.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-sm">
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-md">
              <PlusIcon className="h-4 w-4" />
              New Event
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div 
                key={stat.label} 
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('p-3 rounded-lg', stat.lightColor)}>
                    <Icon className={clsx('h-6 w-6', stat.textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-gray-500" />
              <span>Capacity Utilization</span>
            </div>
            <span className="text-gray-900 font-bold">
              {utilizationRate.toFixed(1)}% 
              <span className="text-gray-500 font-normal ml-1">
                ({totalBookings}/{totalCapacity})
              </span>
            </span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={clsx(
                'h-3 rounded-full transition-all duration-500 ease-out',
                utilizationRate >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                utilizationRate >= 80 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                utilizationRate >= 60 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                'bg-gradient-to-r from-green-500 to-green-600'
              )}
              style={{ width: `${Math.min(utilizationRate, 100)}%` }}
            >
              <div className="h-full w-full opacity-30 bg-white animate-pulse-slow" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
