import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {type AtUriString, type DidString} from '@atproto/syntax'
import throttle from 'lodash.throttle'

import {PROD_FEEDS, STAGING_FEEDS, TRENDING_DID} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  type FeedFeedbackInteraction,
  isFinalVideoWatchSegment,
  isVideoWatchInteraction,
  VIDEO_WATCH_EVENT,
  type VideoWatchInteraction,
} from '#/lib/media/video/feedFeedback'
import {type FeedSourceInfo, isFeedSourceFeedInfo} from '#/state/queries/feed'
import {
  type FeedDescriptor,
  type FeedPostSliceItem,
} from '#/state/queries/post-feed'
import {useAppviewClient, useIsCurrentAppviewClient} from '#/state/session'
import {getItemsForFeedback} from '#/view/com/posts/PostFeed'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export const FEEDBACK_FEEDS = [...PROD_FEEDS, ...STAGING_FEEDS]

export const THIRD_PARTY_ALLOWED_INTERACTIONS = new Set<
  app.bsky.feed.defs.Interaction['event']
>([
  // These are explicit actions and are therefore fine to send.
  'app.bsky.feed.defs#requestLess',
  'app.bsky.feed.defs#requestMore',
  // These can be inferred from the firehose and are therefore fine to send.
  'app.bsky.feed.defs#interactionLike',
  'app.bsky.feed.defs#interactionQuote',
  'app.bsky.feed.defs#interactionReply',
  'app.bsky.feed.defs#interactionRepost',
  'app.bsky.feed.defs#interactionFollow',
  // This can be inferred from pagination requests for everything except the very last page
  // so it is fine to send. It is crucial for third party algorithmic feeds to receive these.
  'app.bsky.feed.defs#interactionSeen',
])

/**
 * The `payload` of an `interactionUnspecced` event. This is an implicit
 * contract with Bluesky's own feeds, like our metrics: the lexicon leaves the
 * shape open so we can add signals without a lexicon change. Third-party feeds
 * never receive these events (see `isInteractionAllowed`).
 *
 * The item is the post the action was taken on. Actions with an undo send the
 * undo as its own type, so the feed can reverse the signal.
 */
export type UnspeccedInteractionPayload =
  | {type: 'save'}
  | {type: 'unsave'}
  | {type: 'hide'}
  | {type: 'blockAuthor'}
  | {type: 'muteAuthor'}
  | {type: 'unmuteAuthor'}
  /** `reason` is the report option the user picked. */
  | {type: 'report'; reason?: string}

/**
 * An `interactionUnspecced` event about `item`, the post the action was taken
 * on.
 */
export function unspeccedInteraction({
  item,
  feedContext,
  reqId,
  payload,
}: {
  item: app.bsky.feed.defs.Interaction['item']
  feedContext: string | undefined
  reqId: string | undefined
  payload: UnspeccedInteractionPayload
}): app.bsky.feed.defs.Interaction {
  return {
    item,
    event: 'app.bsky.feed.defs#interactionUnspecced',
    feedContext,
    reqId,
    payload,
  }
}

/**
 * Where an interaction happened, sent to the feed as `viewContext`. `thread` is
 * the thread screen opened by tapping a post in a feed.
 */
export type FeedFeedbackViewContext = 'feed' | 'thread'

export type StateContext = {
  enabled: boolean
  onItemSeen: (item: any) => void
  sendInteraction: (interaction: app.bsky.feed.defs.Interaction) => void
  /**
   * Private, provisional video watch feedback. Only provided by
   * `useFeedFeedback`, and gated there behind `FeedVideoWatchEnable` and
   * official Discover/Trending feeds.
   */
  sendVideoWatch?: (interaction: VideoWatchInteraction) => void
  feedDescriptor: FeedDescriptor | undefined
  feedSourceInfo: FeedSourceInfo | undefined
}

const stateContext = createContext<StateContext>({
  enabled: false,
  onItemSeen: (_item: any) => {},
  sendInteraction: (_interaction: app.bsky.feed.defs.Interaction) => {},
  feedDescriptor: undefined,
  feedSourceInfo: undefined,
})
stateContext.displayName = 'FeedFeedbackContext'

