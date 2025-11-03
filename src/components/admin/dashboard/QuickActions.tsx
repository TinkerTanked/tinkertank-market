'use client';

import Link from 'next/link';
import {
  PlusIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function QuickActions() {
  const actions = [
    {
      name: 'Add Booking',
      href: '/admin/bookings/new',
      icon: PlusIcon,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      name: 'View Calendar',
      href: '/admin/calendar',
      icon: CalendarDaysIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Add Student',
      href: '/admin/students/new',
      icon: UserPlusIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Export Data',
      href: '/admin/export',
      icon: DocumentArrowDownIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={`${action.color} text-white rounded-lg p-4 flex items-center space-x-3 transition-colors duration-200`}
          >
            <action.icon className="h-5 w-5" />
            <span className="font-medium">{action.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Today&apos;s Summary</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Students scheduled:</span>
            <span className="font-medium">24</span>
          </div>
          <div className="flex justify-between">
            <span>Mentors needed:</span>
            <span className="font-medium">6</span>
          </div>
          <div className="flex justify-between">
            <span>Capacity used:</span>
            <span className="font-medium text-orange-600">80%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
