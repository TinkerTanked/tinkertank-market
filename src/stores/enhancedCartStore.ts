import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, AddOn, ProductCategory } from '@/types/products';
import { 
  EnhancedCartState, 
  EnhancedCartItem, 
  StudentDetails, 
  CartSummary, 
  CartValidation, 
  GST_RATE 
} from '@/types/enhancedCart';
import { generateId } from '@/utils/generateId';

const calculateItemPrice = (product: Product, quantity: number, addOns?: { addOn: AddOn; quantity: number }[], dateCount: number = 1) => {
  const basePrice = product.price * quantity * dateCount;
  const addOnPrice = addOns?.reduce((sum, { addOn, quantity }) => sum + (addOn.price * quantity * dateCount), 0) || 0;
  return basePrice + addOnPrice;
};

const validateStudent = (student: StudentDetails, product: Product): string[] => {
  const errors: string[] = [];
  
  if (!student.firstName.trim()) errors.push('First name is required');
  if (!student.lastName.trim()) errors.push('Last name is required');
  if (!student.parentName.trim()) errors.push('Parent name is required');
  if (!student.parentEmail.trim()) errors.push('Parent email is required');
  if (!student.parentPhone.trim()) errors.push('Parent phone is required');
  if (student.age < 1 || student.age > 99) errors.push('Age must be between 1 and 99');
  
  // Age validation against product age range
  if (product.ageRange) {
    const ageMatch = product.ageRange.match(/(\d+)-(\d+)/);
    if (ageMatch) {
      const [, minAge, maxAge] = ageMatch;
      if (student.age < parseInt(minAge) || student.age > parseInt(maxAge)) {
        errors.push(`Student age must be between ${minAge} and ${maxAge} for this product`);
      }
    }
  }
  
  return errors;
};

