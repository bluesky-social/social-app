import {Subscription, SubscriptionTier} from './types'

export function organizeMainSubscriptionsByTier(
  subscriptions: Subscription[],
): SubscriptionTier[] {
  const interim: Record<string, SubscriptionTier> = {}

  for (const sub of subscriptions) {
    const [_, tier, interval] = sub.id.split(':')

    interim[tier] = interim[tier] || {
      id: `main:${tier}`,
    }
    interim[tier][interval as 'monthly' | 'annual'] = sub
  }

  return Object.values(interim)
}
