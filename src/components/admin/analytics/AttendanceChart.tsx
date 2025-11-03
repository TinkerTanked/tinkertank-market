'use client';

import { useEffect, useState } from 'react';

interface AttendanceData {
  date: string;
  attended: number;
  booked: number;
}

interface AttendanceChartProps {
  timeframe: 'week' | 'month' | 'quarter';
}

export default function AttendanceChart({ timeframe }: AttendanceChartProps) {
  const [data, setData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/attendance?timeframe=${timeframe}`);
        if (response.ok) {
          const attendanceData = await response.json();
          setData(attendanceData);
        }
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const maxBookings = Math.max(...data.map((d) => d.booked), 0);
  const avgAttendanceRate = data.length > 0 
    ? (data.reduce((sum, item) => sum + (item.attended / item.booked), 0) / data.length) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Student Attendance Patterns</h3>
        <div className="text-sm text-gray-600">
          Avg: {avgAttendanceRate.toFixed(1)}% attendance
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="h-64 flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full relative group">
                {/* Total bookings bar (background) */}
                <div
                  className="w-full bg-gray-200 rounded-t-sm"
                  style={{
                    height: maxBookings > 0 ? `${(item.booked / maxBookings) * 200}px` : '2px',
                    minHeight: '2px',
                  }}
                ></div>
                {/* Attended students bar (foreground) */}
                <div
                  className="w-full bg-green-500 rounded-t-sm absolute bottom-0 transition-all duration-300 group-hover:bg-green-600"
                  style={{
                    height: maxBookings > 0 ? `${(item.attended / maxBookings) * 200}px` : '2px',
                    minHeight: item.attended > 0 ? '2px' : '0px',
                  }}
                ></div>
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Attended: {item.attended}/{item.booked}
                  <br />
                  Rate: {((item.attended / item.booked) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                {new Date(item.date).toLocaleDateString('en-AU', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Attended</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-gray-600">Booked</span>
          </div>
        </div>
        <div className="text-gray-600">
          Total: {data.reduce((sum, item) => sum + item.attended, 0)} attended of {data.reduce((sum, item) => sum + item.booked, 0)} booked
        </div>
      </div>
    </div>
  );
}
