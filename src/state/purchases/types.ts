import type {PurchasesStoreProduct} from 'react-native-purchases'

/**
 * PRIMITIVES
 */

export enum EntitlementId {
  Core = 'core',
}

export enum PlatformId {
  Android = 'android',
  Ios = 'ios',
  Web = 'web',
}

/**
 * SUBSCRIPTION PRIMITIVES
 */

export enum SubscriptionGroupId {
  Core = 'core',
}

export enum SubscriptionOfferingId {
  CoreMonthly = 'coreMonthly',
  CoreAnnual = 'coreAnnual',
}

export type SubscriptionOffering =
  | {
      id: SubscriptionOfferingId
      platform: PlatformId.Ios | PlatformId.Android
      package: PurchasesStoreProduct
    }
  | {
      id: SubscriptionOfferingId
      platform: PlatformId.Web
      package: {
        priceId: string
      }
    }

export type NativePurchaseRestricted = 'yes' | 'no' | 'unknown'

/**
 * API TYPES FROM OUR TOY SERVER
 */

export type APISubscription = {
  status: 'active' | 'paused' | 'expired' | 'unknown'
  renewalStatus: 'will_renew' | 'will_not_renew' | 'will_pause' | 'unknown'
  group: SubscriptionGroupId
  platform: PlatformId
  offering: SubscriptionOfferingId
  periodDtartsAt: string
  periodEndsAt: string
  purchasedAt: string
}

export type APIEntitlement = {
  id: EntitlementId
}

export type APIOffering = {
  id: SubscriptionOfferingId
  platform: PlatformId
  product: string
}

/**
 * CUSTOM ERROR TYPES
 */

/**
 * Thrown if the device already has active subscriptions for other accounts.
 *
 * @see https://www.revenuecat.com/docs/test-and-launch/errors#-receipt_already_in_use
 */
export class ReceiptAlreadyInUseError extends Error {}

/**
 * PARSERS
 */

export function parseOfferingId(id: string): SubscriptionOfferingId {
  switch (id) {
    case 'coreMonthly':
      return SubscriptionOfferingId.CoreMonthly
    case 'coreAnnual':
      return SubscriptionOfferingId.CoreAnnual
    default:
      throw new Error(`Unknown offering id: ${id}`)
  }
}
