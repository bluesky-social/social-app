import {type app} from '#/lexicons'

/** The served active flag is authoritative, including unfinished inactive streams. */
export function getLivestreamStatus(
  view: app.bsky.embed.external.ViewLivestream,
): 'active' | 'ended' {
  return view.active ? 'active' : 'ended'
}

/** Elapsed whole seconds from the actual start, or creation when no start exists. */
export function getLivestreamDurationSeconds(
  view: app.bsky.embed.external.ViewLivestream,
): number | undefined {
  const start = view.startedAt ?? view.createdAt
  if (!view.endedAt || !start) return undefined
  const startedAt = Date.parse(start)
  const endedAt = Date.parse(view.endedAt)
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt)) return undefined
  const seconds = (endedAt - startedAt) / 1000
  return Number.isFinite(seconds) && seconds >= 0
    ? Math.floor(seconds)
    : undefined
}

/** Returns only the supplied credential-free HTTP(S) stream link. */
export function getLivestreamUrl(
  view: app.bsky.embed.external.ViewLivestream,
): string | undefined {
  const value = view.uri.trim()
  if (!/^https?:\/\//i.test(value)) return undefined
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password
      ? value
      : undefined
  } catch {
    return undefined
  }
}
