'use client';

import { useState } from 'react';
import { TrashIcon, PlusIcon, MinusIcon, UserIcon } from '@heroicons/react/24/outline';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { EnhancedCartItem as CartItemType } from '@/types/enhancedCart';
import { formatPrice } from '@/utils/formatPrice';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { StudentForm } from './StudentForm';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeItem, addStudent, removeStudent } = useEnhancedCartStore();
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    updateQuantity(item.id, newQuantity);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    removeItem(item.id);
  };

  const studentsNeeded = Math.max(0, item.quantity - item.students.length);
  const needsStudents = studentsNeeded > 0 && 
    (item.product.category === 'camps' || item.product.category === 'birthdays');

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 ${
      isRemoving ? 'opacity-50' : ''
    } ${needsStudents ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
      
      {/* Product Info */}
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          {item.product.images?.[0] ? (
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded-md"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {item.product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {item.product.shortDescription}
          </p>
          
          {/* Selected Options */}
          <div className="mt-2 space-y-1">
            {item.selectedDate && (
              <p className="text-xs text-gray-600">
                📅 {format(item.selectedDate, 'MMM dd, yyyy')}
              </p>
            )}
            {item.selectedTimeSlot && (
              <p className="text-xs text-gray-600">
                🕐 {item.selectedTimeSlot.start} - {item.selectedTimeSlot.end}
              </p>
            )}
            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
              <div className="text-xs text-gray-600">
                Add-ons: {item.selectedAddOns.map(({ addOn, quantity }) => 
                  `${addOn.name} (${quantity})`
                ).join(', ')}
              </div>
            )}
          </div>

          {/* Students */}
          {item.students.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Students ({item.students.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {item.students.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    <UserIcon className="w-3 h-3 mr-1" />
                    {student.firstName} {student.lastName}
                    <button
                      onClick={() => removeStudent(item.id, student.id)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Students Needed Warning */}
          {needsStudents && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
              <p className="text-yellow-800 font-medium">
                {studentsNeeded} more student{studentsNeeded > 1 ? 's' : ''} required
              </p>
              <Button
                onClick={() => setShowStudentForm(true)}
                size="sm"
                className="mt-1 text-xs bg-yellow-600 hover:bg-yellow-700"
              >
                Add Student
              </Button>
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-gray-400 hover:text-red-500 p-1"
            title="Remove item"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          
          <div className="text-right">
            <p className="font-medium text-gray-900">
              {formatPrice(item.totalPrice)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPrice(item.pricePerItem)} each
            </p>
          </div>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={item.quantity <= 1}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-gray-50 rounded text-sm font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Add Student Button */}
        {(item.product.category === 'camps' || item.product.category === 'birthdays') && (
          <Button
            onClick={() => setShowStudentForm(true)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <UserIcon className="w-4 h-4 mr-1" />
            Add Student
          </Button>
        )}
      </div>

      {/* Student Form Modal */}
      {showStudentForm && (
        <StudentForm
          itemId={item.id}
          product={item.product}
          onClose={() => setShowStudentForm(false)}
          onSave={(student) => {
            addStudent(item.id, student);
            setShowStudentForm(false);
          }}
        />
      )}
    </div>
  );
};
