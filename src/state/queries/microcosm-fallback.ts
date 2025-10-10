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
 */
export function isAppViewError(error: any): boolean {
  if (!error) return false

  // Check HTTP status codes
  if (error.status === 400 || error.status === 404) return true

  // Check error messages
  // TODO: see if there is an easy way to source error messages from the appview
  const msg = error.message?.toLowerCase() || ''
  if (msg.includes('not found')) return true
  if (msg.includes('suspended')) return true
  if (msg.includes('could not locate')) return true

  return false
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
 */
export async function buildSyntheticProfileView(
  did: string,
  handle: string,
): Promise<any> {
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
    viewer: {},
    labels: [],
    __fallbackMode: true, // Mark as fallback data
  }
}

/**
 * Build synthetic PostView from PDS + Constellation data
 */
export async function buildSyntheticPostView(
  atUri: string,
  authorDid: string,
  authorHandle: string,
): Promise<any> {
  const record = await fetchRecordViaSlingshot(atUri)
  if (!record) return null

  const counts = await fetchConstellationCounts(atUri)
  const profileView = await buildSyntheticProfileView(authorDid, authorHandle)

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
    viewer: {},
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
 */
export async function buildSyntheticFeedPage(
  did: string,
  pdsUrl: string,
  cursor?: string,
): Promise<any> {
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
