'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Button } from '@/components/ui/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, clearCart, getSummary, getValidation } = useEnhancedCartStore();
  const [isClearing, setIsClearing] = useState(false);
  
  const summary = getSummary();
  const validation = getValidation();

  const handleClearCart = async () => {
    setIsClearing(true);
    clearCart();
    setIsClearing(false);
  };

  const handleCheckout = () => {
    if (validation.isValid) {
      // Navigate to checkout
      console.log('Proceeding to checkout...');
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-6 sm:px-6">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Shopping Cart ({summary.itemCount})
                      </Dialog.Title>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <svg
                            className="h-16 w-16 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <p className="text-lg font-medium">Your cart is empty</p>
                          <p className="mt-1">Add some products to get started</p>
                        </div>
                      ) : (
                        <div className="px-4 sm:px-6">
                          {/* Validation Errors */}
                          {validation.errors.length > 0 && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                              <h4 className="text-red-800 font-medium text-sm mb-2">
                                Please fix the following issues:
                              </h4>
                              <ul className="text-red-700 text-sm space-y-1">
                                {validation.errors.map((error, index) => (
                                  <li key={index}>• {error.message}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Validation Warnings */}
                          {validation.warnings.length > 0 && (
                            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                              <h4 className="text-yellow-800 font-medium text-sm mb-2">
                                Warnings:
                              </h4>
                              <ul className="text-yellow-700 text-sm space-y-1">
                                {validation.warnings.map((warning, index) => (
                                  <li key={index}>• {warning.message}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Cart Items */}
                          <div className="space-y-4">
                            {items.map((item) => (
                              <CartItem key={item.id} item={item} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <CartSummary summary={summary} />
                        
                        <div className="mt-6 space-y-3">
                          <Button
                            onClick={handleCheckout}
                            disabled={!validation.isValid}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                          >
                            {validation.isValid ? 'Proceed to Checkout' : 'Fix Issues to Continue'}
                          </Button>
                          
                          <Button
                            onClick={handleClearCart}
                            disabled={isClearing}
                            variant="outline"
                            className="w-full"
                          >
                            {isClearing ? 'Clearing...' : 'Clear Cart'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
