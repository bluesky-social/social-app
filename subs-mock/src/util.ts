/**
 * @see https://www.revenuecat.com/docs/api-v2#tag/Product/operation/list-products
 */
export type RevenueCatProduct = {
  id: string
  object: 'product'
  store_identifier: string
  type: 'subscription'
  app:
    | {
        type: 'stripe'
        id: string
        project_id: string
        stripe: {
          stripe_account_id: string
        }
      }
    | {
        type: 'play_store'
        id: string
        project_id: string
        play_store: {
          package_name: string
        }
      }
    | {
        type: 'app_store'
        id: string
        project_id: string
        app_store: {
          bundle_id: string
        }
      }
}

/**
 * @see https://www.revenuecat.com/docs/api-v2#tag/Customer/operation/list-subscriptions
 */
export type RevenueCatSubscription = {
  id: string
  product_id: 'prodc783cb31d8'
  environment: 'sandbox'
  status:
    | 'trialing'
    | 'active'
    | 'expired'
    | 'in_grace_period'
    | 'in_billing_retry'
    | 'paused'
    | 'unknown'
    | 'incomplete'
  store: 'stripe' | 'play_store' | 'app_store'
  object: 'subscription'
  auto_renewal_status:
    | 'will_renew'
    | 'will_not_renew'
    | 'will_change_product'
    | 'will_pause'
    | 'requires_price_increase_consent'
    | 'has_already_renewed'
  starts_at: number
  current_period_ends_at: number
  current_period_starts_at: number
  customer_id: string // DID
  original_customer_id: string // should be DID, may be anon
  entitlements: {
    items: {
      created_at: number
      display_name: string
      id: string
      lookup_key: string
      object: 'entitlement'
      project_id: string
    }[]
    next_page: null
    object: 'list'
    url: string
  }
  management_url: unknown
  gives_access: boolean
  store_subscription_identifier: string
}

export enum SubscriptionId {
  Main0MonthlyAuto = 'main:0:monthly:auto',
  Main0AnnualAuto = 'main:0:annual:auto',
  Main1MonthlyAuto = 'main:1:monthly:auto',
  Main1AnnualAuto = 'main:1:annual:auto',
  Main2MonthlyAuto = 'main:2:monthly:auto',
  Main2AnnualAuto = 'main:2:annual:auto',
}

export enum EntitlementId {
  Main0 = 'main:0',
  Main1 = 'main:1',
  Main2 = 'main:2',
}

export type Entitlement = {
  id: EntitlementId
}

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

export function normalizeSubscriptions(
  products: RevenueCatProduct[],
  subscriptions: RevenueCatSubscription[],
): Subscription[] {
  // should always be subscriptions, but guard here
  const subscriptionProducts = products.filter(
    product => product.type === 'subscription',
  )

  const normalized: Subscription[] = []

  for (const product of subscriptionProducts) {
    /**
     * Matches product ID and gives user access (is active)
     * @see https://www.revenuecat.com/docs/api-v2#tag/Customer/operation/list-subscriptions
     */
    const subscription = subscriptions.find(
      s => s.product_id === product.id && s.gives_access,
    )

    const id = normalizeSubscriptionId(product.store_identifier)
    if (!id) continue
    const platform = getSubscriptionPlatform(product.store_identifier)
    const state = subscription ? getSubscriptionState(subscription) : undefined
    const interval = getSubscriptionInterval(id)

    if (platform === 'web') {
      if (state) {
        normalized.push({
          id,
          platform,
          interval,
          state,
          store: {
            type: 'stripe',
            price: 0,
            productId: product.store_identifier,
            priceId: '',
            subscriptionId: subscription?.store_subscription_identifier!,
          },
        })
      } else {
        normalized.push({
          id,
          platform,
          interval,
          state,
          store: {
            type: 'stripe',
            productId: product.store_identifier,
            price: 0,
            priceId: '',
            subscriptionId: undefined,
          },
        })
      }
    } else {
      normalized.push({
        id,
        platform,
        interval,
        state,
        store: {
          type: platform === 'android' ? 'play_store' : 'app_store',
          productId: product.store_identifier,
          productLookupKey: getProductLookupKey(product.store_identifier),
        },
      })
    }
  }

  return normalized
}

