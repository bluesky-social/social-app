import {PurchasesStoreProduct} from 'react-native-purchases'

import {RawSubscriptionObjectBase} from '#/state/purchases/subscriptions/api/types'

export enum SubscriptionId {
  Main0MonthlyAuto = 'main:0:monthly:auto',
  Main0AnnualAuto = 'main:0:annual:auto',
  Main1MonthlyAuto = 'main:1:monthly:auto',
  Main1AnnualAuto = 'main:1:annual:auto',
  Main2MonthlyAuto = 'main:2:monthly:auto',
  Main2AnnualAuto = 'main:2:annual:auto',
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