export function useFeedFeedback(
  feedSourceInfo: FeedSourceInfo | undefined,
  hasSession: boolean,
  viewContext: FeedFeedbackViewContext,
) {
  const feed =
    !!feedSourceInfo && isFeedSourceFeedInfo(feedSourceInfo)
      ? feedSourceInfo
      : undefined

  const isDiscover = isDiscoverFeed(feed?.feedDescriptor)
  const acceptsInteractions = Boolean(isDiscover || feed?.acceptsInteractions)
  const {enabled, sendInteraction, sendVideoWatch} = useFeedFeedbackCore({
    feedUri: feed?.uri,
    feedDid: feed?.view?.did,
    enabled: acceptsInteractions && hasSession,
    viewContext,
  })
  /** Slice item identity maps to feed (re)fetches, not individual renders. */
  const history = useRef<WeakSet<FeedPostSliceItem>>(new WeakSet())

  const onItemSeen = useCallback(
    (feedItem: any) => {
      if (!enabled) {
        return
      }
      const items = getItemsForFeedback(feedItem)
      for (const {item: postItem, feedContext, reqId} of items) {
        if (!history.current.has(postItem)) {
          history.current.add(postItem)
          sendInteraction({
            item: postItem.uri,
            event: 'app.bsky.feed.defs#interactionSeen',
            feedContext,
            reqId,
          })
        }
      }
    },
    [enabled, sendInteraction],
  )

  return useMemo(() => {
    return {
      enabled,
      // pass this method to the <List> onItemSeen
      onItemSeen,
      // call on various events
      // queues the event to be sent with the throttled sendToFeed call
      sendInteraction,
      sendVideoWatch,
      feedDescriptor: feed?.feedDescriptor,
      feedSourceInfo: typeof feed === 'object' ? feed : undefined,
    }
  }, [enabled, onItemSeen, sendInteraction, sendVideoWatch, feed])
}

/** Sends feedback without requiring feed metadata or post-feed rows. */
export function useFeedFeedbackCore({
  feedUri,
  feedDid: proxyDid,
  enabled: isEnabled,
  viewContext,
}: {
  feedUri: string | undefined
  /** The generator's service DID, not the account that owns the feed record. */
  feedDid: string | undefined
  enabled: boolean
  viewContext: FeedFeedbackViewContext
}) {
  const ax = useAnalytics()
  const logger = ax.logger.useChild(ax.logger.Context.FeedFeedback)
  const client = useAppviewClient()

  const enabled = Boolean(isEnabled && feedUri && proxyDid)
  const feedDescriptor: FeedDescriptor | undefined = feedUri
    ? `feedgen|${feedUri}`
    : undefined

  const history = useRef<WeakSet<app.bsky.feed.defs.Interaction>>(new WeakSet())

  // Each queue passes in its own stats and feed label.
  const flushStats = useNonReactiveCallback(
    (stats: AggregatedStats, feedDescriptor: string) => {
      if (stats.clickthroughCount > 0) {
        ax.metric('feed:clickthrough', {
          count: stats.clickthroughCount,
          feed: feedDescriptor,
        })
        stats.clickthroughCount = 0
      }

      if (stats.engagedCount > 0) {
        ax.metric('feed:engaged', {
          count: stats.engagedCount,
          feed: feedDescriptor,
        })
        stats.engagedCount = 0
      }

      if (stats.seenCount > 0) {
        ax.metric('feed:seen', {
          count: stats.seenCount,
          feed: feedDescriptor,
        })
        stats.seenCount = 0
      }
    },
  )
  const logFlushed = useNonReactiveCallback(() => logger.debug('flushed'))

  /*
   * Watch feedback is private, so it also requires the queue's client to still
   * be the CURRENT signed-in session. This is a live check, so an old queue
   * (or an unmounting child's late segment) may still flush route-only changes
   * for the same client, but nothing after logout or an account switch, even
   * when the provider is removed without re-rendering.
   */
  const isCurrentAppviewClient = useIsCurrentAppviewClient()
  const isVideoWatchEnabled = useNonReactiveCallback(() =>
    ax.features.enabled(ax.features.FeedVideoWatchEnable),
  )

  /*
   * One queue per transport binding (client, feed, proxy, view context). When
   * any of these change, the old queue is flushed through its own transport
   * rather than leaking into the new feed, and anything that arrives late (e.g.
   * a child's unmount cleanup running after ours) is sent immediately through
   * it too. Its stats are likewise reported under its own feed.
   */
  const queue = useMemo(() => {
    if (!enabled || !feedDescriptor || !proxyDid) {
      return null
    }
    const stats = createAggregatedStats()
    const throttledFlushStats = throttle(
      () => flushStats(stats, feedDescriptor),
      45e3,
      {
        leading: true, // The outer call is already throttled somewhat.
        trailing: true,
      },
    )
    return createFeedbackQueue({
      isAllowed: interaction =>
        isInteractionAllowed(
          feedDescriptor,
          interaction,
          () => isCurrentAppviewClient(client) && isVideoWatchEnabled(),
        ),
      send: interactions => {
        /*
         * Send to the feed. Interactions go to the feed generator rather than
         * the appview, which the agent did by setting `atproto-proxy` by hand;
         * the client's per-call `service` option writes that same header.
         */
        client
          .call(
            app.bsky.feed.sendInteractions,
            {
              interactions: interactions.map(interaction => ({
                ...interaction,
                viewContext,
              })),
              feed: feedUri as AtUriString | undefined,
            },
            {service: `${proxyDid as DidString}#bsky_fg`},
          )
          .catch(() => {}) // ignore upstream errors
        sendOrAggregateInteractionsForStats(stats, interactions)
        throttledFlushStats()
        logFlushed()
      },
    })
  }, [
    enabled,
    client,
    feedUri,
    feedDescriptor,
    proxyDid,
    viewContext,
    isCurrentAppviewClient,
    isVideoWatchEnabled,
    flushStats,
    logFlushed,
  ])

  useEffect(() => {
    if (!queue) {
      return
    }
    queue.attach()
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        queue.flush()
      }
    })
    return () => {
      sub.remove()
      queue.detach()
    }
  }, [queue])

  const sendInteraction = useCallback(
    (interaction: app.bsky.feed.defs.Interaction) => {
      if (!queue) {
        return
      }
      if (!history.current.has(interaction)) {
        history.current.add(interaction)
        queue.enqueue(interaction)
      }
    },
    [queue],
  )

  const sendVideoWatch = useCallback(
    (interaction: VideoWatchInteraction) => {
      if (!queue?.isAllowed(interaction)) {
        return
      }
      queue.enqueue(interaction, {
        immediate: isFinalVideoWatchSegment(interaction),
      })
    },
    [queue],
  )

  return {enabled, sendInteraction, sendVideoWatch}
}

