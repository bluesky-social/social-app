/* eslint-disable @typescript-eslint/no-explicit-any */
import {AtUri} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {PUBLIC_APPVIEW} from '#/lib/constants'
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
  quoteCount: number
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
      quoteCount:
        links?.['app.bsky.feed.post']?.['.embed.record.uri']?.distinct_dids ??
        0,
    }
  } catch (e) {
    console.error('Constellation fetch failed:', e)
    return {likeCount: 0, repostCount: 0, replyCount: 0, quoteCount: 0}
  }
}

/**
 * Detect if error is AppView-related (suspended user, not found, etc.)
 *
 * IMPORTANT: This determines whether fallback should be triggered.
 * We should NOT trigger fallback for intentional blocking/privacy errors.
 */
export function isAppViewError(error: any): boolean {
  if (!error) return false

  const msg = error.message?.toLowerCase() || ''

  // Do NOT trigger fallback for intentional blocking
  // "Requester has blocked actor" means the user intentionally blocked someone
  // This is NOT an AppView outage - it's privacy enforcement
  if (msg.includes('blocked actor')) return false
  if (msg.includes('requester has blocked')) return false
  if (msg.includes('blocking')) return false

  // Check HTTP status codes
  if (error.status === 400 || error.status === 404) return true

  // Check error messages for actual AppView issues
  if (msg.includes('not found')) return true
  if (msg.includes('suspended')) return true
  if (msg.includes('could not locate')) return true

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

  const embeds = resolveRecordEmbeds(authorDid, record.value)

  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: atUri,
    cid: record.cid,
    author: profileView,
    record: record.value,
    embed: embeds.length > 0 ? embeds[0] : undefined,
    indexedAt: record.value?.createdAt || new Date().toISOString(),
    likeCount: counts.likeCount,
    repostCount: counts.repostCount,
    replyCount: counts.replyCount,
    quoteCount: counts.quoteCount,
    viewer: postViewer, // Post-level viewer state (likes, reposts, etc)
    labels: [],
    __fallbackMode: true, // Mark as fallback data
  }
}

// Blacksky moderation account DID - labels from this account are authoritative
const BLACKSKY_MOD_DID = 'did:plc:d2mkddsbmnrgr3domzg5qexf'

// Label values that indicate content should not be shown
const MODERATION_LABEL_VALUES = ['!takedown', '!suspend', '!hide']

/**
 * Check if an author is under active moderation action by our AppView.
 *
 * Queries the AppView's public getProfile endpoint. If the AppView returns
 * AccountTakedown, suspended, or deactivated, the author is under moderation
 * and fallback MUST NOT bypass it.
 *
 * Returns true if the author is moderated (do NOT fallback).
 * Returns false if the author is simply not synced yet (safe to fallback).
 */
export async function isAuthorModerated(did: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${PUBLIC_APPVIEW}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
    )

    if (res.ok) {
      // AppView has this author and returned a profile. Check for
      // takedown/suspend labels on the profile itself.
      const profile = await res.json()
      const labels: Array<{val: string}> = profile.labels || []
      return labels.some(l => MODERATION_LABEL_VALUES.includes(l.val))
    }

    // Check error response for moderation signals
    const errorBody = await res.json().catch(() => null)
    const errorName = errorBody?.error || ''
    const errorMsg = (errorBody?.message || '').toLowerCase()

    // AppView explicitly says account is taken down or suspended
    if (
      errorName === 'AccountTakedown' ||
      errorMsg.includes('suspended') ||
      errorMsg.includes('taken down') ||
      errorMsg.includes('deactivated')
    ) {
      return true
    }

    // 404 / generic not found = author not synced, safe to fallback
    return false
  } catch {
    // Network error querying AppView -- err on the side of caution
    // and allow fallback (the AppView being down is exactly when
    // fallback is most needed)
    return false
  }
}

/**
 * Check if a specific post has moderation labels applied by Blacksky.
 *
 * Uses com.atproto.label.queryLabels to check if the Blacksky moderation
 * account has applied takedown/suspend labels to this specific post URI.
 * This catches per-post takedowns that wouldn't be caught by the author check.
 */
export async function isPostModerated(atUri: string): Promise<boolean> {
  try {
    const params = new URLSearchParams()
    params.append('uriPatterns', atUri)
    params.append('sources', BLACKSKY_MOD_DID)
    const res = await fetch(
      `${PUBLIC_APPVIEW}/xrpc/com.atproto.label.queryLabels?${params}`,
    )
    if (!res.ok) return false

    const data = await res.json()
    const labels: Array<{val: string; neg?: boolean}> = data.labels || []

    // Check for active (non-negated) moderation labels
    return labels.some(l => !l.neg && MODERATION_LABEL_VALUES.includes(l.val))
  } catch {
    // If label query fails, don't block fallback -- the author-level
    // check is the primary guard
    return false
  }
}

