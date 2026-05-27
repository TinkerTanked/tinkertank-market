'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, startOfMonth, isSameDay, isSameMonth } from 'date-fns';
import { clsx } from 'clsx';

interface ScheduleItem {
  id: string;
  timeSlot: string;
  studentId: string;
  studentName: string;
  productName: string;
  productType: 'DAY_CAMP' | 'ALL_DAY_CAMP' | 'BIRTHDAY';
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  status: string;
  locationId: string;
  locationName: string;
}

interface LocationSummary {
  totalStudents: number;
  dayCampCount: number;
  allDayCampCount: number;
  birthdayCount: number;
  mentorsNeeded: number;
}

interface ScheduleData {
  date: string;
  locations: { id: string; name: string }[];
  items: ScheduleItem[];
  summary: {
    totalStudents: number;
    mentorsNeeded: number;
    dayCampCount: number;
    allDayCampCount: number;
    birthdayCount: number;
    byLocation: Record<string, LocationSummary>;
  };
}

interface WeekDayData {
  date: string;
  dayName: string;
  byLocation: Record<string, LocationSummary>;
  totalStudents: number;
  dayCampCount: number;
  allDayCampCount: number;
  birthdayCount: number;
  mentorsNeeded: number;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  locations: { id: string; name: string }[];
  days: WeekDayData[];
}

interface MonthData {
  monthStart: string;
  monthEnd: string;
  calendarStart: string;
  monthLabel: string;
  locations: { id: string; name: string }[];
  days: WeekDayData[];
}

type ViewMode = 'day' | 'week' | 'month';

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

