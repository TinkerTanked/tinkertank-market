'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRightIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useAdminRole } from '@/components/admin/AdminRole'

interface Student {
  id: string
  name: string
  birthdate: string
  birthdateEstimated: boolean
  school: string | null
  allergies: string | null
  medicalNotes: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  createdAt: string
  _count: {
    bookings: number
  }
  igniteSubscriptions?: Array<{
    igniteSubscription: {
      id: string
      customerEmail: string
    }
  }>
}

interface StudentFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  birthdateEstimated: boolean
  school: string
  allergies: string
  medicalNotes: string
  emergencyContactName: string
  emergencyContactPhone: string
}

const emptyForm: StudentFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  birthdateEstimated: false,
  school: '',
  allergies: '',
  medicalNotes: '',
  emergencyContactName: '',
  emergencyContactPhone: ''
}

function StudentModal({
  student,
  onClose,
  onSave,
  saving
}: {
  student: Student | null
  onClose: () => void
  onSave: (data: StudentFormData, id?: string) => void
  saving: boolean
}) {
  const [form, setForm] = useState<StudentFormData>(() => {
    if (student) {
      const nameParts = student.name.split(' ')
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        dateOfBirth: student.birthdate ? student.birthdate.split('T')[0] : '',
        birthdateEstimated: student.birthdateEstimated,
        school: student.school || '',
        allergies: student.allergies || '',
        medicalNotes: student.medicalNotes || '',
        emergencyContactName: student.emergencyContactName || '',
        emergencyContactPhone: student.emergencyContactPhone || ''
      }
    }
    return emptyForm
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form, student?.id)
  }

  const updateField = (field: keyof StudentFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isValid = form.firstName.trim() && form.lastName.trim() && form.dateOfBirth

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm(prev => ({ ...prev, dateOfBirth: e.target.value, birthdateEstimated: false }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <input
                type="text"
                value={form.school}
                onChange={(e) => updateField('school', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Current school"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input
              type="text"
              value={form.allergies}
              onChange={(e) => updateField('allergies', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Any allergies or dietary restrictions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Information</label>
            <textarea
              value={form.medicalNotes}
              onChange={(e) => updateField('medicalNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={2}
              placeholder="Any medical conditions we should know about"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Emergency contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isValid}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : student ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingStudent, setEditingStudent] = useState<Student | null | 'new'>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const isSuper = useAdminRole() === 'super'

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: StudentFormData, id?: string) => {
    setSaving(true)
    try {
      const url = id ? `/api/admin/students/${id}` : '/api/admin/students'
      const method = id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchStudents()
        setEditingStudent(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save student')
      }
    } catch (error) {
      console.error('Failed to save student:', error)
      alert('Failed to save student')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This cannot be undone.`)) {
      return
    }

    setDeleting(student.id)
    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete student')
      }
    } catch (error) {
      console.error('Failed to delete student:', error)
      alert('Failed to delete student')
    } finally {
      setDeleting(null)
    }
  }

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  )

  const calculateAge = (birthdate: string) => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Students</h1>
          {!loading && <p className="text-sm text-gray-500">{students.length} children</p>}
        </div>
        <button
          onClick={() => setEditingStudent('new')}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add student
        </button>
      </div>

      <label className="relative block">
        <span className="sr-only">Search students</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="search"
          placeholder="Search by name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </label>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {search ? 'No students match your search.' : 'No students yet.'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {filteredStudents.map(student => (
            <li key={student.id} className="flex items-center gap-2 pr-2">
              <Link href={`/admin/students/${student.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">{student.name}</span>
                    {student.igniteSubscriptions && student.igniteSubscriptions.length > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Ignite</span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-gray-500">
                    {calculateAge(student.birthdate)} years
                    {student.birthdateEstimated && ' (est.)'}
                    {student.school && ` · ${student.school}`}
                    {` · ${student._count.bookings} ${student._count.bookings === 1 ? 'session' : 'sessions'}`}
                  </div>
                  {student.allergies && !/^(n\/?a|none|nil|no)$/i.test(student.allergies.trim()) && (
                    <div className="mt-0.5 truncate text-sm font-medium text-amber-700">⚠️ {student.allergies}</div>
                  )}
                </div>
                <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-300" />
              </Link>
              <button
                onClick={() => setEditingStudent(student)}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-orange-600"
                aria-label={`Edit ${student.name}`}
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              {isSuper && (
                <button
                  onClick={() => handleDelete(student)}
                  disabled={deleting === student.id || student._count.bookings > 0}
                  className={clsx(
                    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
                    student._count.bookings > 0 ? 'cursor-not-allowed text-gray-200' : 'text-gray-400 hover:bg-gray-50 hover:text-red-600'
                  )}
                  aria-label={student._count.bookings > 0 ? 'Cannot delete a student with bookings' : `Delete ${student.name}`}
                >
                  {deleting === student.id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <TrashIcon className="h-5 w-5" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editingStudent && (
        <StudentModal
          student={editingStudent === 'new' ? null : editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
