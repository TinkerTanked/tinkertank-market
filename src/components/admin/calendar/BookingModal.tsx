'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  textColor: string;
  extendedProps: {
    studentCount: number;
    location: string;
    productType: string;
    mentorsNeeded: number;
    status: string;
  };
}

interface StudentBooking {
  id: string;
  student: {
    name: string;
    birthdate: string;
    allergies: string[];
  };
  status: string;
  totalPrice: number;
  notes?: string;
}

interface BookingModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BookingModal({ event, onClose, onUpdate }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentBooking[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [event.start, event.end]);

  const fetchStudents = async () => {
    setFetchingStudents(true);
    try {
      const params = new URLSearchParams({
        startDate: event.start,
        endDate: event.end,
        location: event.extendedProps.location,
      });

      const response = await fetch(`/api/admin/bookings?${params}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentStatusUpdate = async (bookingId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchStudents();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update student booking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Booking Details
                    </Dialog.Title>

                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-500">{event.extendedProps.productType}</p>
                        </div>
                        {getStatusBadge(event.extendedProps.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="font-medium text-gray-900">Start Time</dt>
                          <dd className="text-gray-600">{formatDateTime(event.start)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900">End Time</dt>
                          <dd className="text-gray-600">{formatDateTime(event.end)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900">Location</dt>
                          <dd className="text-gray-600">{event.extendedProps.location}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900">Students</dt>
                          <dd className="text-gray-600">{event.extendedProps.studentCount}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900">Mentors Needed</dt>
                          <dd className="text-gray-600">{event.extendedProps.mentorsNeeded}</dd>
                        </div>
                      </div>

                      {event.extendedProps.status === 'PENDING' && (
                      <div className="pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h5>
                      <div className="flex space-x-2">
                      <button
                      onClick={() => handleStatusUpdate('CONFIRMED')}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                      {loading ? 'Updating...' : 'Confirm'}
                      </button>
                      <button
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                      {loading ? 'Updating...' : 'Cancel'}
                      </button>
                      </div>
                      </div>
                      )}

                          <div className="pt-4 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Enrolled Students</h5>
                        
                        {fetchingStudents ? (
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                            ))}
                          </div>
                        ) : students.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4">No students enrolled yet.</p>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {students.map((booking) => (
                              <div
                                key={booking.id}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-600 font-medium text-sm">
                                      {booking.student.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm font-medium text-gray-900">
                                        {booking.student.name}
                                      </p>
                                      <span className="text-xs text-gray-500">
                                        Age {calculateAge(booking.student.birthdate)}
                                      </span>
                                    </div>
                                    {booking.student.allergies && booking.student.allergies.length > 0 && (
                                      <div className="flex items-center space-x-1 mt-1">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs text-amber-700 font-medium">
                                          Allergies: {booking.student.allergies.join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-2 mt-1">
                                      {getStatusBadge(booking.status)}
                                      <span className="text-xs text-gray-500">
                                        ${Number(booking.totalPrice || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  {booking.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => handleStudentStatusUpdate(booking.id, 'CONFIRMED')}
                                        disabled={loading}
                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                        title="Confirm booking"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => handleStudentStatusUpdate(booking.id, 'CANCELLED')}
                                        disabled={loading}
                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                        title="Cancel booking"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      // Navigate to full booking details
                      window.location.href = `/admin/bookings/${event.id}`;
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
