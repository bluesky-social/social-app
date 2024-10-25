export enum SubscriptionIdentifier {
  Tier0MonthlyAuto = 'Tier0MonthlyAuto',
  Tier0AnnualAuto = 'Tier0AnnualAuto',
  Tier1MonthlyAuto = 'Tier1MonthlyAuto',
  Tier1AnnualAuto = 'Tier1AnnualAuto',
  Tier2MonthlyAuto = 'Tier2MonthlyAuto',
  Tier2AnnualAuto = 'Tier2AnnualAuto',
}

export type SubscriptionInfo = {
  identifier: SubscriptionIdentifier
  interval: 'monthly' | 'annual'
  autoRenew: boolean
}

export type Subscription = {
  info: SubscriptionInfo
  raw: any
}
