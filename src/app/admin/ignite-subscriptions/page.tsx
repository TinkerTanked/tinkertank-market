'use client'

import { useEffect, useState } from 'react'
import { FireIcon, UserGroupIcon, CurrencyDollarIcon, ArrowPathIcon, PencilIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface StudentInfo {
  firstName: string
  lastName: string
  age?: number
  grade?: string
  allergies?: string
}

interface IgniteSubscription {
  id: string
  stripeSubscriptionId: string
  customerEmail: string
  customerName: string | null
  status: 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'
  weeklyAmount: number
  currentPeriodEnd: string
  sessionName: string
  sessionLocation: string
  sessionDays: string[]
  sessionTime: string
  cancelAtPeriodEnd: boolean
  studentNames: StudentInfo[] | null
}

interface SubscriptionStats {
  active: number
  paused: number
  canceled: number
  weeklyRevenue: number
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-red-100 text-red-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  TRIALING: 'bg-blue-100 text-blue-800',
}

function StudentModal({
  subscription,
  onClose,
  onSave,
  saving
}: {
  subscription: IgniteSubscription
  onClose: () => void
  onSave: (students: StudentInfo[]) => void
  saving: boolean
}) {
  const [students, setStudents] = useState<StudentInfo[]>(
    subscription.studentNames || []
  )

  const addStudent = () => {
    setStudents([...students, { firstName: '', lastName: '', age: undefined, grade: '', allergies: '' }])
  }

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index))
  }

  const updateStudent = (index: number, field: keyof StudentInfo, value: string | number) => {
    const updated = [...students]
    if (field === 'age') {
      updated[index] = { ...updated[index], [field]: value === '' ? undefined : Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setStudents(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validStudents = students.filter(s => s.firstName.trim() && s.lastName.trim())
    onSave(validStudents)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit Students</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{subscription.customerName || subscription.customerEmail}</p>
            <p className="text-sm text-gray-500">{subscription.sessionName}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No students added yet</p>
              ) : (
                students.map((student, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Student {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeStudent(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={student.firstName}
                          onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={student.lastName}
                          onChange={(e) => updateStudent(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Age</label>
                        <input
                          type="number"
                          min="1"
                          max="18"
                          value={student.age ?? ''}
                          onChange={(e) => updateStudent(index, 'age', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Grade</label>
                        <input
                          type="text"
                          value={student.grade || ''}
                          onChange={(e) => updateStudent(index, 'grade', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="e.g., Year 3"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Allergies / Medical Notes</label>
                      <textarea
                        value={student.allergies || ''}
                        onChange={(e) => updateStudent(index, 'allergies', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={2}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={addStudent}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Student
            </button>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Students'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function IgniteSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<IgniteSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [editingSubscription, setEditingSubscription] = useState<IgniteSubscription | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const response = await fetch(`/api/admin/ignite-subscriptions${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStudents = async (students: StudentInfo[]) => {
    if (!editingSubscription) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/ignite-subscriptions/${editingSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNames: students })
      })

      if (response.ok) {
        setSubscriptions(subs =>
          subs.map(s =>
            s.id === editingSubscription.id ? { ...s, studentNames: students } : s
          )
        )
        setEditingSubscription(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save students')
      }
    } catch (error) {
      console.error('Failed to save students:', error)
      alert('Failed to save students')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FireIcon className="h-8 w-8 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ignite Subscriptions</h1>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowPathIcon className={clsx('h-5 w-5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paused</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paused}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Canceled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.canceled}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Weekly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.weeklyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELED">Canceled</option>
              <option value="PAST_DUE">Past Due</option>
            </select>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FireIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No subscriptions found</p>
            <p className="text-sm mt-1">
              Run <code className="bg-gray-100 px-2 py-1 rounded">npx tsx scripts/sync-stripe-subscriptions.ts</code> to sync from Stripe
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sub.customerName || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{sub.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sub.sessionName}</div>
                      <div className="text-sm text-gray-500">
                        {sub.sessionLocation} • {sub.sessionDays.join(', ')} {sub.sessionTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sub.studentNames && sub.studentNames.length > 0 ? (
                        <div className="space-y-1">
                          {sub.studentNames.map((student, i) => (
                            <div key={i} className="text-sm text-gray-900">
                              {student.firstName} {student.lastName}
                              {student.age && <span className="text-gray-500 ml-1">({student.age})</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No students</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', statusColors[sub.status])}>
                        {sub.status}
                      </span>
                      {sub.cancelAtPeriodEnd && (
                        <span className="ml-2 text-xs text-red-500">Canceling</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${sub.weeklyAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setEditingSubscription(sub)}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit Students
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingSubscription && (
        <StudentModal
          subscription={editingSubscription}
          onClose={() => setEditingSubscription(null)}
          onSave={handleSaveStudents}
          saving={saving}
        />
      )}
    </div>
  )
}