/**
 * Resolve raw embed declaration from a post record into a resolved embed view.
 *
 * Converts blob references into CDN URLs so the UI can render link cards,
 * images, and video thumbnails for fallback posts.
 *
 * CDN pattern: https://cdn.bsky.app/img/{preset}/plain/{did}/{cid}@jpeg
 *
 * Does NOT recursively resolve nested app.bsky.embed.record (quoted posts)
 * to avoid infinite recursion and extra round-trips.
 */
function resolveRecordEmbeds(authorDid: string, recordValue: any): any[] {
  if (!recordValue?.embed) return []

  const embed = recordValue.embed
  const resolved = resolveSingleEmbed(authorDid, embed)
  return resolved ? [resolved] : []
}

function resolveSingleEmbed(authorDid: string, embed: any): any | null {
  if (!embed?.$type) return null

  switch (embed.$type) {
    case 'app.bsky.embed.external': {
      const ext = embed.external
      if (!ext) return null

      let thumbUrl: string | undefined
      if (ext.thumb?.ref?.$link) {
        thumbUrl = `https://cdn.bsky.app/img/feed_thumbnail/plain/${authorDid}/${ext.thumb.ref.$link}@jpeg`
      }

      return {
        $type: 'app.bsky.embed.external#view',
        external: {
          uri: ext.uri,
          title: ext.title || '',
          description: ext.description || '',
          thumb: thumbUrl,
        },
      }
    }

    case 'app.bsky.embed.images': {
      const images = embed.images
      if (!Array.isArray(images)) return null

      return {
        $type: 'app.bsky.embed.images#view',
        images: images.map((img: any) => {
          const cid = img.image?.ref?.$link
          return {
            thumb: cid
              ? `https://cdn.bsky.app/img/feed_thumbnail/plain/${authorDid}/${cid}@jpeg`
              : '',
            fullsize: cid
              ? `https://cdn.bsky.app/img/feed_fullsize/plain/${authorDid}/${cid}@jpeg`
              : '',
            alt: img.alt || '',
            aspectRatio: img.aspectRatio,
          }
        }),
      }
    }

    case 'app.bsky.embed.video': {
      const cid = embed.video?.ref?.$link
      if (!cid) return null

      return {
        $type: 'app.bsky.embed.video#view',
        cid,
        playlist: `https://video.bsky.app/watch/${authorDid}/${cid}/playlist.m3u8`,
        thumbnail: `https://video.bsky.app/watch/${authorDid}/${cid}/thumbnail.jpg`,
        alt: embed.alt || '',
        aspectRatio: embed.aspectRatio,
      }
    }

    case 'app.bsky.embed.recordWithMedia': {
      // Resolve the media portion only; skip the nested record
      const mediaView = resolveSingleEmbed(authorDid, embed.media)
      if (!mediaView) return null

      return {
        $type: 'app.bsky.embed.recordWithMedia#view',
        media: mediaView,
        record: {
          $type: 'app.bsky.embed.record#view',
          record: {
            $type: 'app.bsky.embed.record#viewNotFound',
            uri: embed.record?.record?.uri || '',
            notFound: true,
          },
        },
      }
    }

    default:
      return null
  }
}

/**
 * Build synthetic embed ViewRecord from Slingshot + Constellation data
 *
 * Returns an AppBskyEmbedRecord.ViewRecord-shaped object for use in
 * embedded/quoted post fallback rendering when the appview returns ViewNotFound.
 *
 * SECURITY: Checks both author-level and post-level moderation before
 * allowing fallback. Inherits block/mute checking from buildSyntheticProfileView.
 */
export async function buildSyntheticEmbedViewRecord(
  queryClient: QueryClient,
  atUri: string,
): Promise<any | null> {
  const urip = new AtUri(atUri)
  const authorDid = urip.host

  // SECURITY: Check author-level and post-level moderation in parallel.
  // This prevents fallback from bypassing AppView takedowns/suspensions.
  const [authorModerated, postModerated] = await Promise.all([
    isAuthorModerated(authorDid),
    isPostModerated(atUri),
  ])

  if (authorModerated) {
    console.log(
      '[Embed Fallback] Author is moderated, refusing fallback for',
      atUri,
    )
    return null
  }
  if (postModerated) {
    console.log(
      '[Embed Fallback] Post is moderated, refusing fallback for',
      atUri,
    )
    return null
  }

  const identity = await resolveIdentityViaSlingshot(authorDid)
  if (!identity) return null

  const record = await fetchRecordViaSlingshot(atUri)
  if (!record) return null

  const counts = await fetchConstellationCounts(atUri)

  const profileView = await buildSyntheticProfileView(
    queryClient,
    authorDid,
    identity.handle,
  )

  return {
    $type: 'app.bsky.embed.record#viewRecord',
    uri: atUri,
    cid: record.cid,
    author: profileView,
    value: record.value,
    embeds: resolveRecordEmbeds(authorDid, record.value),
    indexedAt: record.value?.createdAt || new Date().toISOString(),
    likeCount: counts.likeCount,
    repostCount: counts.repostCount,
    replyCount: counts.replyCount,
    quoteCount: counts.quoteCount,
    labels: [],
    __fallbackMode: true,
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
