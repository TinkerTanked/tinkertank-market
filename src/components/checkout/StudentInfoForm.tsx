'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { generateId } from '@/utils/generateId'
import type { StudentDetails } from '@/types/enhancedCart'

interface StudentInfoFormProps {
  onComplete: () => void
  onBack: () => void
}

export default function StudentInfoForm({ onComplete, onBack }: StudentInfoFormProps) {
  const { items, addStudent, updateStudent, removeStudent, getValidation } = useEnhancedCartStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const validation = getValidation()

  const addNewStudent = (itemId: string) => {
    const newStudent: StudentDetails = {
      id: generateId(),
      firstName: '',
      lastName: '',
      age: 6,
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      medicalNotes: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      allergies: []
    }
    addStudent(itemId, newStudent)
  }

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {}
    
    items.forEach(item => {
      if (item.product.category === 'camps' || item.product.category === 'birthdays') {
        if (item.students.length < item.quantity) {
          newErrors[`${item.id}-count`] = `${item.quantity - item.students.length} more student(s) required`
        }
        
        item.students.forEach(student => {
          if (!student.firstName.trim()) {
            newErrors[`${student.id}-firstName`] = 'First name required'
          }
          if (!student.lastName.trim()) {
            newErrors[`${student.id}-lastName`] = 'Last name required'
          }
          if (!student.parentName.trim()) {
            newErrors[`${student.id}-parentName`] = 'Parent name required'
          }
          if (!student.parentEmail.trim()) {
            newErrors[`${student.id}-parentEmail`] = 'Parent email required'
          }
          if (!student.parentPhone.trim()) {
            newErrors[`${student.id}-parentPhone`] = 'Parent phone required'
          }
          if (student.age < 3 || student.age > 18) {
            newErrors[`${student.id}-age`] = 'Age must be between 3 and 18'
          }
        })
      }
    })

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onComplete()
    }
  }

  return (
    <div className='space-y-8'>
      {/* Instructions */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <p className='text-blue-800'>
          Please provide student information for each participant. This helps us create the best possible experience for your child.
        </p>
      </div>

      {/* Student Forms for each item */}
      {items.map((item) => {
        const needsStudentInfo = item.product.category === 'camps' || item.product.category === 'birthdays'
        
        if (!needsStudentInfo) return null

        return (
          <div key={item.id} className='border border-gray-200 rounded-xl p-6 space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <span className='text-xl'>
                    {item.product.category === 'camps' && '🔬'}
                    {item.product.category === 'birthdays' && '🎉'}
                  </span>
                </div>
                <div>
                  <h3 className='font-display font-semibold text-lg text-gray-900'>
                    {item.product.name}
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    {item.selectedDate?.toLocaleDateString()} • {item.selectedTimeSlot ? (typeof item.selectedTimeSlot === 'string' ? item.selectedTimeSlot : `${item.selectedTimeSlot.start} - ${item.selectedTimeSlot.end}`) : ''}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500'>
                  {item.students.length} of {item.quantity} students added
                </p>
              </div>
            </div>

            {/* Error for missing students */}
            {errors[`${item.id}-count`] && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                <p className='text-red-800 text-sm'>{errors[`${item.id}-count`]}</p>
              </div>
            )}

            {/* Student Forms */}
            <div className='space-y-6'>
              {item.students.map((student, studentIndex) => (
                <div key={student.id} className='bg-gray-50 rounded-lg p-4 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-gray-900 flex items-center'>
                      <UserIcon className='w-4 h-4 mr-2' />
                      Student {studentIndex + 1}
                    </h4>
                    <button
                      onClick={() => removeStudent(item.id, student.id)}
                      className='text-red-500 hover:text-red-700 transition-colors duration-200'
                    >
                      <TrashIcon className='w-4 h-4' />
                    </button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        First Name *
                      </label>
                      <input
                        type='text'
                        value={student.firstName}
                        onChange={(e) => updateStudent(item.id, student.id, { firstName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors[`${student.id}-firstName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder='Enter first name'
                      />
                      {errors[`${student.id}-firstName`] && (
                        <p className='text-red-500 text-xs mt-1'>{errors[`${student.id}-firstName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Last Name *
                      </label>
                      <input
                        type='text'
                        value={student.lastName}
                        onChange={(e) => updateStudent(item.id, student.id, { lastName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors[`${student.id}-lastName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder='Enter last name'
                      />
                      {errors[`${student.id}-lastName`] && (
                        <p className='text-red-500 text-xs mt-1'>{errors[`${student.id}-lastName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Age *
                      </label>
                      <input
                        type='number'
                        min='3'
                        max='18'
                        value={student.age}
                        onChange={(e) => updateStudent(item.id, student.id, { age: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors[`${student.id}-age`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`${student.id}-age`] && (
                        <p className='text-red-500 text-xs mt-1'>{errors[`${student.id}-age`]}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Parent/Guardian Name *
                      </label>
                      <input
                        type='text'
                        value={student.parentName}
                        onChange={(e) => updateStudent(item.id, student.id, { parentName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors[`${student.id}-parentName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder='Enter parent name'
                      />
                      {errors[`${student.id}-parentName`] && (
                        <p className='text-red-500 text-xs mt-1'>{errors[`${student.id}-parentName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Parent Email *
                      </label>
                      <input
                        type='email'
                        value={student.parentEmail}
                        onChange={(e) => updateStudent(item.id, student.id, { parentEmail: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors[`${student.id}-parentEmail`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder='Enter email address'
                      />
                      {errors[`${student.id}-parentEmail`] && (
                        <p className='text-red-500 text-xs mt-1'>{errors[`${student.id}-parentEmail`]}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Parent Phone *
                      </label>
                      <input
                        type='tel'
                        value={student.parentPhone}
                        onChange={(e) => updateStudent(item.id, student.id, { parentPhone: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors[`${student.id}-parentPhone`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder='Enter phone number'
                      />
                      {errors[`${student.id}-parentPhone`] && (
                        <p className='text-red-500 text-xs mt-1'>{errors[`${student.id}-parentPhone`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Medical Information (Optional)
                      </label>
                      <textarea
                        value={student.medicalNotes || ''}
                        onChange={(e) => updateStudent(item.id, student.id, { medicalNotes: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        rows={2}
                        placeholder='Any medical conditions we should know about'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Allergies (Optional)
                      </label>
                      <input
                        type='text'
                        value={student.allergies?.join(', ') || ''}
                        onChange={(e) => updateStudent(item.id, student.id, { allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        placeholder='Any allergies or dietary restrictions'
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Student Button */}
              {item.students.length < item.quantity && (
                <button
                  onClick={() => addNewStudent(item.id)}
                  className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-all duration-200 flex items-center justify-center space-x-2'
                >
                  <PlusIcon className='w-5 h-5' />
                  <span>Add Student {item.students.length + 1}</span>
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h4 className='font-medium text-red-900 mb-2'>Please fix the following issues:</h4>
          <ul className='space-y-1'>
            {validation.errors.map((error, index) => (
              <li key={index} className='text-red-800 text-sm'>
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className='flex items-center justify-between pt-6 border-t border-gray-200'>
        <button
          onClick={onBack}
          className='btn-outline flex items-center'
        >
          <ArrowLeftIcon className='w-4 h-4 mr-2' />
          Back to Review
        </button>
        
        <button
          onClick={validateAndProceed}
          disabled={!validation.isValid}
          className={`btn-primary text-lg px-8 py-4 ${
            !validation.isValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}
