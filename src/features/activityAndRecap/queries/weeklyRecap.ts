/**
 * TanStack Query for the weekly recap (AC-B2, B4, B8, B10, B11, R3).
 *
 * Key shape (see `src/state/queries/util.ts:28`):
 *   createQueryKey('weeklyRecap', {did, weekIso}, {persistedVersion: 1})
 *
 * Behavior:
 *   - `enabled` gate combines hasSession + StreaksAndRecapEnable +
 *     showRecap preference + weekIso != null. When toggle is off, the
 *     query never fires (AC-B11 zero-XRPC).
 *   - `getAuthorFeed` pagination hard-capped at WEEKLY_RECAP_MAX_PAGES;
 *     short-circuits when oldest indexedAt < windowStart (R3).
 *   - `getProfile` is called once to capture follower snapshot.
 *   - Only `{uri, cid}` persists for `topPost` and `topPostCandidates`;
 *     the Recap screen re-fetches the full post so it inherits moderation
 *     filtering (B10).
 *   - Auto-retry capped at 2/hr/weekIso via retryBudget.ts (B8). Manual
 *     retry bypasses.
 */

import {type AppBskyFeedDefs, type AtpAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {GCTIME, STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent, useSession} from '#/state/session'
import {
  RECAP_ZERO_POSTS_COPY,
  WEEKLY_RECAP_MAX_PAGES,
  WEEKLY_RECAP_PAGE_LIMIT,
} from '#/features/activityAndRecap/constants'
import {useShowRecapPreference} from '#/features/activityAndRecap/hooks/useShowRecapPreference'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {
  resetAutoRetry,
  tryAutoRetry,
} from '#/features/activityAndRecap/queries/retryBudget'
import {formatLocalDay} from '#/features/activityAndRecap/reducer/dayMath'
import {followerDelta as computeFollowerDelta} from '#/features/activityAndRecap/reducer/followerDelta'
import {weekWindowForIso} from '#/features/activityAndRecap/reducer/isoWeek'
import {
  rankTopPost,
  type TopPostCandidate,
} from '#/features/activityAndRecap/reducer/rankTopPost'
import {readFollowerSnapshots} from '#/features/activityAndRecap/storage'
import {type WeeklyRecap} from '#/features/activityAndRecap/types'

// Exported for potential external invalidation. Kept intentionally simple.
export const weeklyRecapQueryKeyRoot = 'weeklyRecap'

export const createWeeklyRecapQueryKey = (args: {
  did: string
  weekIso: string
}) => createQueryKey(weeklyRecapQueryKeyRoot, args, {persistedVersion: 1})

/** Exported for tests + Recap screen zero-posts copy. */
export const ZERO_POSTS_COPY = RECAP_ZERO_POSTS_COPY

type FeedViewPost = AppBskyFeedDefs.FeedViewPost

/**
 * Pure core of the queryFn. Exported for unit tests so we can exercise
 * pagination + short-circuit + moderation-candidate gathering without
 * touching the TanStack Query plumbing.
 */
export async function computeWeeklyRecap(args: {
  agent: AtpAgent
  did: string
  weekIso: string
  zone: string
  /** Injectable clock for tests; defaults to Date.now(). */
  now?: number
}): Promise<WeeklyRecap> {
  const {agent, did, weekIso, zone, now = Date.now()} = args
  const window = weekWindowForIso(weekIso)
  if (!window) {
    throw new Error(`[weeklyRecap] invalid weekIso: ${weekIso}`)
  }
  const windowStartMs = window.start.getTime()
  const windowEndMs = window.end.getTime()

  // --- Paginated getAuthorFeed ---
  const collected: FeedViewPost[] = []
  let cursor: string | undefined
  for (let page = 0; page < WEEKLY_RECAP_MAX_PAGES; page++) {
    const res = await agent.app.bsky.feed.getAuthorFeed({
      actor: did,
      limit: WEEKLY_RECAP_PAGE_LIMIT,
      cursor,
      filter: 'posts_with_replies',
    })
    const items = res.data.feed ?? []
    if (items.length === 0) break
    for (const item of items) collected.push(item)
    cursor = res.data.cursor

    // R3 short-circuit: if the oldest item on this page predates windowStart,
    // we're done.
    const oldest = items[items.length - 1]
    const oldestAt = oldest?.post?.indexedAt
      ? new Date(oldest.post.indexedAt).getTime()
      : undefined
    if (oldestAt != null && oldestAt < windowStartMs) break
    if (!cursor) break
  }

  // --- Filter in-window own-authored posts ---
  const inWindow: FeedViewPost[] = collected.filter(item => {
    const post = item.post
    if (!post) return false
    const tMs = new Date(post.indexedAt).getTime()
    if (tMs < windowStartMs || tMs > windowEndMs) return false
    // Own-authored check (includes replies by self; reposts have a
    // different `reason` that still lists the reposting actor as `by`).
    return post.author?.did === did
  })

  // Count combined (posts + self-replies + self-reposts) per Q_B2_posts default.
  const postsCount = inWindow.length

  // Rank candidates using the pure helper.
  const candidates: TopPostCandidate[] = inWindow
    .map(({post}) => ({
      uri: post.uri,
      cid: post.cid,
      likeCount: post.likeCount ?? 0,
      repostCount: post.repostCount ?? 0,
      replyCount: post.replyCount ?? 0,
      indexedAtMs: new Date(post.indexedAt).getTime(),
    }))
    .filter(c => c.uri && c.cid)
  const ranked = rankTopPost(candidates)
  const topPost =
    ranked.length > 0 ? {uri: ranked[0].uri, cid: ranked[0].cid} : null
  const topPostCandidates = ranked.map(c => ({uri: c.uri, cid: c.cid}))

  // --- Follower delta via one getProfile + ring buffer ---
  let followerDelta = 0
  try {
    const res = await agent.app.bsky.actor.getProfile({actor: did})
    const count = res.data.followersCount ?? 0
    const today = formatLocalDay(new Date(now), zone)
    // Don't write storage here — that's the tracker's job. We just read the
    // existing ring buffer to compute the delta with the freshly-fetched
    // current count as an optimistic "end" value.
    const snaps = readFollowerSnapshots(did)
    const startDay = formatLocalDay(window.start, zone)
    const endDay = formatLocalDay(window.end, zone)
    // Synthesize a snapshot for `today` if the real ring buffer doesn't
    // already have a more recent entry (commonly the case once the tracker
    // has run today). We don't mutate storage here.
    const synthesized = [...snaps, {day: today, count}]
    followerDelta = computeFollowerDelta(synthesized, startDay, endDay)
  } catch {
    // Graceful degrade per R2.
    followerDelta = 0
  }

  return {
    weekIso,
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    postsCount,
    followerDelta,
    topPost,
    topPostCandidates,
    fetchedAtUtcMs: now,
  }
}

/**
 * Hook entry point. Caller-owned `enabled` gate combines the flag +
 * showRecap preference + weekIso presence. Per B11, toggle-off means
 * zero XRPC calls.
 */
export function useWeeklyRecapQuery({
  weekIso,
}: {
  weekIso: string | null | undefined
}) {
  const featureOn = useStreaksAndRecapEnabled()
  const [showRecap] = useShowRecapPreference()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const did = currentAccount?.did ?? ''
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return useQuery<WeeklyRecap>({
    queryKey: createWeeklyRecapQueryKey({did, weekIso: weekIso ?? ''}),
    queryFn: async () => {
      // Auto-retry gate — attempt counter burns on every call except the
      // first. TanStack retries come through here and will short-circuit
      // after the budget is exhausted.
      if (!weekIso) throw new Error('[weeklyRecap] missing weekIso')
      const ok = tryAutoRetry(weekIso)
      if (!ok) throw new Error('[weeklyRecap] auto-retry budget exhausted')
      const result = await computeWeeklyRecap({agent, did, weekIso, zone})
      resetAutoRetry(weekIso)
      return result
    },
    enabled: !!(featureOn && showRecap && did && weekIso),
    staleTime: STALE.HOURS.ONE,
    gcTime: GCTIME.INFINITY,
    // TanStack-native retry disabled — our own budget module owns this.
    retry: false,
  })
}
