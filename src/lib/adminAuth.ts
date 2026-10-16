export type AdminRole = 'super' | 'staff'

/**
 * Resolve the admin role from a Basic auth header. Staff use ADMIN_*; the
 * optional SUPER_ADMIN_* login additionally unlocks Stripe billing actions.
 * Runs in both middleware (edge) and route handlers, so it avoids Node APIs.
 */
export function adminRoleFromAuthorization(header: string | null): AdminRole | null {
  if (!header?.startsWith('Basic ')) return null

  let decoded: string
  try {
    decoded = atob(header.slice(6))
  } catch {
    return null
  }
  const separator = decoded.indexOf(':')
  if (separator === -1) return null
  const user = decoded.slice(0, separator)
  const password = decoded.slice(separator + 1)

  const superUser = process.env.SUPER_ADMIN_USERNAME
  const superPassword = process.env.SUPER_ADMIN_PASSWORD
  if (superUser && superPassword && user === superUser && password === superPassword) return 'super'

  const staffUser = process.env.ADMIN_USERNAME
  const staffPassword = process.env.ADMIN_PASSWORD
  if (staffUser && staffPassword && user === staffUser && password === staffPassword) return 'staff'

  return null
}

// Mentors (staff) only take attendance and look after students. Everything
// else in the admin, including customers, billing and bookings, is super admin.
const STAFF_PAGES = ['/admin/schedule', '/admin/students']
const STAFF_APIS = ['/api/admin/schedule', '/api/admin/attendance', '/api/admin/students']

function underAny(pathname: string, prefixes: string[]) {
  return prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function staffMayAccess(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/')) {
    // Removing a student is irreversible, so it stays with the super admin.
    if (method === 'DELETE' && underAny(pathname, ['/api/admin/students'])) return false
    return underAny(pathname, STAFF_APIS)
  }
  return underAny(pathname, STAFF_PAGES)
}