function SummaryCards({ summary, locationId }: {
  summary: ScheduleData['summary'];
  locationId: string | null;
}) {
  const stats = locationId && summary.byLocation[locationId]
    ? summary.byLocation[locationId]
    : {
        totalStudents: summary.totalStudents,
        dayCampCount: summary.dayCampCount,
        allDayCampCount: summary.allDayCampCount,
        birthdayCount: summary.birthdayCount,
        mentorsNeeded: summary.mentorsNeeded
      };

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
        <div className="text-sm text-gray-500">Total Students</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-orange-600">{stats.mentorsNeeded}</div>
        <div className="text-sm text-gray-500">Mentors Needed</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-blue-600">{stats.dayCampCount}</div>
        <div className="text-sm text-gray-500">Day Camp (9-3)</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-purple-600">{stats.allDayCampCount}</div>
        <div className="text-sm text-gray-500">All Day (9-5)</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-pink-600">{stats.birthdayCount}</div>
        <div className="text-sm text-gray-500">Birthday Parties</div>
      </div>
    </div>
  );
}

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [data, setData] = useState<ScheduleData | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const locations = viewMode === 'month'
    ? monthData?.locations ?? []
    : viewMode === 'week'
      ? weekData?.locations ?? []
      : data?.locations ?? [];

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      if (viewMode === 'month') {
        const res = await fetch(`/api/admin/schedule?mode=month&date=${dateStr}`);
        const json = await res.json();
        setMonthData(json);
      } else if (viewMode === 'week') {
        const res = await fetch(`/api/admin/schedule?mode=week&date=${dateStr}`);
        const json = await res.json();
        setWeekData(json);
      } else {
        const res = await fetch(`/api/admin/schedule?date=${dateStr}`);
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    }
    fetchSchedule();
  }, [selectedDate, viewMode]);

  const goToToday = () => setSelectedDate(new Date());
  const goToPrev = () => setSelectedDate(
    viewMode === 'month' ? subMonths(selectedDate, 1) : viewMode === 'week' ? subWeeks(selectedDate, 1) : subDays(selectedDate, 1)
  );
  const goToNext = () => setSelectedDate(
    viewMode === 'month' ? addMonths(selectedDate, 1) : viewMode === 'week' ? addWeeks(selectedDate, 1) : addDays(selectedDate, 1)
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (!selectedLocationId) return data.items;
    return data.items.filter(item => item.locationId === selectedLocationId);
  }, [data, selectedLocationId]);

  const groupedByLocation = useMemo(() => {
    const groups: Record<string, { locationName: string; items: ScheduleItem[] }> = {};
    for (const item of filteredItems) {
      if (!groups[item.locationId]) {
        groups[item.locationId] = { locationName: item.locationName, items: [] };
      }
      groups[item.locationId].items.push(item);
    }
    return Object.entries(groups).sort(([, a], [, b]) => a.locationName.localeCompare(b.locationName));
  }, [filteredItems]);

  const handleWeekDayClick = (dateStr: string) => {
    setSelectedDate(new Date(dateStr + 'T00:00:00'));
    setViewMode('day');
  };

  return (
    <div className="space-y-6">
      {/* Header with title, view toggle, and navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {viewMode === 'month' ? 'Monthly Schedule' : viewMode === 'week' ? 'Weekly Schedule' : 'Daily Schedule'}
        </h1>
        <div className="flex items-center space-x-4">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('day')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'day'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              Month
            </button>
          </div>

          {/* Date navigation */}
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
      </div>

      {/* Location filter */}
      {locations.length > 0 && (
        <div className="flex items-center space-x-2">
          <MapPinIcon className="w-5 h-5 text-gray-400" />
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setSelectedLocationId(null)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                selectedLocationId === null
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              All Locations
            </button>
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300',
                  selectedLocationId === loc.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'month' ? (
        /* Month View */
        <MonthView
          monthData={monthData}
          loading={loading}
          selectedDate={selectedDate}
          selectedLocationId={selectedLocationId}
          onDayClick={handleWeekDayClick}
        />
      ) : viewMode === 'week' ? (
        /* Week View */
        <WeekView
          weekData={weekData}
          loading={loading}
          selectedLocationId={selectedLocationId}
          onDayClick={handleWeekDayClick}
        />
      ) : (
        /* Day View */
        <>
          {/* Week day selector */}
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
            <SummaryCards summary={data.summary} locationId={selectedLocationId} />
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No bookings for this date
              </div>
            ) : (
              groupedByLocation.map(([locationId, group]) => (
                <div key={locationId}>
                  {/* Location header - show when viewing all locations */}
                  {!selectedLocationId && groupedByLocation.length > 1 && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">{group.locationName}</span>
                      <span className="text-xs text-gray-500">({group.items.length} students)</span>
                    </div>
                  )}
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
                          Location
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
                      {group.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={clsx(
                              'px-2 py-1 text-sm font-medium rounded',
                              item.productType === 'BIRTHDAY'
                                ? 'bg-pink-100 text-pink-800'
                                : item.productType === 'ALL_DAY_CAMP'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                            )}>
                              {item.productType === 'BIRTHDAY' && '🎂 '}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.locationName}
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
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MonthView({ monthData, loading, selectedDate, selectedLocationId, onDayClick }: {
  monthData: MonthData | null;
  loading: boolean;
  selectedDate: Date;
  selectedLocationId: string | null;
  onDayClick: (dateStr: string) => void;
}) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!monthData) {
    return <div className="p-8 text-center text-gray-500">No data available</div>;
  }

  const currentMonth = startOfMonth(selectedDate);

  // Group days into weeks of 7
  const weeks: typeof monthData.days[] = [];
  for (let i = 0; i < monthData.days.length; i += 7) {
    weeks.push(monthData.days.slice(i, i + 7));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">{monthData.monthLabel}</h2>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 uppercase py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(day => {
              const dayDate = new Date(day.date + 'T00:00:00');
              const isCurrentMonth = isSameMonth(dayDate, currentMonth);
              const isToday = isSameDay(dayDate, new Date());
              const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

              const stats = selectedLocationId && day.byLocation[selectedLocationId]
                ? day.byLocation[selectedLocationId]
                : {
                    totalStudents: day.totalStudents,
                    dayCampCount: day.dayCampCount,
                    allDayCampCount: day.allDayCampCount,
                    birthdayCount: day.birthdayCount,
                    mentorsNeeded: day.mentorsNeeded
                  };

              return (
                <button
                  key={day.date}
                  onClick={() => onDayClick(day.date)}
                  className={clsx(
                    'rounded-lg border p-2 text-left transition-colors min-h-[90px]',
                    'hover:border-orange-400 hover:shadow-sm',
                    !isCurrentMonth && 'opacity-40',
                    isWeekend && 'bg-gray-50',
                    isToday
                      ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400'
                      : stats.totalStudents > 0
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50/50'
                  )}
                >
                  <div className={clsx(
                    'text-sm font-semibold mb-1',
                    isToday ? 'text-orange-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {format(dayDate, 'd')}
                  </div>
                  {stats.totalStudents > 0 && (
                    <div className="space-y-0.5">
                      <div className="text-lg font-bold text-gray-900 leading-tight">{stats.totalStudents}</div>
                      <div className="flex items-center flex-wrap gap-x-1 text-[10px]">
                        {stats.dayCampCount > 0 && <span className="text-blue-600">{stats.dayCampCount}d</span>}
                        {stats.allDayCampCount > 0 && <span className="text-purple-600">{stats.allDayCampCount}ad</span>}
                        {stats.birthdayCount > 0 && <span className="text-pink-600">🎂{stats.birthdayCount}</span>}
                      </div>
                      {stats.mentorsNeeded > 0 && (
                        <div className="text-[10px] text-orange-600 font-medium">
                          {stats.mentorsNeeded}m
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ weekData, loading, selectedLocationId, onDayClick }: {
  weekData: WeekData | null;
  loading: boolean;
  selectedLocationId: string | null;
  onDayClick: (dateStr: string) => void;
}) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!weekData) {
    return <div className="p-8 text-center text-gray-500">No data available</div>;
  }

  const weekLabel = `${format(new Date(weekData.weekStart + 'T00:00:00'), 'MMM d')} – ${format(new Date(weekData.weekEnd + 'T00:00:00'), 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">{weekLabel}</h2>
      <div className="grid grid-cols-7 gap-3">
        {weekData.days.map(day => {
          const isToday = isSameDay(new Date(day.date + 'T00:00:00'), new Date());
          const stats = selectedLocationId && day.byLocation[selectedLocationId]
            ? day.byLocation[selectedLocationId]
            : {
                totalStudents: day.totalStudents,
                dayCampCount: day.dayCampCount,
                allDayCampCount: day.allDayCampCount,
                birthdayCount: day.birthdayCount,
                mentorsNeeded: day.mentorsNeeded
              };

          return (
            <button
              key={day.date}
              onClick={() => onDayClick(day.date)}
              className={clsx(
                'rounded-lg border p-4 text-left transition-colors hover:border-orange-400 hover:shadow-sm',
                isToday
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase">{day.dayName}</span>
                <span className={clsx(
                  'text-lg font-bold',
                  isToday ? 'text-orange-600' : 'text-gray-900'
                )}>
                  {format(new Date(day.date + 'T00:00:00'), 'd')}
                </span>
              </div>
              {stats.totalStudents > 0 ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{stats.totalStudents}</div>
                    <div className="text-xs text-gray-500">students</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="text-blue-600">{stats.dayCampCount} day</span>
                    <span className="text-purple-600">{stats.allDayCampCount} all day</span>
                    {stats.birthdayCount > 0 && (
                      <span className="text-pink-600">🎂 {stats.birthdayCount}</span>
                    )}
                  </div>
                  {stats.mentorsNeeded > 0 && (
                    <div className="text-xs text-orange-600 font-medium">
                      {stats.mentorsNeeded} mentors
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-2">No bookings</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