export const FeedFeedbackProvider = stateContext.Provider

export function useFeedFeedbackContext() {
  return useContext(stateContext)
}

/**
 * A post as it was shown in a feed. Feed items provide this, so that the
 * controls inside them can send feed feedback about the post without it being
 * passed down as props.
 */
export type FeedItem = {
  uri: app.bsky.feed.defs.Interaction['item']
  authorDid: string
  feedContext: string | undefined
  reqId: string | undefined
  /**
   * The repost the post was shown through, if any. Likes and reposts record it
   * as `via`.
   */
  via: {uri: string; cid: string} | undefined
}

/**
 * The `via` for a feed item shown because of `reason`: the repost, if it was
 * shown as one.
 */
export function repostVia(reason: unknown): FeedItem['via'] {
  if (
    bsky.isType(app.bsky.feed.defs.reasonRepost, reason) &&
    reason.uri &&
    reason.cid
  ) {
    return {uri: reason.uri, cid: reason.cid}
  }
}

const feedItemContext = createContext<FeedItem | undefined>(undefined)
feedItemContext.displayName = 'FeedItemContext'

export const FeedItemProvider = feedItemContext.Provider

/**
 * The feed item this component is inside of, with helpers that send feed
 * feedback about it. Outside a feed item, `item` is undefined and the helpers
 * do nothing.
 */
export function useFeedItemFeedback() {
  const {sendInteraction, feedDescriptor} = useFeedFeedbackContext()
  const item = useContext(feedItemContext)

  const send = (event: app.bsky.feed.defs.Interaction['event']) => {
    if (!item) return
    sendInteraction({
      item: item.uri,
      event,
      feedContext: item.feedContext,
      reqId: item.reqId,
    })
  }

  const sendUnspecced = (payload: UnspeccedInteractionPayload) => {
    if (!item) return
    sendInteraction(
      unspeccedInteraction({
        item: item.uri,
        feedContext: item.feedContext,
        reqId: item.reqId,
        payload,
      }),
    )
  }

  return {item, feedDescriptor, send, sendUnspecced}
}

