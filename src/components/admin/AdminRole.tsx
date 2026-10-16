'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AdminRole } from '@/lib/adminAuth'

const AdminRoleContext = createContext<AdminRole | null>(null)

export function AdminRoleProvider({ role, children }: { role: AdminRole | null; children: ReactNode }) {
  return <AdminRoleContext.Provider value={role}>{children}</AdminRoleContext.Provider>
}

/** Which admin login is in use. Middleware and routes enforce permissions; this only shapes the UI. */
export function useAdminRole(): AdminRole | null {
  return useContext(AdminRoleContext)
}
