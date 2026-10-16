'use client'

import { useEffect, useMemo, useState } from 'react'
import { FireIcon, ArrowPathIcon, PencilIcon, XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, PauseIcon, PlayIcon, NoSymbolIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { useAdminRole } from '@/components/admin/useAdminRole'
import { clsx } from 'clsx'

interface StudentInfo {
  id?: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  school?: string
  allergies?: string
  medicalNotes?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

interface LinkedStudent {
  id: string
  name: string
  birthdate: string
  allergies: string | null
  school: string | null
  medicalNotes: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
}

interface IgniteSubscription {
  id: string
  stripeSubscriptionId: string
  customerEmail: string
  customerName: string | null
  status: 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'
  weeklyAmount: number
  currentPeriodEnd: string
  cancelAt: string | null
  pauseResumesAt: string | null
  sessionId: string | null
  sessionName: string
  sessionLocation: string
  sessionDays: string[]
  sessionTime: string
  cancelAtPeriodEnd: boolean
  studentNames: StudentInfo[] | null
  linkedStudents: LinkedStudent[]
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
  const [students, setStudents] = useState<StudentInfo[]>(() => {
    if (subscription.linkedStudents && subscription.linkedStudents.length > 0) {
      return subscription.linkedStudents.map(s => {
        const nameParts = s.name.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        return {
          id: s.id,
          firstName,
          lastName,
          dateOfBirth: s.birthdate ? s.birthdate.split('T')[0] : '',
          school: s.school || '',
          allergies: s.allergies || '',
          medicalNotes: s.medicalNotes || '',
          emergencyContactName: s.emergencyContactName || '',
          emergencyContactPhone: s.emergencyContactPhone || ''
        }
      })
    }
    return subscription.studentNames || []
  })

  const addStudent = () => {
    setStudents([...students, {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      school: '',
      allergies: '',
      medicalNotes: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    }])
  }

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index))
  }

  const updateStudent = (index: number, field: keyof StudentInfo, value: string) => {
    const updated = [...students]
    updated[index] = { ...updated[index], [field]: value }
    setStudents(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validStudents = students.filter(s => s.firstName.trim() && s.lastName.trim())
    onSave(validStudents)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:rounded-lg">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        <label className="block text-xs text-gray-500 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          value={student.dateOfBirth || ''}
                          onChange={(e) => updateStudent(index, 'dateOfBirth', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">School</label>
                        <input
                          type="text"
                          value={student.school || ''}
                          onChange={(e) => updateStudent(index, 'school', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Current school"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Allergies</label>
                      <input
                        type="text"
                        value={student.allergies || ''}
                        onChange={(e) => updateStudent(index, 'allergies', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Any allergies or dietary restrictions"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Medical Information</label>
                      <textarea
                        value={student.medicalNotes || ''}
                        onChange={(e) => updateStudent(index, 'medicalNotes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={2}
                        placeholder="Any medical conditions we should know about"
                      />
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Emergency Contact</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Contact Name *</label>
                          <input
                            type="text"
                            value={student.emergencyContactName || ''}
                            onChange={(e) => updateStudent(index, 'emergencyContactName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Emergency contact name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Contact Phone *</label>
                          <input
                            type="tel"
                            value={student.emergencyContactPhone || ''}
                            onChange={(e) => updateStudent(index, 'emergencyContactPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Emergency contact phone"
                            required
                          />
                        </div>
                      </div>
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

const STATUS_LABELS: Record<IgniteSubscription['status'], string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELED: 'Cancelled',
  PAST_DUE: 'Unpaid',
  TRIALING: 'Starting'
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' }) : ''
}

function to12Hour(time: string) {
  const [hours, minutes] = time.trim().split(':').map(Number)
  if (Number.isNaN(hours)) return time
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}${hours >= 12 ? 'pm' : 'am'}`
}

function formatSessionTime(sub: IgniteSubscription) {
  const days = sub.sessionDays.length === 5 ? ['Mon–Fri'] : sub.sessionDays.map(day => day[0].toUpperCase() + day.slice(1, 3))
  const time = sub.sessionTime ? sub.sessionTime.split('-').map(to12Hour).join('–') : ''
  return [days.join(', '), time].filter(Boolean).join(' · ')
}

type BillingRequest = { action: 'pause'; resumesAt: string } | { action: 'resume' | 'cancel' | 'undo-cancel' }

function BillingSheet({ subscription, onClose, onDone }: {
  subscription: IgniteSubscription
  onClose: () => void
  onDone: (updated: Partial<IgniteSubscription>) => void
}) {
  const [resumesAt, setResumesAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const paused = subscription.status === 'PAUSED'
  const ended = subscription.status === 'CANCELED'
  const canceling = !!subscription.cancelAt && !ended

  useEffect(() => {
    fetch('/api/admin/ignite-subscriptions/next-term')
      .then(response => response.json())
      .then(data => data.resumesAt && setResumesAt(data.resumesAt))
      .catch(() => undefined)
  }, [])

  const run = async (request: BillingRequest, confirmText: string) => {
    if (!window.confirm(confirmText)) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/ignite-subscriptions/${subscription.id}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Update failed')
      onDone(data.subscription)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const name = subscription.customerName || subscription.customerEmail
  const weekly = `$${subscription.weeklyAmount.toFixed(2)}/week`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manage billing</h2>
            <p className="mt-0.5 text-sm text-gray-500">{name} · {subscription.sessionName}</p>
          </div>
          <button onClick={onClose} className="-mr-2 rounded-full p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {ended ? (
            <p className="text-sm text-gray-600">This subscription has ended. The family can re-enrol from the website.</p>
          ) : (
            <>
              {paused ? (
                <button
                  disabled={busy}
                  onClick={() => run({ action: 'resume' }, `Resume billing for ${name} now at ${weekly}?`)}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-base font-semibold text-white disabled:opacity-50"
                >
                  <PlayIcon className="h-5 w-5" /> Resume billing now
                </button>
              ) : (
                <div className="space-y-2 rounded-xl border border-gray-200 p-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="resumesAt">Pause until</label>
                  <input
                    id="resumesAt"
                    type="date"
                    value={resumesAt}
                    onChange={e => setResumesAt(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-300 px-3 text-base"
                  />
                  <p className="text-xs text-gray-500">No invoices are created while paused. Defaults to the first day of next term.</p>
                  <button
                    disabled={busy || !resumesAt}
                    onClick={() => run({ action: 'pause', resumesAt }, `Pause billing for ${name} until ${resumesAt}? No invoices will be created until then.`)}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-base font-semibold text-white disabled:opacity-50"
                  >
                    <PauseIcon className="h-5 w-5" /> Pause billing
                  </button>
                </div>
              )}

              {canceling ? (
                <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">Ends {formatDate(subscription.cancelAt)}.</p>
                  <button
                    disabled={busy}
                    onClick={() => run({ action: 'undo-cancel' }, `Keep ${name}'s subscription going?`)}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-base font-semibold text-gray-800 disabled:opacity-50"
                  >
                    <ArrowUturnLeftIcon className="h-5 w-5" /> Undo cancellation
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled={busy}
                    onClick={() => run(
                      { action: 'cancel' },
                      `Cancel ${name}'s subscription with two weeks' notice? They will be charged for the current week and next week (${weekly}), then it ends.`
                    )}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-base font-semibold text-red-700 disabled:opacity-50"
                  >
                    <NoSymbolIcon className="h-5 w-5" /> Cancel with 2 weeks&apos; notice
                  </button>
                  <p className="text-xs text-gray-500">Charges the current week and next week, then stops.</p>
                </div>
              )}
            </>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function IgniteSubscriptionsPage() {
  const role = useAdminRole()
  const [subscriptions, setSubscriptions] = useState<IgniteSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('ACTIVE')
  const [sessionId, setSessionId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [editingSubscription, setEditingSubscription] = useState<IgniteSubscription | null>(null)
  const [billingSubscription, setBillingSubscription] = useState<IgniteSubscription | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ignite-subscriptions')
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

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const sessions = useMemo(() => {
    const map = new Map<string, string>()
    for (const sub of subscriptions) if (sub.sessionId) map.set(sub.sessionId, `${sub.sessionLocation} · ${formatSessionTime(sub)}`)
    return [...map].sort((a, b) => a[1].localeCompare(b[1]))
  }, [subscriptions])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return subscriptions.filter(sub =>
      (!status || sub.status === status) &&
      (!sessionId || sub.sessionId === sessionId) &&
      (!query ||
        (sub.customerName || '').toLowerCase().includes(query) ||
        sub.customerEmail.toLowerCase().includes(query) ||
        sub.linkedStudents.some(student => student.name.toLowerCase().includes(query)))
    )
  }, [subscriptions, status, sessionId, search])

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
        await fetchSubscriptions()
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

  const statusTabs: { value: string; label: string; count?: number }[] = [
    { value: 'ACTIVE', label: 'Active', count: stats?.active },
    { value: 'PAUSED', label: 'Paused', count: stats?.paused },
    { value: 'PAST_DUE', label: 'Unpaid', count: subscriptions.filter(sub => sub.status === 'PAST_DUE').length },
    { value: 'CANCELED', label: 'Cancelled', count: stats?.canceled },
    { value: '', label: 'All', count: subscriptions.length }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Ignite subscriptions</h1>
          {stats && <p className="text-sm text-gray-500">${stats.weeklyRevenue.toFixed(2)} weekly from {stats.active} active</p>}
        </div>
        <button
          onClick={fetchSubscriptions}
          className="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-600 hover:bg-gray-50"
          aria-label="Refresh"
        >
          <ArrowPathIcon className={clsx('h-5 w-5', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {statusTabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setStatus(tab.value)}
            className={clsx(
              'flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium',
              status === tab.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            )}
          >
            {tab.label}{tab.count !== undefined && <span className="ml-1.5 opacity-70">{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parent, email or child"
            className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>
        <select
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-base"
          aria-label="Session"
        >
          <option value="">All sessions</option>
          {sessions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      {loading && subscriptions.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          <FireIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          No subscriptions match.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {visible.map(sub => (
            <li key={sub.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-gray-900">{sub.customerName || sub.customerEmail}</span>
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[sub.status])}>
                    {STATUS_LABELS[sub.status]}
                  </span>
                  {sub.status === 'PAUSED' && sub.pauseResumesAt && (
                    <span className="text-xs text-gray-500">until {formatDate(sub.pauseResumesAt)}</span>
                  )}
                  {sub.cancelAt && sub.status !== 'CANCELED' && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Ends {formatDate(sub.cancelAt)}</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-sm text-gray-500">{sub.customerEmail}</div>
                <div className="mt-1 text-sm text-gray-700">
                  {sub.sessionLocation} · {formatSessionTime(sub)}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  {sub.linkedStudents.length > 0
                    ? sub.linkedStudents.map(student => student.name).join(', ')
                    : sub.studentNames?.length
                      ? <span className="text-amber-700">{sub.studentNames.map(s => `${s.firstName} ${s.lastName}`).join(', ')} (not linked)</span>
                      : <span className="italic text-gray-400">No children linked</span>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <div className="text-sm lg:text-right">
                  <div className="font-semibold text-gray-900">${sub.weeklyAmount.toFixed(2)}/wk</div>
                  {(sub.status === 'ACTIVE' || sub.status === 'TRIALING') && new Date(sub.currentPeriodEnd) > new Date() && (
                    <div className="text-gray-500">Next bill {formatDate(sub.currentPeriodEnd)}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSubscription(sub)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4" /> Children
                  </button>
                  {role === 'super' && (
                    <button
                      onClick={() => setBillingSubscription(sub)}
                      className="inline-flex h-11 items-center rounded-xl bg-gray-900 px-3.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Billing
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingSubscription && (
        <StudentModal
          subscription={editingSubscription}
          onClose={() => setEditingSubscription(null)}
          onSave={handleSaveStudents}
          saving={saving}
        />
      )}

      {billingSubscription && (
        <BillingSheet
          subscription={billingSubscription}
          onClose={() => setBillingSubscription(null)}
          onDone={updated => {
            setSubscriptions(subs => subs.map(sub => sub.id === billingSubscription.id ? { ...sub, ...updated } : sub))
            setBillingSubscription(null)
          }}
        />
      )}
    </div>
  )
}
