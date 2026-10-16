import { NextResponse } from 'next/server'
import { getNextTerm } from '@/config/schoolTerms'

/** First day of the next school term (Sydney calendar date), the default pause resume date. */
export async function GET() {
  const term = getNextTerm()
  return NextResponse.json({ resumesAt: term ? term.startDate.toISOString().slice(0, 10) : null, termName: term?.name ?? null })
}
