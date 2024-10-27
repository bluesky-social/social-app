import {SubscriptionId} from '#/state/purchases/subscriptions/types'

export type RawSubscriptionObjectBase<T> = T & {
  id: SubscriptionId
  storeId: string
  lookupKey: string
  checkoutId: string
  interval: 'monthly' | 'annual'
  autoRenew: boolean
  status:
    | 'trialing'
    | 'active'
    | 'expired'
    | 'in_grace_period'
    | 'in_billing_retry'
    | 'paused'
    | 'unknown'
    | 'incomplete'
    | null
  entitlements: {
    created_at: number
    display_name: string
    id: string
    lookup_key: string
    object: 'entitlement'
    project_id: string
  }[]
  startedAt: number | null
  periodStart: number | null
  periodEnd: number | null
}

export type RawSubscriptionObject =
  | RawSubscriptionObjectBase<{
      platform: 'android'
      provider: 'play_store'
    }>
  | RawSubscriptionObjectBase<{
      platform: 'ios'
      provider: 'app_store'
    }>
  | RawSubscriptionObjectBase<{
      platform: 'web'
      provider: 'stripe'
      price: number
    }>