export const useEnhancedCartStore = create<EnhancedCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: (product: Product, options = {}) => {
        set((state) => {
          const dateCount = options.selectedDates?.length || 1;
          const existingItemIndex = state.items.findIndex(
            (item) => 
              item.product.id === product.id && 
              item.selectedDate?.getTime() === options.selectedDate?.getTime() &&
              JSON.stringify(item.selectedTimeSlot) === JSON.stringify(options.selectedTimeSlot) &&
              JSON.stringify(item.selectedDates?.map(d => d.getTime())) === JSON.stringify(options.selectedDates?.map(d => d.getTime()))
          );

          if (existingItemIndex >= 0) {
            // Update existing item
            const items = [...state.items];
            const existingItem = items[existingItemIndex];
            const newQuantity = existingItem.quantity + (options.quantity || 1);
            const existingDateCount = existingItem.selectedDates?.length || 1;
            
            items[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalPrice: calculateItemPrice(product, newQuantity, existingItem.selectedAddOns, existingDateCount),
            };
            
            return { items };
          } else {
            // Add new item
            const quantity = options.quantity || 1;
            const newItem: EnhancedCartItem = {
              id: generateId(),
              product,
              quantity,
              students: [],
              selectedAddOns: options.selectedAddOns,
              selectedDate: options.selectedDate,
              selectedDates: options.selectedDates,
              selectedTimeSlot: options.selectedTimeSlot,
              pricePerItem: calculateItemPrice(product, 1, options.selectedAddOns, dateCount),
              totalPrice: calculateItemPrice(product, quantity, options.selectedAddOns, dateCount),
              createdAt: new Date(),
              notes: options.notes,
            };
            
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  totalPrice: calculateItemPrice(item.product, quantity, item.selectedAddOns, item.selectedDates?.length || 1),
                }
              : item
          )
        }));
      },

      updateStudent: (itemId: string, studentId: string, studentUpdate: Partial<StudentDetails>) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  students: item.students.map(student =>
                    student.id === studentId
                      ? { ...student, ...studentUpdate }
                      : student
                  )
                }
              : item
          )
        }));
      },

      addStudent: (itemId: string, student: StudentDetails) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  students: [...item.students, { ...student, id: student.id || generateId() }]
                }
              : item
          )
        }));
      },

      removeStudent: (itemId: string, studentId: string) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  students: item.students.filter(student => student.id !== studentId)
                }
              : item
          )
        }));
      },

      updateItemDetails: (itemId: string, details: Partial<EnhancedCartItem>) => {
        set((state) => ({
          items: state.items.map(item => {
            if (item.id === itemId) {
              const updatedItem = { ...item, ...details };
              // Recalculate total price if quantity, addOns, or dates changed
              if (details.quantity !== undefined || details.selectedAddOns !== undefined || details.selectedDates !== undefined) {
                updatedItem.totalPrice = calculateItemPrice(
                  updatedItem.product,
                  updatedItem.quantity,
                  updatedItem.selectedAddOns,
                  updatedItem.selectedDates?.length || 1
                );
              }
              return updatedItem;
            }
            return item;
          })
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearCartAfterSuccess: async (orderId: string) => {
        try {
          // Clear cart immediately
          set({ items: [] });
          
          // Optional: Notify server for cleanup
          await fetch('/api/cart/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });
        } catch (error) {
          console.error('Error clearing cart after success:', error);
          // Cart is still cleared locally
        }
      },

      getSummary: (): CartSummary => {
        const items = get().items;
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * GST_RATE;
        const total = subtotal + tax;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const studentCount = items.reduce((sum, item) => sum + item.students.length, 0);

        return { subtotal, tax, total, itemCount, studentCount };
      },

      getValidation: (): CartValidation => {
        const items = get().items;
        const errors: CartValidation['errors'] = [];
        const warnings: CartValidation['warnings'] = [];

        items.forEach(item => {
          // Check if students are assigned for items that require them
          if (item.quantity > item.students.length && 
              (item.product.category === 'camps' || item.product.category === 'birthdays')) {
            errors.push({
              itemId: item.id,
              field: 'students',
              message: `${item.quantity - item.students.length} more student(s) required`
            });
          }

          // Validate student data
          item.students.forEach(student => {
            const studentErrors = validateStudent(student, item.product);
            studentErrors.forEach(error => {
              errors.push({
                itemId: item.id,
                field: 'student',
                message: `${student.firstName || 'Student'}: ${error}`
              });
            });
          });

          // Check for date/time conflicts
          items.forEach(otherItem => {
            if (otherItem.id !== item.id && 
                item.selectedDate && otherItem.selectedDate &&
                item.selectedDate.getTime() === otherItem.selectedDate.getTime() &&
                item.selectedTimeSlot && otherItem.selectedTimeSlot &&
                JSON.stringify(item.selectedTimeSlot) === JSON.stringify(otherItem.selectedTimeSlot)) {
              
              // Check if same student is in both items
              const studentOverlap = item.students.some(student =>
                otherItem.students.some(otherStudent => 
                  student.firstName === otherStudent.firstName && 
                  student.lastName === otherStudent.lastName
                )
              );
              
              if (studentOverlap) {
                warnings.push({
                  itemId: item.id,
                  message: 'Student has overlapping bookings at the same time'
                });
              }
            }
          });

          // Check capacity limits
          if (item.product.maxCapacity && item.quantity > item.product.maxCapacity) {
            errors.push({
              itemId: item.id,
              field: 'quantity',
              message: `Quantity exceeds maximum capacity of ${item.product.maxCapacity}`
            });
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      },

      getItem: (itemId: string) => {
        return get().items.find(item => item.id === itemId);
      },

      hasStudent: (itemId: string, studentId: string) => {
        const item = get().getItem(itemId);
        return item ? item.students.some(student => student.id === studentId) : false;
      },

      loadFromStorage: () => {
        // This is handled automatically by the persist middleware
      },

      saveToStorage: () => {
        // This is handled automatically by the persist middleware
      },
    }),
    {
      name: 'tinkertank-enhanced-cart',
      version: 1,
      // Transform dates when persisting/rehydrating
      serialize: (state) => JSON.stringify(state, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }),
      deserialize: (str) => JSON.parse(str, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      }),
    }
  )
);
