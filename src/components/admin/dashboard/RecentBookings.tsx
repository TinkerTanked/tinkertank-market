'use client';

import { useEffect, useState } from 'react';
import { formatDistance } from 'date-fns';

interface Booking {
  id: string;
  student: { name: string };
  product: { name: string };
  location: { name: string };
  startDate: string;
  status: string;
  totalPrice: number;
}

export default function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings/recent');
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } catch (error) {
        console.error('Failed to fetch recent bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No recent bookings</div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-medium text-sm">
                          {booking.student.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.student.name}
                        </p>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {booking.product.name} at {booking.location.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistance(new Date(booking.startDate), new Date(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-sm font-medium text-gray-900">
                  ${booking.totalPrice.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {bookings.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <a
            href="/admin/bookings"
            className="text-sm font-medium text-orange-600 hover:text-orange-500"
          >
            View all bookings →
          </a>
        </div>
      )}
    </div>
  );
}
