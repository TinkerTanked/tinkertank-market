import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminRoleFromAuthorization, staffMayAccess } from '@/lib/adminAuth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  if (isAdminRoute) {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      return new NextResponse('Admin authentication is not configured', { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    const role = adminRoleFromAuthorization(authHeader)
    if (!role) {
      return new NextResponse(authHeader ? 'Invalid credentials' : 'Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      })
    }

    if (role === 'staff' && !staffMayAccess(pathname, request.method)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'This needs a super admin login.' }, { status: 403 })
      }
      // Mentors land on check-in, which is all most of them need.
      return NextResponse.redirect(new URL('/admin/schedule', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
