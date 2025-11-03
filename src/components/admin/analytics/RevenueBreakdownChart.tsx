'use client';

import { useEffect, useState } from 'react';

interface RevenueBreakdownData {
  type: string;
  revenue: number;
  percentage: number;
  bookings: number;
}

interface RevenueBreakdownChartProps {
  timeframe: 'week' | 'month' | 'quarter';
}

export default function RevenueBreakdownChart({ timeframe }: RevenueBreakdownChartProps) {
  const [data, setData] = useState<RevenueBreakdownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/revenue-breakdown?timeframe=${timeframe}`);
        if (response.ok) {
          const revenueData = await response.json();
          setData(revenueData);
        }
      } catch (error) {
        console.error('Failed to fetch revenue breakdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  const getTypeColor = (type: string) => {
    const colors = {
      CAMP: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-700', stroke: '#3B82F6' },
      BIRTHDAY: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-700', stroke: '#8B5CF6' },
      SUBSCRIPTION: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-700', stroke: '#10B981' },
    };
    return colors[type as keyof typeof colors] || { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-700', stroke: '#6B7280' };
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      CAMP: 'Camps',
      BIRTHDAY: 'Birthday Parties',
      SUBSCRIPTION: 'Subscriptions',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Revenue Breakdown by Product Type</h3>
        <div className="text-sm text-gray-600">
          Total: ${totalRevenue.toFixed(2)}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                  fill="transparent"
                  className="opacity-25"
                />
                {data.length > 0 && (() => {
                  let cumulativePercentage = 0;
                  return data.map((item, index) => {
                    const startAngle = cumulativePercentage * 360;
                    const endAngle = (cumulativePercentage + item.percentage / 100) * 360;
                    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                    
                    const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                    const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                    const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                    const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const pathData = [
                      `M ${startX} ${startY}`,
                      `A 40 40 0 ${largeArc} 1 ${endX} ${endY}`,
                    ].join(' ');
                    
                    cumulativePercentage += item.percentage / 100;
                    
                    const colors = getTypeColor(item.type);
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        stroke={colors.stroke}
                        strokeWidth="8"
                        fill="transparent"
                        className="hover:opacity-75 transition-opacity"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend & Details */}
          <div className="space-y-3">
            {data.length === 0 ? (
              <div className="text-center text-gray-500">No revenue data available</div>
            ) : (
              data.map((item, index) => {
                const colors = getTypeColor(item.type);
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${colors.bg}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">{getTypeLabel(item.type)}</div>
                        <div className="text-sm text-gray-600">{item.bookings} bookings</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${item.revenue.toFixed(2)}</div>
                      <div className={`text-sm font-medium ${colors.text}`}>{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Revenue Per Booking Analysis */}
          {data.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Revenue per Booking</h4>
              <div className="grid grid-cols-1 gap-2">
                {data.map((item, index) => {
                  const revenuePerBooking = item.bookings > 0 ? item.revenue / item.bookings : 0;
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{getTypeLabel(item.type)}</span>
                      <span className="font-medium text-gray-900">${revenuePerBooking.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
