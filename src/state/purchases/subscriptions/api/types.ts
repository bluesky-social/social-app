import {
  EntitlementId,
  SubscriptionId,
} from '#/state/purchases/subscriptions/types'

export type SubscriptionState = {
  active: boolean
  entitlements: {id: EntitlementId}[]
  status:
    | 'trialing'
    | 'active'
    | 'expired'
    | 'in_grace_period'
    | 'in_billing_retry'
    | 'paused'
    | 'unknown'
    | 'incomplete'
  renewalStatus:
    | 'will_renew'
    | 'will_not_renew'
    | 'will_change_product'
    | 'will_pause'
    | 'requires_price_increase_consent'
    | 'has_already_renewed'
  startedAt: number
  periodStart: number
  periodEnd: number
}

/**
 * Response from our API
 */
export type Subscription =
  | {
      id: SubscriptionId
      platform: 'android' | 'ios'
      interval: 'monthly' | 'annual'
      state?: SubscriptionState
      store: {
        type: 'play_store' | 'app_store'
        productId: string
        productLookupKey: string
      }
    }
  | {
      id: SubscriptionId
      platform: 'web'
      interval: 'monthly' | 'annual'
      state: undefined
      store: {
        type: 'stripe'
        productId: string
        price: number
        priceId: string
        subscriptionId: undefined
      }
    }
  | {
      id: SubscriptionId
      platform: 'web'
      interval: 'monthly' | 'annual'
      state: SubscriptionState
      store: {
        type: 'stripe'
        productId: string
        price: number
        priceId: string
        subscriptionId: string
      }
    }
