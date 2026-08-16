'use client'

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/Input'

export interface StudentInfo {
  firstName: string
  lastName: string
  dateOfBirth: string
  school: string
  allergies: string
  medicalNotes: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export function emptyStudent(): StudentInfo {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    school: '',
    allergies: '',
    medicalNotes: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  }
}

export function isValidPhone(phone: string): boolean {
  return /^[\d\s+()-]{8,}$/.test(phone)
}

export function isStudentValid(s: StudentInfo): boolean {
  return !!(
    s.firstName.trim() &&
    s.lastName.trim() &&
    s.dateOfBirth &&
    s.emergencyContactName.trim() &&
    s.emergencyContactPhone.trim() &&
    isValidPhone(s.emergencyContactPhone)
  )
}

interface IgniteStudentStepProps {
  students: StudentInfo[]
  onStudentsChange: (students: StudentInfo[]) => void
}

export default function IgniteStudentStep({ students, onStudentsChange }: IgniteStudentStepProps) {
  const updateStudent = (index: number, field: keyof StudentInfo, value: string) => {
    onStudentsChange(students.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const addStudent = () => {
    onStudentsChange([...students, emptyStudent()])
  }

  const removeStudent = (index: number) => {
    if (students.length <= 1) return
    onStudentsChange(students.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Student Information</h3>
        <p className="text-gray-600 text-sm">
          Add every child you&apos;d like to enrol. You&apos;ll be billed the weekly price for each child.
        </p>
      </div>

      {students.map((studentInfo, index) => (
        <div key={index} className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Child {index + 1}</h4>
            {students.length > 1 && (
              <button
                type="button"
                onClick={() => removeStudent(index)}
                className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm"
              >
                <TrashIcon className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name*"
              value={studentInfo.firstName}
              onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
              placeholder="Enter first name"
              required
            />
            <Input
              label="Last Name*"
              value={studentInfo.lastName}
              onChange={(e) => updateStudent(index, 'lastName', e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth*"
              type="date"
              value={studentInfo.dateOfBirth}
              onChange={(e) => updateStudent(index, 'dateOfBirth', e.target.value)}
              required
            />
            <Input
              label="School (optional)"
              value={studentInfo.school}
              onChange={(e) => updateStudent(index, 'school', e.target.value)}
              placeholder="Current school"
            />
          </div>

          <Input
            label="Allergies (optional)"
            value={studentInfo.allergies}
            onChange={(e) => updateStudent(index, 'allergies', e.target.value)}
            placeholder="Any allergies or dietary restrictions"
          />

          <Input
            label="Medical Information (optional)"
            as="textarea"
            rows={2}
            value={studentInfo.medicalNotes}
            onChange={(e) => updateStudent(index, 'medicalNotes', e.target.value)}
            placeholder="Any medical conditions we should know about"
          />

          <div className="pt-2 border-t border-gray-100">
            <h5 className="font-medium text-gray-900 mb-3 text-sm">Emergency Contact</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Name*"
                value={studentInfo.emergencyContactName}
                onChange={(e) => updateStudent(index, 'emergencyContactName', e.target.value)}
                placeholder="Emergency contact name"
                required
              />
              <Input
                label="Contact Phone*"
                type="tel"
                value={studentInfo.emergencyContactPhone}
                onChange={(e) => updateStudent(index, 'emergencyContactPhone', e.target.value)}
                placeholder="Emergency contact phone"
                error={
                  studentInfo.emergencyContactPhone && !isValidPhone(studentInfo.emergencyContactPhone)
                    ? 'Please enter a valid phone number'
                    : undefined
                }
                required
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addStudent}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
      >
        <PlusIcon className="w-5 h-5" />
        <span>Add another child</span>
      </button>

      {!students.every(isStudentValid) && (
        <p className="text-xs text-center text-gray-500">
          * Required fields must be completed for every child to continue
        </p>
      )}
    </div>
  )
}
