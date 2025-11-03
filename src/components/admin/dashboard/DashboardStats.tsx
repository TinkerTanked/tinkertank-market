'use client';

import { UserGroupIcon, CalendarIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface DashboardData {
  todayStudentCount: number;
  weekStudentCount: number;
  monthStudentCount: number;
  pendingBookings: number;
  totalRevenue: number;
  weeklyRevenue: number;
}

interface DashboardStatsProps {
  data: DashboardData | null;
}

export default function DashboardStats({ data }: DashboardStatsProps) {
  const stats = [
    {
      name: 'Today&apos;s Students',
      value: data?.todayStudentCount || 0,
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      name: 'This Week',
      value: data?.weekStudentCount || 0,
      icon: CalendarIcon,
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      name: 'Pending Bookings',
      value: data?.pendingBookings || 0,
      icon: ClockIcon,
      change: '-2',
      changeType: 'decrease' as const,
    },
    {
      name: 'Weekly Revenue',
      value: `$${data?.weeklyRevenue?.toFixed(2) || '0.00'}`,
      icon: CurrencyDollarIcon,
      change: '+15%',
      changeType: 'increase' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
