import {PurchasesStoreProduct} from 'react-native-purchases'

import {Subscription as APISubscription} from '#/state/purchases/subscriptions/api/types'

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

export type Subscription =
  | {
      id: SubscriptionId
      platform: 'android'
      interval: 'monthly' | 'annual'
      /**
       * Response from our API
       */
      subscription: APISubscription
      price?: {
        value: number
        formatted: string
      }
      product?: PurchasesStoreProduct
    }
  | {
      id: SubscriptionId
      platform: 'ios'
      interval: 'monthly' | 'annual'
      /**
       * Response from our API
       */
      subscription: APISubscription
      price?: {
        value: number
        formatted: string
      }
      product?: PurchasesStoreProduct
    }
  | {
      id: SubscriptionId
      platform: 'web'
      interval: 'monthly' | 'annual'
      /**
       * Response from our API
       */
      subscription: APISubscription
      price: {
        value: number
        formatted: string
      }
      product: string
    }

export type Subscriptions = {
  active: Subscription[]
  available: {
    monthly: Subscription[]
    annual: Subscription[]
  }
}
