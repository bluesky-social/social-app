import {AtUri} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {isDidBlocked} from './my-blocked-accounts'
import {isDidMuted} from './my-muted-accounts'

const SLINGSHOT_URL = 'https://slingshot.microcosm.blue'
const CONSTELLATION_URL = 'https://constellation.microcosm.blue'

export interface MicrocosmRecord {
  uri: string
  cid: string
  value: any
}

export interface ConstellationCounts {
  likeCount: number
  repostCount: number
  replyCount: number
  // might need a saves/bookmark counter
  // bookmarkCount: number
}

/**
 * Generic helper to fetch from Slingshot proxy
 */
async function fetchFromSlingshot<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T | null> {
  try {
    // URLSearchParams handles encoding automatically, no need for manual encodeURIComponent
    const queryString = new URLSearchParams(params).toString()

    const res = await fetch(`${SLINGSHOT_URL}/xrpc/${endpoint}?${queryString}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error(`Slingshot fetch failed (${endpoint}):`, e)
    return null
  }
}

/**
 * Fetch a record directly from PDS via Slingshot proxy
 *
 * Uses the ergonomic `com.bad-example.repo.getUriRecord` endpoint which accepts
 * a full at-uri instead of separate repo/collection/rkey parameters.
 *
 * @see https://slingshot.microcosm.blue/ for full API documentation
 */
export async function fetchRecordViaSlingshot(
  atUri: string,
): Promise<MicrocosmRecord | null> {
  return fetchFromSlingshot<MicrocosmRecord>(
    'com.bad-example.repo.getUriRecord',
    {at_uri: atUri},
  )
}

/**
 * Resolve identity (DID/handle) via Slingshot
 *
 * Uses `com.bad-example.identity.resolveMiniDoc` which returns a compact identity
 * document with bi-directionally verified DID/handle and the user's PDS URL.
 * This is more convenient than the standard resolveHandle + describeRepo flow.
 *
 * @returns {did, handle, pds} or null if resolution fails
 * @see https://slingshot.microcosm.blue/ for full API documentation
 */
export async function resolveIdentityViaSlingshot(
  identifier: string,
): Promise<{did: string; handle: string; pds: string} | null> {
  return fetchFromSlingshot('com.bad-example.identity.resolveMiniDoc', {
    identifier,
  })
}

/**
 * Fetch engagement counts from Constellation backlink indexer
 *
 * Constellation indexes all social interactions (likes, reposts, replies) as backlinks
 * to posts. This provides real engagement counts even for AppView-suspended users.
 *
 * Note: Constellation only provides per-post engagement counts, not profile-level
 * aggregates (total followers, following, posts).
 *
 * @see https://constellation.microcosm.blue/ for more about Constellation
 */
export async function fetchConstellationCounts(
  atUri: string,
): Promise<ConstellationCounts> {
  try {
    const res = await fetch(
      `${CONSTELLATION_URL}/links/all?target=${encodeURIComponent(atUri)}`,
    )
    if (!res.ok) throw new Error('Constellation fetch failed')

    const data = await res.json()
    const links = data.links || {}

    return {
      likeCount:
        links?.['app.bsky.feed.like']?.['.subject.uri']?.distinct_dids ?? 0,
      repostCount:
        links?.['app.bsky.feed.repost']?.['.subject.uri']?.distinct_dids ?? 0,
      replyCount:
        links?.['app.bsky.feed.post']?.['.reply.parent.uri']?.records ?? 0,
    }
  } catch (e) {
    console.error('Constellation fetch failed:', e)
    return {likeCount: 0, repostCount: 0, replyCount: 0}
  }
}

/**
 * Detect if error is AppView-related (suspended user, not found, etc.)
 *
 * IMPORTANT: This determines whether fallback should be triggered.
 * We should NOT trigger fallback for intentional blocking/privacy errors.
 *
 * SECURITY: We distinguish between:
 * - AppView failures (suspended users, server errors) → trigger fallback
 * - Access denials (privacy settings, blocking) → respect AppView decision
 */
export function isAppViewError(error: any): boolean {
  if (!error) return false

  const msg = error.message?.toLowerCase() || ''

  // Do NOT trigger fallback for intentional blocking/privacy enforcement
  // These are NOT AppView outages - they are access control decisions
  if (msg.includes('blocked actor')) return false
  if (msg.includes('requester has blocked')) return false
  if (msg.includes('blocking')) return false
  if (msg.includes('not available')) return false // Privacy: logged-out visibility
  if (msg.includes('logged out')) return false // Privacy: requires authentication
  if (msg.includes('requires auth')) return false // Privacy: authentication required
  if (msg.includes('unauthorized')) return false // Privacy: access denied

  // Trigger fallback for actual AppView failures (suspended users, etc.)
  // Note: We removed blanket 400/404 handling to avoid bypassing access controls
  if (msg.includes('suspended')) return true
  if (msg.includes('could not locate record')) return true
  if (msg.includes('profile not found')) return true

  return false
}

/**
 * Build viewer state for fallback profiles
 * Checks local block/mute cache to populate viewer relationship fields
 */
function buildViewerState(
  queryClient: QueryClient,
  did: string,
): {
  blocking?: string
  blockedBy?: boolean
  muted?: boolean
  mutedByList?: boolean
  following?: string
  followedBy?: string
} {
  const blockStatus = isDidBlocked(queryClient, did)
  const muteStatus = isDidMuted(queryClient, did)

  const viewer: any = {}

  if (blockStatus.blocked) {
    viewer.blocking = blockStatus.blockUri
  }

  if (muteStatus.muted) {
    viewer.muted = true
  }

  // We can't determine blockedBy, mutedByList, following, or followedBy from PDS alone
  // These require AppView indexing, so we leave them undefined

  return viewer
}

/**
 * Build a BlockedPost stub to match AppView behavior
 * Returns the same structure as app.bsky.feed.defs#blockedPost
 */
function buildBlockedPost(uri: string): any {
  return {
    $type: 'app.bsky.feed.defs#blockedPost',
    uri,
    blocked: true,
    author: {
      did: new AtUri(uri).host,
      handle: '',
    },
  }
}

/**
 * Build a BlockedProfile stub to match AppView behavior
 * Returns a minimal profile view indicating the profile is blocked
 */
function buildBlockedProfileView(did: string): any {
  return {
    $type: 'app.bsky.actor.defs#profileViewBasic',
    did,
    handle: '',
    displayName: '',
    avatar: undefined,
    viewer: {
      blocking: 'blocked',
      blockedBy: false,
      muted: false,
      mutedByList: false,
    },
    labels: [],
    __fallbackMode: true,
    __blocked: true, // Internal marker
  }
}

/**
 * Build synthetic ProfileViewDetailed from PDS data
 *
 * Fetches the user's profile record from their PDS via Slingshot and constructs
 * an AppView-compatible ProfileViewDetailed object.
 *
 * LIMITATION: Profile-level aggregate counts (followers, following, posts) are not
 * available from Slingshot or Constellation and are set to undefined. These would
 * require AppView-style indexing infrastructure.
 *
 * SECURITY: Checks local block/mute state to maintain privacy preferences.
 * Throws error if user has blocked the profile to prevent privacy bypass.
 */
export async function buildSyntheticProfileView(
  queryClient: QueryClient,
  did: string,
  handle: string,
): Promise<any> {
  // Check viewer state before fetching profile data
  const viewer = buildViewerState(queryClient, did)

  // If user has blocked this profile, return BlockedProfile stub
  // This matches AppView behavior and allows existing UI to handle it correctly
  if (viewer.blocking) {
    console.log('[Fallback] Returning blocked profile stub for', did)
    return buildBlockedProfileView(did)
  }

  const profileUri = `at://${did}/app.bsky.actor.profile/self`
  const record = await fetchRecordViaSlingshot(profileUri)

  return {
    $type: 'app.bsky.actor.defs#profileViewDetailed',
    did,
    handle,
    displayName: record?.value?.displayName || handle,
    description: record?.value?.description || '',
    avatar: record?.value?.avatar
      ? `https://cdn.bsky.app/img/avatar/plain/${did}/${record.value.avatar.ref.$link}@jpeg`
      : undefined,
    banner: record?.value?.banner
      ? `https://cdn.bsky.app/img/banner/plain/${did}/${record.value.banner.ref.$link}@jpeg`
      : undefined,
    followersCount: undefined, // Not available from PDS or Constellation
    followsCount: undefined, // Not available from PDS or Constellation
    postsCount: undefined, // Not available from PDS or Constellation
    indexedAt: new Date().toISOString(),
    viewer, // Use viewer state with block/mute info
    labels: [],
    __fallbackMode: true, // Mark as fallback data
  }
}

/**
 * Build synthetic PostView from PDS + Constellation data
 *
 * SECURITY: Inherits block/mute checking from buildSyntheticProfileView.
 * If the author is blocked, returns BlockedPost stub to match AppView behavior.
 */
export async function buildSyntheticPostView(
  queryClient: QueryClient,
  atUri: string,
  authorDid: string,
  authorHandle: string,
): Promise<any> {
  // Check if author is blocked first, before fetching any data
  const viewer = buildViewerState(queryClient, authorDid)
  if (viewer.blocking) {
    console.log('[Fallback] Returning blocked post stub for', atUri)
    return buildBlockedPost(atUri)
  }

  const record = await fetchRecordViaSlingshot(atUri)
  if (!record) return null

  const counts = await fetchConstellationCounts(atUri)
  // Build profile view (will return basic info since not blocked)
  const profileView = await buildSyntheticProfileView(
    queryClient,
    authorDid,
    authorHandle,
  )

  // Get viewer state for the post itself (like, repost status)
  // For now we just use empty viewer as we can't determine these from PDS
  const postViewer = {}

  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: atUri,
    cid: record.cid,
    author: profileView,
    record: record.value,
    indexedAt: new Date().toISOString(),
    likeCount: counts.likeCount,
    repostCount: counts.repostCount,
    replyCount: counts.replyCount,
    viewer: postViewer, // Post-level viewer state (likes, reposts, etc)
    labels: [],
    __fallbackMode: true, // Mark as fallback data
  }
}

/**
 * Build synthetic feed page from PDS data
 * This is used for infinite queries that need paginated results
 *
 * IMPORTANT: This function bypasses Slingshot and fetches directly from the user's PDS
 * because Slingshot does not support the `com.atproto.repo.listRecords` endpoint needed
 * for bulk record fetching.
 *
 * Trade-off: No caching benefit from Slingshot, but we can still provide author feed
 * functionality for AppView-suspended users.
 *
 * Each post in the feed will trigger:
 * - 1 record fetch via Slingshot (for the full post data, cached)
 * - 1 Constellation request (for engagement counts)
 * - Profile fetch (cached after first request)
 *
 * SECURITY: Respects block/mute relationships. If author is blocked, the feed will be empty.
 */
export async function buildSyntheticFeedPage(
  queryClient: QueryClient,
  did: string,
  pdsUrl: string,
  cursor?: string,
): Promise<any> {
  // Check if this author is blocked before fetching any posts
  const viewer = buildViewerState(queryClient, did)
  if (viewer.blocking) {
    console.log('[Fallback] Author is blocked, returning empty feed for', did)
    // Return empty feed to prevent viewing blocked user's posts via fallback
    return {
      feed: [],
      cursor: undefined,
      __fallbackMode: true,
      __blocked: true,
    }
  }

  try {
    const limit = 25
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''

    // Fetch posts directly from PDS using com.atproto.repo.listRecords
    // NOTE: This bypasses Slingshot because listRecords is not available there
    const url = `${pdsUrl}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post&limit=${limit}${cursorParam}`
    const res = await fetch(url)

    if (!res.ok) {
      console.error(
        '[Fallback] Failed to fetch author feed from PDS:',
        res.statusText,
      )
      return null
    }

    const data = await res.json()

    // Build FeedViewPost array from records
    const feed = await Promise.all(
      data.records.map(async (record: any) => {
        const postView = await buildSyntheticPostView(
          queryClient,
          record.uri,
          did,
          '', // Handle will be resolved in buildSyntheticPostView
        )

        if (!postView) return null

        // Wrap in FeedViewPost format
        return {
          $type: 'app.bsky.feed.defs#feedViewPost',
          post: postView,
          feedContext: undefined,
        }
      }),
    )

    // Filter out null results
    const validFeed = feed.filter(item => item !== null)

    return {
      feed: validFeed,
      cursor: data.cursor,
      __fallbackMode: true, // Mark as fallback data
    }
  } catch (e) {
    console.error('[Fallback] Failed to build synthetic feed page:', e)
    return null
  }
}
