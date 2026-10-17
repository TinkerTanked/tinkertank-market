import { NextResponse } from 'next/server'
import { metaAdsSummary } from '@/lib/metaAds'

/** Meta ad results for the Sales page. Loaded separately so a slow Meta API never holds up the page. */
export async function GET() {
  try {
    const summary = await metaAdsSummary()
    if (!summary) return NextResponse.json({ configured: false })
    return NextResponse.json({ configured: true, ...summary })
  } catch (error) {
    console.error('Meta ads summary failed:', error)
    return NextResponse.json({ configured: true, error: 'Could not load results from Meta right now.' }, { status: 502 })
  }
}
