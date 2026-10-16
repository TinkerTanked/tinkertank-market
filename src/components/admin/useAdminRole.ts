'use client'

import { useEffect, useState } from 'react'
import type { AdminRole } from '@/lib/adminAuth'

/** Which admin login is in use. The server enforces permissions; this only hides unavailable actions. */
export function useAdminRole(): AdminRole | null {
  const [role, setRole] = useState<AdminRole | null>(null)
  useEffect(() => {
    fetch('/api/admin/me')
      .then(response => response.json())
      .then(data => setRole(data.role))
      .catch(() => setRole(null))
  }, [])
  return role
}
