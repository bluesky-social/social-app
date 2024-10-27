import {Subscription, Subscriptions} from './types'

export function organizeSubscriptionsByTier(
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
    const _a = parseInt(a.id.slice(0, 1))
    const _b = parseInt(b.id.slice(0, 1))
    return _a - _b
  })
  result.annual = result.annual.sort((a, b) => {
    const _a = parseInt(a.id.slice(0, 1))
    const _b = parseInt(b.id.slice(0, 1))
    return _a - _b
  })

  return result
}
