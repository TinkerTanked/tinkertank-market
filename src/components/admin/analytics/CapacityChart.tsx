'use client';

import { useEffect, useState } from 'react';

interface CapacityData {
  location: string;
  totalCapacity: number;
  utilizedCapacity: number;
  utilizationRate: number;
}

interface CapacityChartProps {
  timeframe: 'week' | 'month' | 'quarter';
}

export default function CapacityChart({ timeframe }: CapacityChartProps) {
  const [data, setData] = useState<CapacityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/capacity?timeframe=${timeframe}`);
        if (response.ok) {
          const capacityData = await response.json();
          setData(capacityData);
        }
      } catch (error) {
        console.error('Failed to fetch capacity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const avgUtilization = data.length > 0 
    ? data.reduce((sum, item) => sum + item.utilizationRate, 0) / data.length 
    : 0;

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-100';
    if (rate >= 75) return 'text-orange-600 bg-orange-100';
    if (rate >= 50) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 75) return 'bg-orange-500';
    if (rate >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Capacity Utilization Metrics</h3>
        <div className="text-sm text-gray-600">
          Avg: {avgUtilization.toFixed(1)}% utilized
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No capacity data available</div>
          ) : (
            data.map((location, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{location.location}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUtilizationColor(location.utilizationRate)}`}>
                      {location.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {location.utilizedCapacity}/{location.totalCapacity}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getBarColor(location.utilizationRate)}`}
                    style={{
                      width: `${Math.min(location.utilizationRate, 100)}%`,
                    }}
                  ></div>
                  {location.utilizationRate >= 90 && (
                    <div className="absolute right-2 top-0 h-3 w-1 bg-red-700 opacity-50"></div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className="flex items-center">
                    <span className="mr-1">⚠️</span>
                    90% (High utilization)
                  </span>
                  <span>100%</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + item.utilizedCapacity, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + item.totalCapacity, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Capacity</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Capacity Optimization Tip
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              {avgUtilization > 85 
                ? 'Consider expanding capacity or adding more time slots to meet demand.'
                : avgUtilization < 50
                ? 'Low utilization detected. Consider marketing campaigns or program adjustments.'
                : 'Capacity utilization is within optimal range (50-85%).'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
