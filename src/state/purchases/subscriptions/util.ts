import {Subscription, Subscriptions} from './types'

export function organizeMainSubscriptionsByTier(
  subscriptions: Subscription[],
): Subscriptions['available'] {
  const result: Subscriptions['available'] = {
    monthly: [],
    annual: [],
  }

  for (const sub of subscriptions) {
    result[sub.interval].push(sub)
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
