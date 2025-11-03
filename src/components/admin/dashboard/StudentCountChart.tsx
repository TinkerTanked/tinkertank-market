'use client';

import { useEffect, useState } from 'react';

interface StudentCountData {
  date: string;
  count: number;
  capacity: number;
}

export default function StudentCountChart() {
  const [data, setData] = useState<StudentCountData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics/student-counts');
        if (response.ok) {
          const studentData = await response.json();
          setData(studentData);
        }
      } catch (error) {
        console.error('Failed to fetch student count data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const maxCapacity = Math.max(...data.map((d) => d.capacity), 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Daily Student Counts</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-600 rounded-full mr-2"></div>
            <span className="text-gray-600">Students</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-gray-600">Capacity</span>
          </div>
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
                {/* Capacity bar (background) */}
                <div
                  className="w-full bg-gray-200 rounded-t-sm"
                  style={{
                    height: maxCapacity > 0 ? `${(item.capacity / maxCapacity) * 200}px` : '2px',
                    minHeight: '2px',
                  }}
                ></div>
                {/* Student count bar (foreground) */}
                <div
                  className="w-full bg-orange-600 rounded-t-sm absolute bottom-0 transition-all duration-300 group-hover:bg-orange-700"
                  style={{
                    height: maxCapacity > 0 ? `${(item.count / maxCapacity) * 200}px` : '2px',
                    minHeight: item.count > 0 ? '2px' : '0px',
                  }}
                ></div>
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.count}/{item.capacity} ({((item.count / item.capacity) * 100).toFixed(0)}%)
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                {new Date(item.date).toLocaleDateString('en-AU', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600">
        <div>
          <div className="text-gray-900 font-medium">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div>Total Students</div>
        </div>
        <div>
          <div className="text-gray-900 font-medium">
            {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.count, 0) / data.length) : 0}
          </div>
          <div>Daily Average</div>
        </div>
        <div>
          <div className="text-orange-600 font-medium">
            {data.length > 0 
              ? Math.round((data.reduce((sum, item) => sum + (item.count / item.capacity), 0) / data.length) * 100)
              : 0}%
          </div>
          <div>Avg Utilization</div>
        </div>
      </div>
    </div>
  );
}
