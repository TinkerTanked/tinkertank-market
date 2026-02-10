'use client'

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

interface IgniteStudentStepProps {
  studentInfo: StudentInfo
  onStudentInfoChange: (info: StudentInfo) => void
}

export default function IgniteStudentStep({ studentInfo, onStudentInfoChange }: IgniteStudentStepProps) {
  const handleChange = (field: keyof StudentInfo, value: string) => {
    onStudentInfoChange({
      ...studentInfo,
      [field]: value
    })
  }

  const isValidPhone = (phone: string): boolean => {
    return /^[\d\s+()-]{8,}$/.test(phone)
  }

  const hasRequiredFields = (): boolean => {
    return !!(
      studentInfo.firstName.trim() &&
      studentInfo.lastName.trim() &&
      studentInfo.dateOfBirth &&
      studentInfo.emergencyContactName.trim() &&
      studentInfo.emergencyContactPhone.trim()
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Student Information</h3>
        <p className="text-gray-600 text-sm">Please provide details for the student attending</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Student Details</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name*"
            value={studentInfo.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Enter first name"
            required
          />
          <Input
            label="Last Name*"
            value={studentInfo.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Enter last name"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date of Birth*"
            type="date"
            value={studentInfo.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            required
          />
          <Input
            label="School (optional)"
            value={studentInfo.school}
            onChange={(e) => handleChange('school', e.target.value)}
            placeholder="Current school"
          />
        </div>

        <Input
          label="Allergies (optional)"
          value={studentInfo.allergies}
          onChange={(e) => handleChange('allergies', e.target.value)}
          placeholder="Any allergies or dietary restrictions"
        />

        <Input
          label="Medical Information (optional)"
          as="textarea"
          rows={2}
          value={studentInfo.medicalNotes}
          onChange={(e) => handleChange('medicalNotes', e.target.value)}
          placeholder="Any medical conditions we should know about"
        />
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Emergency Contact</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Name*"
            value={studentInfo.emergencyContactName}
            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
            placeholder="Emergency contact name"
            required
          />
          <div>
            <Input
              label="Contact Phone*"
              type="tel"
              value={studentInfo.emergencyContactPhone}
              onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
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

      {!hasRequiredFields() && (
        <p className="text-xs text-center text-gray-500">
          * Required fields must be completed to continue
        </p>
      )}
    </div>
  )
}
