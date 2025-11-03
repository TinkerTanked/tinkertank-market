'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types/products';
import { StudentDetails as Student } from '@/types/enhancedCart';
import { generateId } from '@/utils/generateId';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface StudentFormProps {
  itemId: string;
  product: Product;
  student?: Student;
  onClose: () => void;
  onSave: (student: Student) => void;
}

export const StudentForm = ({ product, student, onClose, onSave }: StudentFormProps) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    id: student?.id || generateId(),
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    age: student?.age || 0,
    dateOfBirth: student?.dateOfBirth || undefined,
    allergies: student?.allergies || [],
    medicalNotes: student?.medicalNotes || '',
    parentName: student?.parentName || '',
    parentEmail: student?.parentEmail || '',
    parentPhone: student?.parentPhone || '',
    emergencyContact: student?.emergencyContact || {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergyInput, setAllergyInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.age || formData.age < 1 || formData.age > 99) {
      newErrors.age = 'Valid age is required (1-99)';
    }

    // Age validation against product age range
    if (product.ageRange && formData.age) {
      const ageMatch = product.ageRange.match(/(\d+)-(\d+)/);
      if (ageMatch) {
        const [, minAge, maxAge] = ageMatch;
        if (formData.age < parseInt(minAge) || formData.age > parseInt(maxAge)) {
          newErrors.age = `Age must be between ${minAge} and ${maxAge} for this product`;
        }
      }
    }

    if (!formData.parentName?.trim()) {
      newErrors.parentName = 'Parent/guardian name is required';
    }

    if (!formData.parentEmail?.trim()) {
      newErrors.parentEmail = 'Parent/guardian email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Valid email address is required';
    }

    if (!formData.parentPhone?.trim()) {
      newErrors.parentPhone = 'Parent/guardian phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData as Student);
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), allergyInput.trim()]
      }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Transition.Root show as={Fragment}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      {student ? 'Edit Student Details' : 'Add Student Details'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Student Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="First Name*"
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          error={errors.firstName}
                          required
                        />
                        <Input
                          label="Last Name*"
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          error={errors.lastName}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Age*"
                          type="number"
                          min="1"
                          max="99"
                          value={formData.age || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                          error={errors.age}
                          help={product.ageRange ? `Product age range: ${product.ageRange}` : undefined}
                          required
                        />
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            dateOfBirth: e.target.value ? new Date(e.target.value) : undefined 
                          }))}
                        />
                      </div>

                      {/* Allergies */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allergies & Dietary Requirements
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={allergyInput}
                            onChange={(e) => setAllergyInput(e.target.value)}
                            placeholder="Add allergy or dietary requirement"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <Button
                            type="button"
                            onClick={handleAddAllergy}
                            size="sm"
                            disabled={!allergyInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        {formData.allergies && formData.allergies.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {formData.allergies.map((allergy, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {allergy}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllergy(index)}
                                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-red-600 hover:bg-red-200 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Input
                        label="Medical Notes"
                        as="textarea"
                        rows={2}
                        value={formData.medicalNotes || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, medicalNotes: e.target.value }))}
                        placeholder="Any medical conditions, medications, or special needs..."
                      />

                      {/* Parent/Guardian Info */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Parent/Guardian Information</h4>
                        <div className="space-y-4">
                          <Input
                            label="Parent/Guardian Name*"
                            value={formData.parentName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                            error={errors.parentName}
                            required
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Email*"
                              type="email"
                              value={formData.parentEmail || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                              error={errors.parentEmail}
                              required
                            />
                            <Input
                              label="Phone*"
                              type="tel"
                              value={formData.parentPhone || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                              error={errors.parentPhone}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Emergency Contact (Optional)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input
                            label="Name"
                            value={formData.emergencyContact?.name || ''}
                            onChange={(e) => setFormData(prev => ({
                            ...prev,
                            emergencyContact: { 
                                ...prev.emergencyContact, 
                              name: e.target.value,
                              phone: prev.emergencyContact?.phone || '',
                              relationship: prev.emergencyContact?.relationship || ''
                            }
                          }))}
                          />
                          <Input
                            label="Phone"
                            type="tel"
                            value={formData.emergencyContact?.phone || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              emergencyContact: { 
                                ...prev.emergencyContact, 
                                phone: e.target.value,
                                name: prev.emergencyContact?.name || '',
                                relationship: prev.emergencyContact?.relationship || ''
                              }
                            }))}
                          />
                          <Input
                            label="Relationship"
                            value={formData.emergencyContact?.relationship || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              emergencyContact: { 
                                ...prev.emergencyContact, 
                                relationship: e.target.value,
                                name: prev.emergencyContact?.name || '',
                                phone: prev.emergencyContact?.phone || ''
                              }
                            }))}
                            placeholder="e.g., Grandparent, Uncle"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {student ? 'Update Student' : 'Add Student'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
