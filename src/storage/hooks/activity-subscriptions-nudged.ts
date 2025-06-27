import {device, useStorage} from '#/storage'

export function useActivitySubscriptionsNudged() {
  const [activitySubscriptionsNudged = false, setActivitySubscriptionsNudged] =
    useStorage(device, ['activitySubscriptionsNudged'])

  return [activitySubscriptionsNudged, setActivitySubscriptionsNudged] as const
}
