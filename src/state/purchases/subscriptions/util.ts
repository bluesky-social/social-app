import {
  Subscription,
  SubscriptionIdentifier,
  SubscriptionInfo,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'

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
    case 'bsky_tier_1:monthly-auto': {
      return {
        identifier: SubscriptionIdentifier.Tier1MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'bsky_tier_1:annual-auto': {
      return {
        identifier: SubscriptionIdentifier.Tier1AnnualAuto,
        interval: 'annual',
        autoRenew: true,
      }
    }
    case 'bsky_tier_2:monthly-auto': {
      return {
        identifier: SubscriptionIdentifier.Tier2MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'bsky_tier_2:annual-auto': {
      return {
        identifier: SubscriptionIdentifier.Tier2AnnualAuto,
        interval: 'annual',
        autoRenew: true,
      }
    }

    /*
     * Stripe
     */
    case 'prod_R2eNjNa6mB1Jlu': {
      return {
        identifier: SubscriptionIdentifier.Tier0MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'prod_R37Zg28EeQ9XAz': {
      return {
        identifier: SubscriptionIdentifier.Tier0AnnualAuto,
        interval: 'annual',
        autoRenew: true,
      }
    }
    case 'prod_R67eiEMuIf59w7': {
      return {
        identifier: SubscriptionIdentifier.Tier1MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'prod_R67fjfexQ7THQ0': {
      return {
        identifier: SubscriptionIdentifier.Tier1AnnualAuto,
        interval: 'annual',
        autoRenew: true,
      }
    }
    case 'prod_R67ftsSVu2U1D6': {
      return {
        identifier: SubscriptionIdentifier.Tier2MonthlyAuto,
        interval: 'monthly',
        autoRenew: true,
      }
    }
    case 'prod_R67gClEZy1cry2': {
      return {
        identifier: SubscriptionIdentifier.Tier2AnnualAuto,
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

export function organizeSubscriptionsByTier(
  subscriptions: Subscription[],
): Subscriptions {
  const result: Subscriptions = {
    monthly: [],
    annual: [],
  }

  for (const subscription of subscriptions) {
    const {info} = subscription
    result[info.interval].push(subscription)
  }

  result.monthly = result.monthly.sort((a, b) => {
    const _a = parseInt(a.info.identifier.slice(0, 1))
    const _b = parseInt(b.info.identifier.slice(0, 1))
    return _a - _b
  })
  result.annual = result.annual.sort((a, b) => {
    const _a = parseInt(a.info.identifier.slice(0, 1))
    const _b = parseInt(b.info.identifier.slice(0, 1))
    return _a - _b
  })

  return result
}
