import type { PurchasesStoreProduct } from 'react-native-purchases'

export enum EntitlementId {
  Core = 'core',
}

export enum PlatformId {
  Android = 'android',
  Ios = 'ios',
  Web = 'web',
}

export enum SubscriptionGroupId {
  Core = 'core',
}

export enum OfferingId {
  CoreMonthly = 'coreMonthly',
  CoreAnnual = 'coreAnnual',
}

export type Offering =
  | {
      id: OfferingId
      platform: PlatformId.Ios | PlatformId.Android
      price: number
      package: PurchasesStoreProduct
    }
  | {
      id: OfferingId
      platform: PlatformId.Web
      price: number
      package: {
        priceId: string
      }
    }
