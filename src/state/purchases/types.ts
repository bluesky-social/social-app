import type {PurchasesStoreProduct} from 'react-native-purchases'

/**
 * Primitives
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
 * Subscription primitives
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

/**
 * API types for our toy server
 */

export type APISubscription = {
  group: SubscriptionGroupId
  platform: PlatformId
  renews: boolean
  periodDtartsAt: string
  periodEndsAt: string
  purchasedAt: string
}

export type APIEntitlement = {
  id: EntitlementId
}

/**
 * Parsers
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
