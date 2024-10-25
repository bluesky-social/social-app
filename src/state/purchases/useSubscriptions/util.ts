import {
  SubscriptionIdentifier,
  SubscriptionInfo,
} from '#/state/purchases/useSubscriptions/types'

export function identifierToSubscriptionInfo(
  identifier: string,
): SubscriptionInfo | undefined {
  switch (identifier) {
    /*
     * Android
     */
    case 'bsky_tier_0:monthly-auto': {
      return {
        identifier: SubscriptionIdentifier.Tier0MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'bsky_tier_0:annual-auto': {
      return {
        identifier: SubscriptionIdentifier.Tier0AnnualAuto,
        interval: 'annual',
        autoRenew: true,
      }
    }

    /*
     * Stripe
     */
    case 'bsky_tier_0_monthly': {
      return {
        identifier: SubscriptionIdentifier.Tier0MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'bsky_tier_0_annual': {
      return {
        identifier: SubscriptionIdentifier.Tier0MonthlyAuto,
        interval: 'annual',
        autoRenew: true,
      }
    }

    /*
     * Fallback
     */
    default: {
      return undefined
    }
  }
}
