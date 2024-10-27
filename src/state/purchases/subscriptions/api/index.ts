import {RawSubscriptionObject} from '#/state/purchases/subscriptions/api/types'

export async function getSubscriptions({
  did,
  platform,
}: {
  did: string
  platform: 'web' | 'ios' | 'android'
}) {
  const res = await fetch(
    `https://bsky-purchases.ngrok.io/subscriptions?user=${did}&platform=${platform}`,
  )

  if (!res.ok) {
    console.error('error fetching subscriptions', res.status, await res.text())
    return []
  }

  const {subscriptions} = await res.json()

  return subscriptions as RawSubscriptionObject[]
}
