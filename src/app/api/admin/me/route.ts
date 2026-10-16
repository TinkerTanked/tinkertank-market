import { NextRequest, NextResponse } from 'next/server'
import { adminRoleFromAuthorization } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  return NextResponse.json({ role: adminRoleFromAuthorization(request.headers.get('authorization')) })
}
