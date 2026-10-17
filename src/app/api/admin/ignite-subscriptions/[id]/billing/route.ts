import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { fromZonedTime } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'
import { adminRoleFromAuthorization } from '@/lib/adminAuth'
import {
  igniteSubscriptionLifecycle,
  nextTermResumeDate,
  stripeUpdateFor,
  type SubscriptionAction
} from '@/lib/igniteSubscriptionActions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

function parseAction(body: { action?: string; resumesAt?: string }): SubscriptionAction | string {
  switch (body.action) {
    case 'pause': {
      const resumesAt = body.resumesAt ? fromZonedTime(`${body.resumesAt}T00:00:00`, 'Australia/Sydney') : nextTermResumeDate()
      if (!resumesAt || Number.isNaN(resumesAt.getTime())) return 'A valid resume date is required.'
      if (resumesAt <= new Date()) return 'The resume date must be in the future.'
      return { action: 'pause', resumesAt }
    }
    case 'resume':
    case 'cancel':
    case 'undo-cancel':
      return { action: body.action }
    default:
      return 'Unknown action.'
  }
}

/**
 * Super-admin billing actions on an Ignite subscription. Stripe is the source
 * of truth; the local row is refreshed from Stripe's response so the admin UI
 * reflects the change immediately rather than waiting for the webhook.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (adminRoleFromAuthorization(request.headers.get('authorization')) !== 'super') {
    return NextResponse.json({ error: 'Only a super admin can change Stripe billing.' }, { status: 403 })
  }

  const { id } = await params
  const local = await prisma.igniteSubscription.findUnique({ where: { id } })
  if (!local) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const parsed = parseAction(await request.json().catch(() => ({})))
  if (typeof parsed === 'string') {
    return NextResponse.json({ error: parsed }, { status: 400 })
  }

  try {
    const current = await stripe.subscriptions.retrieve(local.stripeSubscriptionId)
    if (current.status === 'canceled' || current.status === 'incomplete_expired') {
      // Our copy missed the cancellation; bring it in line so the admin shows it as ended.
      const lifecycle = igniteSubscriptionLifecycle(current)
      await prisma.igniteSubscription.update({ where: { id }, data: lifecycle })
      return NextResponse.json({ subscription: { id, ...lifecycle }, alreadyEnded: true })
    }

    const updated = await stripe.subscriptions.update(local.stripeSubscriptionId, stripeUpdateFor(parsed, current))
    const lifecycle = igniteSubscriptionLifecycle(updated)
    await prisma.igniteSubscription.update({ where: { id }, data: lifecycle })

    console.log(`Admin ${parsed.action} on Ignite subscription ${local.stripeSubscriptionId}`)
    return NextResponse.json({ subscription: { id, ...lifecycle } })
  } catch (error) {
    console.error('Ignite billing action failed:', error)
    const message = error instanceof Stripe.errors.StripeError ? error.message : 'Stripe update failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