export function getSubscriptionInterval(
  id: SubscriptionId,
): 'monthly' | 'annual' {
  switch (id) {
    case SubscriptionId.Main0MonthlyAuto:
    case SubscriptionId.Main1MonthlyAuto:
    case SubscriptionId.Main2MonthlyAuto:
      return 'monthly'
    case SubscriptionId.Main0AnnualAuto:
    case SubscriptionId.Main1AnnualAuto:
    case SubscriptionId.Main2AnnualAuto:
      return 'annual'
  }
}

export function getSubscriptionState(
  subscription: RevenueCatSubscription,
): SubscriptionState {
  return {
    active: subscription.gives_access,
    status: subscription.status,
    renewalStatus: subscription.auto_renewal_status,
    entitlements: normalizeEntitlements(subscription.entitlements.items),
    startedAt: subscription.starts_at,
    periodStart: subscription.current_period_starts_at,
    periodEnd: subscription.current_period_ends_at,
  }
}

export function getSubscriptionPlatform(id: string): 'web' | 'android' | 'ios' {
  console.log(id)
  switch (id) {
    case 'prod_R2eNjNa6mB1Jlu':
    case 'prod_R37Zg28EeQ9XAz':
    case 'prod_R67eiEMuIf59w7':
    case 'prod_R67fjfexQ7THQ0':
    case 'prod_R67ftsSVu2U1D6':
    case 'prod_R67gClEZy1cry2': {
      return 'web'
    }
    case 'bsky_tier_0:monthly-auto':
    case 'bsky_tier_0:annual-auto':
    case 'bsky_tier_1:monthly-auto':
    case 'bsky_tier_1:annual-auto':
    case 'bsky_tier_2:monthly-auto':
    case 'bsky_tier_2:annual-auto': {
      return 'android'
    }
    case 'bsky_tier_0_monthly':
    case 'bsky_tier_0_annual':
    case 'bsky_tier_1_monthly':
    case 'bsky_tier_1_annual':
    case 'bsky_tier_2_monthly':
    case 'bsky_tier_2_annual': {
      return 'ios'
    }
    default: {
      throw new Error(`Unknown product ID: ${id}`)
    }
  }
}

export function getProductLookupKey(id: string): string {
  switch (id) {
    case 'bsky_tier_0:monthly-auto':
    case 'bsky_tier_0:annual-auto':
      return 'bsky_tier_0'
    case 'bsky_tier_1:monthly-auto':
    case 'bsky_tier_1:annual-auto':
      return 'bsky_tier_1'
    case 'bsky_tier_2:monthly-auto':
    case 'bsky_tier_2:annual-auto':
      return 'bsky_tier_2'
    default:
      return id
  }
}

export function normalizeSubscriptionId(
  id: string,
): SubscriptionId | undefined {
  switch (id) {
    case 'bsky_tier_0_monthly':
    case 'bsky_tier_0:monthly-auto':
    case 'prod_R2eNjNa6mB1Jlu':
      return SubscriptionId.Main0MonthlyAuto
    case 'bsky_tier_0_annual':
    case 'bsky_tier_0:annual-auto':
    case 'prod_R37Zg28EeQ9XAz':
      return SubscriptionId.Main0AnnualAuto
    case 'bsky_tier_1_monthly':
    case 'bsky_tier_1:monthly-auto':
    case 'prod_R67eiEMuIf59w7':
      return SubscriptionId.Main1MonthlyAuto
    case 'bsky_tier_1_annual':
    case 'bsky_tier_1:annual-auto':
    case 'prod_R67fjfexQ7THQ0':
      return SubscriptionId.Main1AnnualAuto
    case 'bsky_tier_2_monthly':
    case 'bsky_tier_2:monthly-auto':
    case 'prod_R67ftsSVu2U1D6':
      return SubscriptionId.Main2MonthlyAuto
    case 'bsky_tier_2_annual':
    case 'bsky_tier_2:annual-auto':
    case 'prod_R67gClEZy1cry2':
      return SubscriptionId.Main2AnnualAuto
    default: {
      return undefined
    }
  }
}

export function normalizeEntitlements(entitlements: any[]) {
  return entitlements.map(entitlement => {
    let id = EntitlementId.Main0

    switch (entitlement.lookup_key) {
      case 'main:0': {
        id = EntitlementId.Main0
        break
      }
      case 'main:1': {
        id = EntitlementId.Main1
        break
      }
      case 'main:2': {
        id = EntitlementId.Main2
        break
      }
    }

    return {
      id,
    }
  })
}
