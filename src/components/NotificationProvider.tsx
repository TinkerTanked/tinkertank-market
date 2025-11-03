'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationToast } from './NotificationToast'

const NotificationContext = createContext<ReturnType<typeof useNotifications> | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notifications = useNotifications()

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
      
      {/* Toast Container */}
      <div
        aria-live='assertive'
        className='pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50'
      >
        <div className='flex w-full flex-col items-center space-y-4 sm:items-end'>
          {notifications.toasts.map(toast => (
            <NotificationToast
              key={toast.id}
              toast={toast}
              onDismiss={notifications.removeToast}
            />
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
