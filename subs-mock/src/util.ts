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
      /**
       * Using this to discriminate the union
       */
      platform: 'android' | 'ios'
      /**
       * Bsky internal ID. We map RC products to this for use in the app
       */
      id: SubscriptionId
      /**
       * This is the full ID from whatever store this product was configured in
       */
      storeId: string
      /**
       * This is the key needed to fetch the product from the RC SDK. For
       * Android, this is the first part of the `storeId` e.g. bsky_tier_0 with
       * no `:monthly-annual` suffix
       */
      lookupKey: string
      /**
       * A value needed to check out. This is useless on native, but on web, this is the `price.id`
       */
      checkoutId: string
      /**
       * The internal ID that we can use to fetch the subscription. For
       * Androi/iOS, we probably won't need this. On web, this is the Stripe
       * "subscription item" ID e.g. `si_xxx`
       */
      storeSubscriptionIdentifier: string | null
      /**
       * This is unused on native, on web we fill this in with fetched Stripe
       * product data. The price should be in cents, and we localize and format
       * this value on the client.
       */
      price?: number

      /**
       * The rest of this is pretty generic
       */
      interval: 'monthly' | 'annual'
      active: boolean
      autoRenewStatus: RevenueCatSubscription['auto_renewal_status'] | null
      provider: RevenueCatSubscription['store']
      status: RevenueCatSubscription['status'] | null
      entitlements: RevenueCatSubscription['entitlements']['items']
      startedAt: RevenueCatSubscription['starts_at'] | null
      periodStart: RevenueCatSubscription['current_period_starts_at'] | null
      periodEnd: RevenueCatSubscription['current_period_ends_at'] | null
    }
  | {
      platform: 'web'
      id: SubscriptionId
      storeId: string
      lookupKey: string
      checkoutId: string
      interval: 'monthly' | 'annual'
      active: boolean
      autoRenewStatus: RevenueCatSubscription['auto_renewal_status'] | null
      storeSubscriptionIdentifier: string | null
      provider: RevenueCatSubscription['store']
      status: RevenueCatSubscription['status'] | null
      entitlements: RevenueCatSubscription['entitlements']['items']
      startedAt: RevenueCatSubscription['starts_at'] | null
      periodStart: RevenueCatSubscription['current_period_starts_at'] | null
      periodEnd: RevenueCatSubscription['current_period_ends_at'] | null
      price: number
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
        subscription =>
          subscription.product_id === product.id && subscription.gives_access,
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
        active: subscription?.gives_access ?? false,
        platform: 'android',
        provider: 'play_store',
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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
        active: subscription?.gives_access ?? false,
        autoRenewStatus: subscription?.auto_renewal_status ?? null,
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

export enum EntitlementId {
  Main0 = 'main:0',
  Main1 = 'main:1',
  Main2 = 'main:2',
}

export function normalizeEntitlements(
  entitlements: RevenueCatSubscription['entitlements']['items'],
) {
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
