'use client';

import { useEffect, useState } from 'react';

interface ProgramData {
  name: string;
  bookings: number;
  revenue: number;
  type: string;
}

interface PopularProgramsChartProps {
  timeframe: 'week' | 'month' | 'quarter';
}

export default function PopularProgramsChart({ timeframe }: PopularProgramsChartProps) {
  const [data, setData] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bookings' | 'revenue'>('bookings');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/programs?timeframe=${timeframe}`);
        if (response.ok) {
          const programData = await response.json();
          setData(programData);
        }
      } catch (error) {
        console.error('Failed to fetch program data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const maxValue = Math.max(...data.map((d) => viewMode === 'bookings' ? d.bookings : d.revenue), 0);

  const getTypeColor = (type: string) => {
    const colors = {
      CAMP: 'bg-blue-500',
      BIRTHDAY: 'bg-purple-500',
      SUBSCRIPTION: 'bg-green-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Popular Programs & Time Slots</h3>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('bookings')}
            className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
              viewMode === 'bookings'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setViewMode('revenue')}
            className={`px-3 py-1 text-sm font-medium rounded-r-md border-l-0 border ${
              viewMode === 'revenue'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Revenue
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No program data available</div>
          ) : (
            data.map((program, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {program.name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getTypeColor(program.type)}`}>
                        {program.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {viewMode === 'bookings' ? `${program.bookings} bookings` : `$${program.revenue.toFixed(0)}`}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: maxValue > 0 ? `${((viewMode === 'bookings' ? program.bookings : program.revenue) / maxValue) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            Total {viewMode}: {viewMode === 'bookings' 
              ? data.reduce((sum, item) => sum + item.bookings, 0)
              : `$${data.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}`
            }
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>Camps</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span>Birthdays</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>Subscriptions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
