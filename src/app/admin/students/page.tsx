'use client'

import { useEffect, useState } from 'react'
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface Student {
  id: string
  name: string
  birthdate: string
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
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button
          onClick={() => setEditingStudent('new')}
          className="flex items-center bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Student
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search students by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <li className="px-6 py-12 text-center text-gray-500">
                {search ? 'No students found matching your search.' : 'No students yet. Click "Add Student" to create one.'}
              </li>
            ) : (
              filteredStudents.map((student) => (
                <li key={student.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student._count.bookings} {student._count.bookings === 1 ? 'booking' : 'bookings'}
                          </span>
                          {student.igniteSubscriptions && student.igniteSubscriptions.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Ignite
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                          <span>Age: {calculateAge(student.birthdate)} years</span>
                          <span>Born: {new Date(student.birthdate).toLocaleDateString()}</span>
                          {student.school && <span>School: {student.school}</span>}
                          {student.allergies && (
                            <span className="text-red-600 font-medium">⚠️ {student.allergies}</span>
                          )}
                        </div>
                        {student.emergencyContactName && (
                          <div className="mt-1 text-sm text-gray-500">
                            Emergency: {student.emergencyContactName}
                            {student.emergencyContactPhone && ` - ${student.emergencyContactPhone}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Edit student"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          disabled={deleting === student.id || student._count.bookings > 0}
                          className={clsx(
                            'p-2 transition-colors',
                            student._count.bookings > 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-600'
                          )}
                          title={student._count.bookings > 0 ? 'Cannot delete student with bookings' : 'Delete student'}
                        >
                          {deleting === student.id ? (
                            <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
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
