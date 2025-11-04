import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        capacity: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ success: true, locations });
  } catch (error) {
    console.error('Locations API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
  }
}
