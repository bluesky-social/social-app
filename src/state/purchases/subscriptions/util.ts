import {Subscription, Subscriptions} from './types'

export function organizeMainSubscriptionsByTier(
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
    const _a = parseInt(a.id.split(':')[1])
    const _b = parseInt(b.id.split(':')[1])
    return _a - _b
  })
  result.annual = result.annual.sort((a, b) => {
    const _a = parseInt(a.id.split(':')[1])
    const _b = parseInt(b.id.split(':')[1])
    return _a - _b
  })

  return result
}
