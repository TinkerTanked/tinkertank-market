'use client';

import { useEffect, useState } from 'react';

interface RevenueData {
  date: string;
  revenue: number;
}

export default function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/revenue?timeframe=${timeframe}`);
        if (response.ok) {
          const revenueData = await response.json();
          setData(revenueData);
        }
      } catch (error) {
        console.error('Failed to fetch revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  // Calculate max revenue for scaling
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Revenue Trends</h3>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
              timeframe === 'week'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 text-sm font-medium rounded-r-md border-l-0 border ${
              timeframe === 'month'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
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
              <div className="w-full bg-gray-200 rounded-t-sm relative group">
                <div
                  className="w-full bg-orange-600 rounded-t-sm transition-all duration-300 group-hover:bg-orange-700"
                  style={{
                    height: maxRevenue > 0 ? `${(item.revenue / maxRevenue) * 200}px` : '2px',
                    minHeight: '2px',
                  }}
                ></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ${item.revenue.toFixed(0)}
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

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Total: $
          {data.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
        </div>
        <div>
          Avg: $
          {data.length > 0 ? (data.reduce((sum, item) => sum + item.revenue, 0) / data.length).toFixed(2) : '0.00'}
        </div>
      </div>
    </div>
  );
}
