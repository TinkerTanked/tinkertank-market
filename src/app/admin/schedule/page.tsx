'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, MagnifyingGlassIcon, PhoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, startOfMonth, isSameDay, isSameMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { clsx } from 'clsx';

const TIMEZONE = 'Australia/Sydney';

function formatSydneyTime(iso: string): string {
  return format(toZonedTime(new Date(iso), TIMEZONE), 'h:mma').toLowerCase();
}

export function formatDuration(fromIso: string, toIso: string): string {
  const mins = Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface ScheduleItem {
  id: string;
  timeSlot: string;
  studentId: string;
  studentName: string;
  productName: string;
  productType: 'DAY_CAMP' | 'ALL_DAY_CAMP' | 'BIRTHDAY' | 'IGNITE';
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  allergies: string | null;
  medicalNotes: string | null;
  status: string;
  locationId: string;
  locationName: string;
  checkInAt: string | null;
  checkInBy: string | null;
  checkOutAt: string | null;
  checkOutBy: string | null;
}

interface LocationSummary {
  totalStudents: number;
  dayCampCount: number;
  allDayCampCount: number;
  birthdayCount: number;
  igniteCount: number;
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
    igniteCount: number;
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
  igniteCount: number;
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

const TYPE_STYLES: Record<ScheduleItem['productType'], { label: string; className: string }> = {
  DAY_CAMP: { label: 'Day camp', className: 'bg-blue-50 text-blue-700' },
  ALL_DAY_CAMP: { label: 'All day', className: 'bg-purple-50 text-purple-700' },
  BIRTHDAY: { label: 'Birthday', className: 'bg-pink-50 text-pink-700' },
  IGNITE: { label: 'Ignite', className: 'bg-green-50 text-green-700' }
};

function hasNote(value: string | null) {
  return !!value && !/^(n\/?a|none|nil|no)$/i.test(value.trim());
}

function StudentCheckInCard({ item, mentorName, busy, onAction }: {
  item: ScheduleItem;
  mentorName: string;
  busy: boolean;
  onAction: (item: ScheduleItem, action: 'checkin' | 'checkout') => void;
}) {
  const canAct = mentorName.trim().length > 0 && !busy;
  const type = TYPE_STYLES[item.productType];
  const state = item.checkOutAt ? 'out' : item.checkInAt ? 'in' : 'expected';

  return (
    <li
      className={clsx(
        'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
        state === 'in' && 'bg-green-50/60',
        state === 'out' && 'bg-gray-50'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/students/${item.studentId}`} className="text-base font-semibold text-gray-900 hover:text-orange-700">
            {item.studentName}
          </Link>
          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', type.className)}>
            {type.label} · {item.timeSlot}
          </span>
        </div>
        <div className="mt-1 truncate text-sm text-gray-500">
          {item.productType === 'DAY_CAMP' || item.productType === 'ALL_DAY_CAMP' ? item.parentName : `${item.productName} · ${item.parentName}`}
        </div>
        {(hasNote(item.allergies) || hasNote(item.medicalNotes)) && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <span>
              {[hasNote(item.allergies) && `Allergies: ${item.allergies}`, hasNote(item.medicalNotes) && `Medical: ${item.medicalNotes}`]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        )}
        {state !== 'expected' && item.checkInAt && (
          <div className="mt-2 text-sm text-gray-600">
            In {formatSydneyTime(item.checkInAt)}
            {item.checkOutAt && ` · Out ${formatSydneyTime(item.checkOutAt)} · ${formatDuration(item.checkInAt, item.checkOutAt)}`}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:flex-shrink-0">
        {item.parentPhone && (
          <a
            href={`tel:${item.parentPhone.replace(/[^\d+]/g, '')}`}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            aria-label={`Call ${item.parentName}`}
          >
            <PhoneIcon className="h-5 w-5" />
          </a>
        )}
        {state === 'expected' && (
          <button
            onClick={() => onAction(item, 'checkin')}
            disabled={!canAct}
            className="h-12 flex-1 rounded-xl bg-orange-600 px-6 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-40 sm:flex-none"
          >
            {busy ? 'Saving…' : 'Check in'}
          </button>
        )}
        {state === 'in' && (
          <button
            onClick={() => onAction(item, 'checkout')}
            disabled={!canAct}
            className="h-12 flex-1 rounded-xl bg-gray-900 px-6 text-base font-semibold text-white hover:bg-gray-800 disabled:opacity-40 sm:flex-none"
          >
            {busy ? 'Saving…' : 'Check out'}
          </button>
        )}
        {state === 'out' && (
          <span className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-100 px-6 text-sm font-semibold text-gray-500 sm:flex-none">
            Picked up
          </span>
        )}
      </div>
    </li>
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
        igniteCount: summary.igniteCount,
        mentorsNeeded: summary.mentorsNeeded
      };

  const cards = [
    { label: 'Students', value: stats.totalStudents, className: 'text-gray-900' },
    { label: 'Mentors needed', value: stats.mentorsNeeded, className: 'text-orange-600' },
    { label: 'Day camp', value: stats.dayCampCount, className: 'text-blue-600' },
    { label: 'All day', value: stats.allDayCampCount, className: 'text-purple-600' },
    { label: 'Birthdays', value: stats.birthdayCount, className: 'text-pink-600' },
    { label: 'Ignite', value: stats.igniteCount, className: 'text-green-600' }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
      {cards.map(card => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <div className={clsx('text-xl font-bold sm:text-2xl', card.className)}>{card.value}</div>
          <div className="text-xs text-gray-500 sm:text-sm">{card.label}</div>
        </div>
      ))}
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
  const [mentorName, setMentorName] = useState('');
  const [attendanceBusy, setAttendanceBusy] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');

  // Remember the mentor on duty on this device so it isn't re-typed per student.
  useEffect(() => {
    setMentorName(localStorage.getItem('scheduleMentorName') || '');
  }, []);
  const updateMentorName = (name: string) => {
    setMentorName(name);
    localStorage.setItem('scheduleMentorName', name);
  };

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
  }, [selectedDate, viewMode, refreshKey]);

  const handleAttendance = async (item: ScheduleItem, action: 'checkin' | 'checkout') => {
    if (!mentorName.trim()) return;
    setAttendanceBusy(item.id);
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: item.id, action, mentorName: mentorName.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update attendance');
      } else {
        setRefreshKey(k => k + 1);
      }
    } finally {
      setAttendanceBusy(null);
    }
  };

  const goToToday = () => setSelectedDate(new Date());
  const goToPrev = () => setSelectedDate(
    viewMode === 'month' ? subMonths(selectedDate, 1) : viewMode === 'week' ? subWeeks(selectedDate, 1) : subDays(selectedDate, 1)
  );
  const goToNext = () => setSelectedDate(
    viewMode === 'month' ? addMonths(selectedDate, 1) : viewMode === 'week' ? addWeeks(selectedDate, 1) : addDays(selectedDate, 1)
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.items.filter(item =>
      (!selectedLocationId || item.locationId === selectedLocationId) &&
      (!query || item.studentName.toLowerCase().includes(query) || item.parentName.toLowerCase().includes(query))
    );
  }, [data, selectedLocationId, search]);

  const checkedInCount = filteredItems.filter(item => item.checkInAt && !item.checkOutAt).length;

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

  const segment = (active: boolean) => clsx(
    'flex-1 px-3 py-2 text-sm font-medium sm:flex-none sm:px-4',
    active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {viewMode === 'month' ? 'Monthly schedule' : viewMode === 'week' ? 'Weekly schedule' : 'Check-in'}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-300 sm:flex-none">
            <button onClick={() => setViewMode('day')} className={segment(viewMode === 'day')}>Day</button>
            <button onClick={() => setViewMode('week')} className={clsx(segment(viewMode === 'week'), 'border-l border-gray-300')}>Week</button>
            <button onClick={() => setViewMode('month')} className={clsx(segment(viewMode === 'month'), 'border-l border-gray-300')}>Month</button>
          </div>
          <button onClick={goToPrev} className="rounded-lg border border-gray-300 bg-white p-2.5 hover:bg-gray-50" aria-label="Previous">
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button onClick={goToToday} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Today
          </button>
          <button onClick={goToNext} className="rounded-lg border border-gray-300 bg-white p-2.5 hover:bg-gray-50" aria-label="Next">
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {locations.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ id: null as string | null, name: 'All locations' }, ...locations].map(loc => (
            <button
              key={loc.id ?? 'all'}
              onClick={() => setSelectedLocationId(loc.id)}
              className={clsx(
                'flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium',
                selectedLocationId === loc.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
              )}
            >
              {loc.id && <MapPinIcon className="h-4 w-4" />}
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'month' ? (
        <MonthView
          monthData={monthData}
          loading={loading}
          selectedDate={selectedDate}
          selectedLocationId={selectedLocationId}
          onDayClick={handleWeekDayClick}
        />
      ) : viewMode === 'week' ? (
        <WeekView
          weekData={weekData}
          loading={loading}
          selectedLocationId={selectedLocationId}
          onDayClick={handleWeekDayClick}
        />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map(day => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={clsx(
                    'rounded-lg py-2 text-center sm:py-3',
                    isSelected
                      ? 'bg-orange-600 text-white'
                      : isToday
                        ? 'bg-orange-100 text-orange-700'
                        : 'border border-gray-200 bg-white text-gray-700'
                  )}
                >
                  <div className="text-[11px] font-medium sm:text-xs">{format(day, 'EEE')}</div>
                  <div className="text-base font-semibold sm:text-lg">{format(day, 'd')}</div>
                </button>
              );
            })}
          </div>

          {data?.summary && <SummaryCards summary={data.summary} locationId={selectedLocationId} />}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="space-y-3 border-b border-gray-200 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{format(selectedDate, 'EEEE d MMMM')}</h2>
                {filteredItems.length > 0 && (
                  <span className="text-sm text-gray-500">{checkedInCount} of {filteredItems.length} here</span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="sr-only">Mentor on duty</span>
                  <input
                    id="mentorName"
                    type="text"
                    value={mentorName}
                    onChange={e => updateMentorName(e.target.value)}
                    placeholder="Mentor on duty (your name)"
                    autoComplete="name"
                    className={clsx(
                      'h-12 w-full rounded-xl border px-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500',
                      mentorName.trim() ? 'border-gray-300' : 'border-orange-300 bg-orange-50'
                    )}
                  />
                </label>
                <label className="relative block">
                  <span className="sr-only">Search students</span>
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search student or parent"
                    className="h-12 w-full rounded-xl border border-gray-300 pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>
              </div>
              {!mentorName.trim() && <p className="text-sm text-orange-700">Enter your name to check students in and out.</p>}
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading…</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{search ? 'No matching students' : 'No bookings for this date'}</div>
            ) : (
              groupedByLocation.map(([locationId, group]) => (
                <section key={locationId}>
                  {groupedByLocation.length > 1 && (
                    <div className="sticky top-14 z-10 flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 lg:top-0">
                      <MapPinIcon className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">{group.locationName}</span>
                      <span className="text-xs text-gray-500">{group.items.length}</span>
                    </div>
                  )}
                  <ul className="divide-y divide-gray-100">
                    {group.items.map(item => (
                      <StudentCheckInCard
                        key={item.id}
                        item={item}
                        mentorName={mentorName}
                        busy={attendanceBusy === item.id}
                        onAction={handleAttendance}
                      />
                    ))}
                  </ul>
                </section>
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
                    igniteCount: day.igniteCount,
                    mentorsNeeded: day.mentorsNeeded
                  };

              return (
                <button
                  key={day.date}
                  onClick={() => onDayClick(day.date)}
                  className={clsx(
                    'rounded-lg border p-1 sm:p-2 text-left transition-colors min-h-[64px] sm:min-h-[90px]',
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
                        {stats.igniteCount > 0 && <span className="text-green-600">⚡{stats.igniteCount}</span>}
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
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-3 sm:px-0">
        {weekData.days.map(day => {
          const isToday = isSameDay(new Date(day.date + 'T00:00:00'), new Date());
          const stats = selectedLocationId && day.byLocation[selectedLocationId]
            ? day.byLocation[selectedLocationId]
            : {
                totalStudents: day.totalStudents,
                dayCampCount: day.dayCampCount,
                allDayCampCount: day.allDayCampCount,
                birthdayCount: day.birthdayCount,
                igniteCount: day.igniteCount,
                mentorsNeeded: day.mentorsNeeded
              };

          return (
            <button
              key={day.date}
              onClick={() => onDayClick(day.date)}
              className={clsx(
                'min-w-[132px] flex-shrink-0 rounded-lg border p-4 text-left transition-colors hover:border-orange-400 hover:shadow-sm sm:min-w-0',
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
                    {stats.igniteCount > 0 && (
                      <span className="text-green-600">⚡ {stats.igniteCount}</span>
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
