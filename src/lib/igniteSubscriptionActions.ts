import type Stripe from 'stripe'
import { fromZonedTime } from 'date-fns-tz'
import { getNextTerm } from '@/config/schoolTerms'

const SYDNEY_TZ = 'Australia/Sydney'
const WEEK_SECONDS = 7 * 24 * 60 * 60

const IGNITE_SUBSCRIPTION_STATUS: Record<string, 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'> = {
  active: 'ACTIVE',
  paused: 'PAUSED',
  canceled: 'CANCELED',
  past_due: 'PAST_DUE',
  trialing: 'TRIALING',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELED',
  unpaid: 'PAST_DUE'
}

export function igniteSubscriptionStatus(subscription: Pick<Stripe.Subscription, 'status' | 'pause_collection'>) {
  // Stripe keeps status=active while invoice collection is paused. Mirror the
  // collection state so paused enrolments are not shown as billable. A
  // cancelled subscription keeps its old pause_collection, so it must not
  // read as paused.
  if (subscription.pause_collection && (subscription.status === 'active' || subscription.status === 'trialing')) return 'PAUSED' as const
  return IGNITE_SUBSCRIPTION_STATUS[subscription.status] || 'ACTIVE'
}

/** Lifecycle fields mirrored from Stripe onto the local IgniteSubscription row. */
export function igniteSubscriptionLifecycle(subscription: Stripe.Subscription) {
  return {
    status: igniteSubscriptionStatus(subscription),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    pauseResumesAt: subscription.pause_collection?.resumes_at ? new Date(subscription.pause_collection.resumes_at * 1000) : null
  }
}

/** Default resume date for an admin pause: midnight Sydney on the first day of the next term. */
export function nextTermResumeDate(now: Date = new Date()): Date | null {
  const term = getNextTerm(now)
  if (!term) return null
  return fromZonedTime(`${term.startDate.toISOString().slice(0, 10)}T00:00:00`, SYDNEY_TZ)
}

/**
 * The cancellation policy charges the current week and the following week. The
 * current paid period ends at current_period_end, so the subscription renews
 * once more and then ends one week later.
 */
export function noticeCancellationTimestamp(subscription: Pick<Stripe.Subscription, 'current_period_end'>): number {
  return subscription.current_period_end + WEEK_SECONDS
}

export type SubscriptionAction =
  | { action: 'pause'; resumesAt: Date }
  | { action: 'resume' }
  | { action: 'cancel' }
  | { action: 'undo-cancel' }

export function stripeUpdateFor(
  request: SubscriptionAction,
  subscription: Pick<Stripe.Subscription, 'current_period_end'>
): Stripe.SubscriptionUpdateParams {
  switch (request.action) {
    case 'pause':
      return { pause_collection: { behavior: 'void', resumes_at: Math.floor(request.resumesAt.getTime() / 1000) } }
    case 'resume':
      return { pause_collection: '' }
    case 'cancel':
      return { cancel_at: noticeCancellationTimestamp(subscription) }
    case 'undo-cancel':
      return { cancel_at: '' }
  }
}
