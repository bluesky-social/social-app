export enum SubscriptionIdentifier {
  Tier0MonthlyAuto = '0:monthly:auto',
  Tier0AnnualAuto = '0:annual:auto',
  Tier1MonthlyAuto = '1:monthly:auto',
  Tier1AnnualAuto = '1:annual:auto',
  Tier2MonthlyAuto = '2:monthly:auto',
  Tier2AnnualAuto = '2:annual:auto',
}

export type SubscriptionInfo = {
  identifier: SubscriptionIdentifier
  interval: 'monthly' | 'annual'
  autoRenew: boolean
}

export type Subscription = {
  info: SubscriptionInfo
  price: {
    formatted: string
    value: number
  }
  raw: any
}

export type Subscriptions = {
  monthly: Subscription[]
  annual: Subscription[]
}
