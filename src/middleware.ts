import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminRoleFromAuthorization } from '@/lib/adminAuth'

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')

  if (isAdminRoute) {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      return new NextResponse('Admin authentication is not configured', { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!adminRoleFromAuthorization(authHeader)) {
      return new NextResponse(authHeader ? 'Invalid credentials' : 'Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
