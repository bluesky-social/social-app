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

export type Subscription =
  | {
      platform: 'android' | 'ios'
      id: SubscriptionId
      storeId: string
      lookupKey: string
      checkoutId: string
      interval: 'monthly' | 'annual'
      autoRenew: boolean
      storeSubscriptionIdentifier: string | null
      provider: RevenueCatSubscription['store']
      status: RevenueCatSubscription['status'] | null
      entitlements: RevenueCatSubscription['entitlements']['items']
      startedAt: RevenueCatSubscription['starts_at'] | null
      periodStart: RevenueCatSubscription['current_period_starts_at'] | null
      periodEnd: RevenueCatSubscription['current_period_ends_at'] | null
      price?: number
    }
  | {
      platform: 'web'
      id: SubscriptionId
      storeId: string
      lookupKey: string
      checkoutId: string
      interval: 'monthly' | 'annual'
      autoRenew: boolean
      storeSubscriptionIdentifier: string | null
      provider: RevenueCatSubscription['store']
      status: RevenueCatSubscription['status'] | null
      entitlements: RevenueCatSubscription['entitlements']['items']
      startedAt: RevenueCatSubscription['starts_at'] | null
      periodStart: RevenueCatSubscription['current_period_starts_at'] | null
      periodEnd: RevenueCatSubscription['current_period_ends_at'] | null
      price: number
    }

export type Subscriptions = {
  monthly: Subscription[]
  annual: Subscription[]
}

export function getMainSubscriptionProducts(
  products: RevenueCatProduct[],
  subscriptions: RevenueCatSubscription[],
): Subscription[] {
  return products
    .filter(product => product.type === 'subscription')
    .map(product => ({
      product,
      subscription: subscriptions.find(
        subscription => subscription.product_id === product.id,
      ),
    }))
    .map(normalizeMainSubscriptionProduct)
    .filter(Boolean) as Subscription[]
}

export function normalizeMainSubscriptionProduct({
  product,
  subscription,
}: {
  product: RevenueCatProduct
  subscription: RevenueCatSubscription | undefined
}): Subscription | undefined {
  switch (product.store_identifier) {
    /*
     * Android
     */
    case 'bsky_tier_0:monthly-auto': {
      return {
        id: SubscriptionId.Main0MonthlyAuto,
        storeId: product.store_identifier,
        lookupKey: 'bsky_tier_0',
        checkoutId: product.store_identifier,
        interval: 'monthly',
        autoRenew: true,
        platform: 'android',
        provider: 'play_store',
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'bsky_tier_0:annual-auto': {
      return {
        id: SubscriptionId.Main0AnnualAuto,
        storeId: product.store_identifier,
        lookupKey: 'bsky_tier_0',
        checkoutId: product.store_identifier,
        interval: 'annual',
        autoRenew: true,
        platform: 'android',
        provider: 'play_store',
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'bsky_tier_1:monthly-auto': {
      return {
        id: SubscriptionId.Main1MonthlyAuto,
        storeId: product.store_identifier,
        lookupKey: 'bsky_tier_1',
        checkoutId: product.store_identifier,
        interval: 'monthly',
        autoRenew: true,
        platform: 'android',
        provider: 'play_store',
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'bsky_tier_1:annual-auto': {
      return {
        id: SubscriptionId.Main1AnnualAuto,
        storeId: product.store_identifier,
        lookupKey: 'bsky_tier_1',
        checkoutId: product.store_identifier,
        interval: 'annual',
        autoRenew: true,
        platform: 'android',
        provider: 'play_store',
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'bsky_tier_2:monthly-auto': {
      return {
        id: SubscriptionId.Main2MonthlyAuto,
        storeId: product.store_identifier,
        lookupKey: 'bsky_tier_2',
        checkoutId: product.store_identifier,
        interval: 'monthly',
        autoRenew: true,
        platform: 'android',
        provider: 'play_store',
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'bsky_tier_2:annual-auto': {
      return {
        id: SubscriptionId.Main2AnnualAuto,
        storeId: product.store_identifier,
        lookupKey: 'bsky_tier_2',
        checkoutId: product.store_identifier,
        interval: 'annual',
        autoRenew: true,
        platform: 'android',
        provider: 'play_store',
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }

    /*
     * Stripe
     */
    case 'prod_R2eNjNa6mB1Jlu': {
      return {
        id: SubscriptionId.Main0MonthlyAuto,
        storeId: product.store_identifier,
        lookupKey: product.store_identifier,
        checkoutId: product.store_identifier,
        interval: 'monthly',
        autoRenew: true,
        platform: 'web',
        provider: 'stripe',
        price: 0,
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'prod_R37Zg28EeQ9XAz': {
      return {
        id: SubscriptionId.Main0AnnualAuto,
        storeId: product.store_identifier,
        lookupKey: product.store_identifier,
        checkoutId: product.store_identifier,
        interval: 'annual',
        autoRenew: true,
        platform: 'web',
        provider: 'stripe',
        price: 0,
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'prod_R67eiEMuIf59w7': {
      return {
        id: SubscriptionId.Main1MonthlyAuto,
        storeId: product.store_identifier,
        lookupKey: product.store_identifier,
        checkoutId: product.store_identifier,
        interval: 'monthly',
        autoRenew: true,
        platform: 'web',
        provider: 'stripe',
        price: 0,
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'prod_R67fjfexQ7THQ0': {
      return {
        id: SubscriptionId.Main1AnnualAuto,
        storeId: product.store_identifier,
        lookupKey: product.store_identifier,
        checkoutId: product.store_identifier,
        interval: 'annual',
        autoRenew: true,
        platform: 'web',
        provider: 'stripe',
        price: 0,
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'prod_R67ftsSVu2U1D6': {
      return {
        id: SubscriptionId.Main2MonthlyAuto,
        storeId: product.store_identifier,
        lookupKey: product.store_identifier,
        checkoutId: product.store_identifier,
        interval: 'monthly',
        autoRenew: true,
        platform: 'web',
        provider: 'stripe',
        price: 0,
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
      }
    }
    case 'prod_R67gClEZy1cry2': {
      return {
        id: SubscriptionId.Main2AnnualAuto,
        storeId: product.store_identifier,
        lookupKey: product.store_identifier,
        checkoutId: product.store_identifier,
        interval: 'annual',
        autoRenew: true,
        platform: 'web',
        provider: 'stripe',
        price: 0,
        storeSubscriptionIdentifier:
          subscription?.store_subscription_identifier ?? null,
        status: subscription?.status ?? null,
        entitlements: subscription?.gives_access
          ? subscription?.entitlements?.items ?? []
          : [],
        startedAt: subscription?.starts_at ?? null,
        periodStart: subscription?.current_period_starts_at ?? null,
        periodEnd: subscription?.current_period_ends_at ?? null,
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

export function organizeSubscriptionsByMain(
  subscriptions: Subscription[],
): Subscriptions {
  const result: Subscriptions = {
    monthly: [],
    annual: [],
  }

  for (const subscription of subscriptions) {
    const {interval} = subscription
    result[interval].push(subscription)
  }

  result.monthly = result.monthly.sort((a, b) => {
    const _a = parseInt(a.id.slice(0, 1))
    const _b = parseInt(b.id.slice(0, 1))
    return _a - _b
  })
  result.annual = result.annual.sort((a, b) => {
    const _a = parseInt(a.id.slice(0, 1))
    const _b = parseInt(b.id.slice(0, 1))
    return _a - _b
  })

  return result
}
