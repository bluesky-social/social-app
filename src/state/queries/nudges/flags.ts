/**
 * NEVER CHANGE THE ORDER OF THIS MAP, the compression step depends on the
 * other of the keys!
 */
export const flags = {
  newThreadgate: false,
  activitySubscriptionAlert: false,
} as const

export type Flag = keyof typeof flags

export const flagKeys = Object.keys(flags) as (keyof typeof flags)[]
