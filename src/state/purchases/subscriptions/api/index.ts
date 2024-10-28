import {RawSubscriptionObject} from '#/state/purchases/subscriptions/api/types'
import {EntitlementId} from '#/state/purchases/subscriptions/types'

export async function getMainSubscriptions({
  did,
  platform,
}: {
  did: string
  platform: 'web' | 'ios' | 'android'
}) {
  const res = await fetch(
    `https://bsky-purchases.ngrok.io/subscriptions/main?user=${did}&platform=${platform}`,
  )

  if (!res.ok) {
    console.error('error fetching subscriptions', res.status, await res.text())
    return {
      active: [],
      available: [],
    }
  }

  const json = await res.json()

  return json as {
    active: RawSubscriptionObject[]
    available: RawSubscriptionObject[]
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

  return entitlements as {id: EntitlementId}[]
}
