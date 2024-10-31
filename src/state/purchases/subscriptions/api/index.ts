import {Subscription} from '#/state/purchases/subscriptions/api/types'
import {Entitlement} from '#/state/purchases/subscriptions/types'

export async function getMainSubscriptions({
  did,
  platform,
  currency,
}: {
  did: string
  platform: 'web' | 'ios' | 'android'
  currency: string
}) {
  const res = await fetch(
    `https://bsky-purchases.ngrok.io/subscriptions/main?user=${did}&platform=${platform}&currency=${currency}`,
  )

  if (!res.ok) {
    console.error('error fetching subscriptions', res.status, await res.text())
    return {
      subscriptions: [],
    }
  }

  const json = await res.json()

  return json as {
    subscriptions: Subscription[]
  }
}

export async function getEntitlements({did}: {did: string}) {
  const res = await fetch(
    `https://bsky-purchases.ngrok.io/entitlements?user=${did}`,
  )

  if (!res.ok) {
    console.error('error fetching entitlements', res.status, await res.text())
    return []
  }

  const {entitlements} = await res.json()

  return entitlements as Entitlement[]
}

export async function updateSubscription({subscriptionId, newPriceId}: {subscriptionId: string, newPriceId: string}) {
  const res = await fetch(
    `https://bsky-purchases.ngrok.io/subscriptions/update`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({stripeSubscriptionId: subscriptionId, newPriceId}),
    }
  )

  if (!res.ok) {
    console.error('error updating subscription', res.status, await res.text())
    return
  }
}

export async function cancelSubscription({subscriptionId}: {subscriptionId: string}) {
  const res = await fetch(
    `https://bsky-purchases.ngrok.io/subscriptions/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({stripeSubscriptionId: subscriptionId}),
    }
  )

  if (!res.ok) {
    console.error('error cancelling subscription', res.status, await res.text())
    return
  }
}
