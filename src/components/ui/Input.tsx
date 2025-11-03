'use client';

import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  help?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, error, help, as = 'input', ...props }, ref) => {
    const Component = as;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <Component
          className={clsx(
            'block w-full rounded-md border-gray-300 shadow-sm transition-colors',
            'focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref as React.Ref<HTMLInputElement & HTMLTextAreaElement>}
          {...props}
        />
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        {help && !error && (
          <p className="mt-1 text-sm text-gray-500">{help}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
