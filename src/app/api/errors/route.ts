import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()
    
    // Log error (in production, send to external service)
    console.error('Client Error:', {
      ...errorData,
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'referer': request.headers.get('referer'),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging failed:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
