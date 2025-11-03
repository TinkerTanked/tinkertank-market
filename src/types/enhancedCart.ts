import { Product, AddOn, TimeSlot } from './products';
import { Student } from './student';
import { CartItem as BaseCartItem, CartState as BaseCartState } from './cart';

// Extended student info for multi-student support
export interface StudentDetails {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth?: Date;
  allergies?: string[];
  medicalNotes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

// Enhanced cart item that supports multiple students and dates
export interface EnhancedCartItem {
  id: string;
  product: Product;
  quantity: number;
  students: StudentDetails[];
  selectedAddOns?: { addOn: AddOn; quantity: number }[];
  selectedDate?: Date;
  selectedDates?: Date[];
  selectedTimeSlot?: TimeSlot;
  pricePerItem: number;
  totalPrice: number;
  createdAt: Date;
  notes?: string;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  studentCount: number;
}

export interface CartValidation {
  isValid: boolean;
  errors: {
    itemId: string;
    field: string;
    message: string;
  }[];
  warnings: {
    itemId: string;
    message: string;
  }[];
}

export interface EnhancedCartState {
  items: EnhancedCartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (product: Product, options?: Partial<EnhancedCartItem>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateStudent: (itemId: string, studentId: string, student: Partial<StudentDetails>) => void;
  addStudent: (itemId: string, student: StudentDetails) => void;
  removeStudent: (itemId: string, studentId: string) => void;
  updateItemDetails: (itemId: string, details: Partial<EnhancedCartItem>) => void;
  clearCart: () => void;
  clearCartAfterSuccess: (orderId: string) => Promise<void>;
  
  // Computed
  getSummary: () => CartSummary;
  getValidation: () => CartValidation;
  getItem: (itemId: string) => EnhancedCartItem | undefined;
  hasStudent: (itemId: string, studentId: string) => boolean;
  
  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const GST_RATE = 0.1; // 10% GST for Australia