// TODO
// We will introduce a permissions framework for 3p feeds to
// take advantage of the feed feedback API. Until that's in
// place, we're hardcoding it to the discover and trending feeds.
// -prf
export function isDiscoverFeed(feed?: FeedDescriptor) {
  return !!feed && FEEDBACK_FEEDS.includes(feed)
}

export function isTrendingFeed(feed?: FeedDescriptor) {
  return !!feed && feed.startsWith(`feedgen|at://${TRENDING_DID}/`)
}

function isInteractionAllowed(
  feed: FeedDescriptor,
  interaction: FeedFeedbackInteraction,
  isVideoWatchAllowed: () => boolean,
) {
  const isOfficialFeed = isDiscoverFeed(feed) || isTrendingFeed(feed)
  if (interaction.event === VIDEO_WATCH_EVENT) {
    // Private and provisional: never sent to third-party feeds.
    return (
      isOfficialFeed &&
      isVideoWatchInteraction(interaction) &&
      isVideoWatchAllowed()
    )
  }
  if (!interaction.event) {
    return false
  }
  return (
    isOfficialFeed || THIRD_PARTY_ALLOWED_INTERACTIONS.has(interaction.event)
  )
}

/**
 * Dedup key within a batch. Video watch segments also include their session
 * and index so repeated copies of one segment collapse but distinct segments
 * survive.
 */
function toKey(interaction: FeedFeedbackInteraction): string {
  const key: unknown[] = [
    interaction.item,
    interaction.event,
    interaction.feedContext ?? '',
    interaction.reqId ?? '',
    interaction.payload ?? null,
  ]
  if (isVideoWatchInteraction(interaction)) {
    key.push(
      interaction.videoWatch.playbackSessionId,
      interaction.videoWatch.segmentIndex,
    )
  }
  return JSON.stringify(key)
}

function createFeedbackQueue({
  isAllowed,
  send,
}: {
  isAllowed: (interaction: FeedFeedbackInteraction) => boolean
  send: (interactions: FeedFeedbackInteraction[]) => void
}) {
  /*
   * Keyed by `toKey` so the same interaction is only sent once per batch.
   * Re-adding a key moves it to the end, so a toggle like save, unsave, save
   * arrives as unsave then save, and the last event is the current state.
   */
  const pending = new Map<string, FeedFeedbackInteraction>()
  let attached = true

  const sendNow = () => {
    const interactions = Array.from(pending.values()).filter(isAllowed)
    pending.clear()
    if (interactions.length > 0) {
      send(interactions)
    }
  }
  const sendThrottled = throttle(sendNow, 10e3, {
    leading: false,
    trailing: true,
  })
  const flush = () => {
    sendThrottled.cancel()
    sendNow()
  }

  return {
    isAllowed,
    enqueue(
      interaction: FeedFeedbackInteraction,
      {immediate = false}: {immediate?: boolean} = {},
    ) {
      const key = toKey(interaction)
      pending.delete(key)
      pending.set(key, interaction)
      if (immediate || !attached) {
        flush()
      } else {
        sendThrottled()
      }
    },
    flush,
    attach() {
      attached = true
    },
    detach() {
      attached = false
      flush()
    },
  }
}

type AggregatedStats = {
  clickthroughCount: number
  engagedCount: number
  seenCount: number
}

function createAggregatedStats(): AggregatedStats {
  return {
    clickthroughCount: 0,
    engagedCount: 0,
    seenCount: 0,
  }
}

function sendOrAggregateInteractionsForStats(
  stats: AggregatedStats,
  interactions: FeedFeedbackInteraction[],
) {
  for (let interaction of interactions) {
    switch (interaction.event) {
      // The events are aggregated and sent later in batches.
      case 'app.bsky.feed.defs#clickthroughAuthor':
      case 'app.bsky.feed.defs#clickthroughEmbed':
      case 'app.bsky.feed.defs#clickthroughItem':
      case 'app.bsky.feed.defs#clickthroughReposter': {
        stats.clickthroughCount++
        break
      }
      case 'app.bsky.feed.defs#interactionLike':
      case 'app.bsky.feed.defs#interactionQuote':
      case 'app.bsky.feed.defs#interactionReply':
      case 'app.bsky.feed.defs#interactionRepost':
      case 'app.bsky.feed.defs#interactionShare': {
        stats.engagedCount++
        break
      }
      case 'app.bsky.feed.defs#interactionSeen': {
        stats.seenCount++
        break
      }
    }
  }
}
