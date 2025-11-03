'use client';

import { useState } from 'react';
import AttendanceChart from '@/components/admin/analytics/AttendanceChart';
import PopularProgramsChart from '@/components/admin/analytics/PopularProgramsChart';
import CapacityChart from '@/components/admin/analytics/CapacityChart';
import RevenueBreakdownChart from '@/components/admin/analytics/RevenueBreakdownChart';

export default function AdminAnalytics() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
              timeframe === 'week'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-2 text-sm font-medium border-l-0 border ${
              timeframe === 'month'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeframe('quarter')}
            className={`px-3 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
              timeframe === 'quarter'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">87%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">⭐</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Top Program</p>
              <p className="text-lg font-semibold text-gray-900">Robotics Camp</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Capacity Used</p>
              <p className="text-2xl font-semibold text-gray-900">73%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Revenue/Student</p>
              <p className="text-2xl font-semibold text-gray-900">$285</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart timeframe={timeframe} />
        <PopularProgramsChart timeframe={timeframe} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CapacityChart timeframe={timeframe} />
        <RevenueBreakdownChart timeframe={timeframe} />
      </div>

      {/* Detailed Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Peak Hours</p>
              <p className="text-sm text-gray-600">
                Most popular booking times are 2:00-4:00 PM on weekdays and 10:00 AM-12:00 PM on weekends
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Age Demographics</p>
              <p className="text-sm text-gray-600">
                Primary age group is 8-12 years (67%), followed by 6-8 years (23%) and 13+ years (10%)
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Seasonal Trends</p>
              <p className="text-sm text-gray-600">
                School holiday periods show 40% higher booking rates. Consider expanding capacity during these times.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Mentor Utilization</p>
              <p className="text-sm text-gray-600">
                Current mentor-to-student ratio averages 1:4.2. Optimal ratio for program quality is 1:4.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
