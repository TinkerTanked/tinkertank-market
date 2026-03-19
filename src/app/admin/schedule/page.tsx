'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, addDays, subDays, startOfWeek, isSameDay, isWeekend } from 'date-fns';
import { clsx } from 'clsx';

interface ScheduleItem {
  id: string;
  timeSlot: string;
  studentId: string;
  studentName: string;
  productName: string;
  productType: 'DAY_CAMP' | 'ALL_DAY_CAMP';
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  status: string;
}

interface ScheduleData {
  date: string;
  items: ScheduleItem[];
  summary: {
    totalStudents: number;
    mentorsNeeded: number;
    dayCampCount: number;
    allDayCampCount: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', colors[status] || 'bg-gray-100 text-gray-800')}>
      {status}
    </span>
  );
}

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/admin/schedule?date=${dateStr}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchSchedule();
  }, [selectedDate]);

  const goToToday = () => setSelectedDate(new Date());
  const goToPrev = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNext = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Daily Schedule</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrev}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex space-x-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={clsx(
                'flex-1 py-3 px-2 rounded-lg text-center transition-colors',
                isSelected
                  ? 'bg-orange-600 text-white'
                  : isToday
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="text-xs font-medium">{format(day, 'EEE')}</div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
              <div className="text-xs">{format(day, 'MMM')}</div>
            </button>
          );
        })}
      </div>

      {data?.summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{data.summary.totalStudents}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{data.summary.mentorsNeeded}</div>
            <div className="text-sm text-gray-500">Mentors Needed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{data.summary.dayCampCount}</div>
            <div className="text-sm text-gray-500">Day Camp (9-3)</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{data.summary.allDayCampCount}</div>
            <div className="text-sm text-gray-500">All Day (9-5)</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No bookings for this date
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Slot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'px-2 py-1 text-sm font-medium rounded',
                      item.productType === 'ALL_DAY_CAMP'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    )}>
                      {item.timeSlot}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/students/${item.studentId}`}
                      className="text-orange-600 hover:text-orange-800 font-medium"
                    >
                      {item.studentName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.parentName}</div>
                    <div className="text-sm text-gray-500">{item.parentEmail}</div>
                    {item.parentPhone && (
                      <div className="text-sm text-gray-500">{item.parentPhone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
