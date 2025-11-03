'use client';

import { useEffect, useState } from 'react';
import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import RecentBookings from '@/components/admin/dashboard/RecentBookings';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import StudentCountChart from '@/components/admin/dashboard/StudentCountChart';

interface DashboardData {
  todayStudentCount: number;
  weekStudentCount: number;
  monthStudentCount: number;
  pendingBookings: number;
  totalRevenue: number;
  weeklyRevenue: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats data={data} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <StudentCountChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentBookings />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
