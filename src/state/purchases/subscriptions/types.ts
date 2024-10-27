import {PurchasesStoreProduct} from 'react-native-purchases'

import {RawSubscriptionObjectBase} from '#/state/purchases/subscriptions/api/types'

export enum SubscriptionId {
  Tier0MonthlyAuto = '0:monthly:auto',
  Tier0AnnualAuto = '0:annual:auto',
  Tier1MonthlyAuto = '1:monthly:auto',
  Tier1AnnualAuto = '1:annual:auto',
  Tier2MonthlyAuto = '2:monthly:auto',
  Tier2AnnualAuto = '2:annual:auto',
}

export type Subscription =
  | RawSubscriptionObjectBase<{
      platform: 'android'
      provider: 'play_store'
      price: {
        value: number
        formatted: string
      }
      product: {
        platform: 'android'
        data: PurchasesStoreProduct
      }
    }>
  | RawSubscriptionObjectBase<{
      platform: 'ios'
      provider: 'app_store'
      price: {
        value: number
        formatted: string
      }
      product: {
        platform: 'ios'
        data: PurchasesStoreProduct
      }
    }>
  | RawSubscriptionObjectBase<{
      platform: 'web'
      provider: 'stripe'
      price: {
        value: number
        formatted: string
      }
      product: {
        platform: 'web'
        data: string
      }
    }>

export type Subscriptions = {
  monthly: Subscription[]
  annual: Subscription[]
}
