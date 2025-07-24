import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import throttle from 'lodash.throttle'

import {
  ALL_INTERACTIONS,
  DIRECT_INTERACTIONS,
  FEEDBACK_FEEDS,
  STAGING_FEEDS,
} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {Logger} from '#/logger'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {
  type FeedDescriptor,
  type FeedPostSliceItem,
} from '#/state/queries/post-feed'
import {getItemsForFeedback} from '#/view/com/posts/PostFeed'
import {useAgent} from './session'

const logger = Logger.create(Logger.Context.FeedFeedback)

export type StateContext = {
  enabled: boolean
  onItemSeen: (item: any) => void
  sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => void
  feedDescriptor: FeedDescriptor | undefined
  feedSourceInfo: FeedSourceInfo | undefined
}

const stateContext = createContext<StateContext>({
  enabled: false,
  onItemSeen: (_item: any) => {},
  sendInteraction: (_interaction: AppBskyFeedDefs.Interaction) => {},
  feedDescriptor: undefined,
  feedSourceInfo: undefined,
})

// All info needed to send feedback to a feed
type FeedInfo = {
  feedDescriptor: FeedDescriptor
  acceptsInteractions: boolean
  isDiscover: boolean
  proxyDid: string
}

export function useFeedFeedback(
  feed: FeedSourceInfo | FeedDescriptor | undefined,
  hasSession: boolean,
) {
  const agent = useAgent()

  const feedInfo = feed ? buildFeedInfo(feed) : null
  const enabled = !!feedInfo && feedInfo.acceptsInteractions && hasSession

  const enabledInteractions = useMemo(() => {
    if (!enabled) {
      return []
    }
    return feedInfo.isDiscover ? ALL_INTERACTIONS : DIRECT_INTERACTIONS
  }, [enabled, feedInfo])

  const queue = useRef<Set<string>>(new Set())
  const history = useRef<
    // Use a WeakSet so that we don't need to clear it.
    // This assumes that referential identity of slice items maps 1:1 to feed (re)fetches.
    WeakSet<FeedPostSliceItem | AppBskyFeedDefs.Interaction>
  >(new WeakSet())

  const aggregatedStats = useRef<AggregatedStats | null>(null)
  const throttledFlushAggregatedStats = useMemo(
    () =>
      throttle(() => flushToStatsig(aggregatedStats.current), 45e3, {
        leading: true, // The outer call is already throttled somewhat.
        trailing: true,
      }),
    [],
  )

  const sendToFeedNoDelay = useCallback(() => {
    const interactions = Array.from(queue.current).map(toInteraction)
    queue.current.clear()

    const interactionsToSend = interactions.filter(interaction =>
      enabledInteractions.includes(interaction.event ?? ''),
    )

    if (interactionsToSend.length === 0) {
      return
    }

    // Send to the feed
    agent.app.bsky.feed
      .sendInteractions(
        {interactions: interactionsToSend},
        {
          encoding: 'application/json',
          headers: {
            'atproto-proxy': `${feedInfo?.proxyDid}#bsky_fg`,
          },
        },
      )
      .catch((e: any) => {
        logger.warn('Failed to send feed interactions', {error: e})
      })

    // Send to Statsig
    if (aggregatedStats.current === null) {
      aggregatedStats.current = createAggregatedStats()
    }
    sendOrAggregateInteractionsForStats(
      aggregatedStats.current,
      interactionsToSend,
    )
    throttledFlushAggregatedStats()
    logger.debug('flushed')
  }, [agent, throttledFlushAggregatedStats, feedInfo, enabledInteractions])

  const sendToFeed = useMemo(
    () =>
      throttle(sendToFeedNoDelay, 10e3, {
        leading: false,
        trailing: true,
      }),
    [sendToFeedNoDelay],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        sendToFeed.flush()
      }
    })
    return () => sub.remove()
  }, [enabled, sendToFeed])

  const onItemSeen = useCallback(
    (feedItem: any) => {
      if (!enabled) {
        return
      }
      const items = getItemsForFeedback(feedItem)
      for (const {item: postItem, feedContext, reqId} of items) {
        if (!history.current.has(postItem)) {
          history.current.add(postItem)
          queue.current.add(
            toString({
              item: postItem.uri,
              event: 'app.bsky.feed.defs#interactionSeen',
              feedContext,
              reqId,
            }),
          )
          sendToFeed()
        }
      }
    },
    [enabled, sendToFeed],
  )

  const sendInteraction = useCallback(
    (interaction: AppBskyFeedDefs.Interaction) => {
      if (!enabled) {
        return
      }
      logger.debug('sendInteraction', {
        ...interaction,
      })
      if (!history.current.has(interaction)) {
        history.current.add(interaction)
        queue.current.add(toString(interaction))
        sendToFeed()
      }
    },
    [enabled, sendToFeed],
  )

  return useMemo(() => {
    return {
      enabled,
      // pass this method to the <List> onItemSeen
      onItemSeen,
      // call on various events
      // queues the event to be sent with the throttled sendToFeed call
      sendInteraction,
      feedDescriptor: feedInfo?.feedDescriptor,
      feedSourceInfo: typeof feed === 'object' ? feed : undefined,
    }
  }, [enabled, onItemSeen, sendInteraction, feedInfo, feed])
}

export const FeedFeedbackProvider = stateContext.Provider

export function useFeedFeedbackContext() {
  return useContext(stateContext)
}

// TODO
// We will introduce a permissions framework for 3p feeds to
// take advantage of the feed feedback API. Until that's in
// place, we're hardcoding it to the discover feed.
// -prf
function isDiscoverFeed(feed?: FeedDescriptor) {
  return !!feed && FEEDBACK_FEEDS.includes(feed)
}

function buildFeedInfo(feed: FeedSourceInfo | FeedDescriptor): FeedInfo | null {
  // Build FeedInfo object from either a feed source info object or a feed descriptor string
  // Only discover feeds are supported for feed descriptor strings
  if (typeof feed === 'object') {
    if (feed.type !== 'feed') {
      // Don't send feedback to non-feed sources
      return null
    }
    const feedDescriptor = feed.feedDescriptor
    const isDiscover = isDiscoverFeed(feed.feedDescriptor)
    const proxyDid = feed.view?.did
    if (!proxyDid) {
      logger.warn(`No proxy did found for feed: ${feedDescriptor}.`)
      return null
    }
    let acceptsInteractions = feed.acceptsInteractions ?? false
    if (isDiscover) {
      // Discover feed doesn't have acceptsInteractions: true, so hardcode this for now
      acceptsInteractions = true
    }
    return {
      feedDescriptor,
      isDiscover,
      proxyDid,
      acceptsInteractions,
    }
  } else {
    const feedDescriptor = feed
    const isDiscover = isDiscoverFeed(feedDescriptor)
    if (!isDiscover) {
      return null
    }
    const proxyDid = STAGING_FEEDS.includes(feedDescriptor)
      ? 'did:web:algo.pop2.bsky.app'
      : 'did:web:discover.bsky.app'
    return {
      feedDescriptor,
      isDiscover,
      proxyDid,
      acceptsInteractions: true,
    }
  }
}

function toString(interaction: AppBskyFeedDefs.Interaction): string {
  return `${interaction.item}|${interaction.event}|${
    interaction.feedContext || ''
  }|${interaction.reqId || ''}`
}

function toInteraction(str: string): AppBskyFeedDefs.Interaction {
  const [item, event, feedContext, reqId] = str.split('|')
  return {item, event, feedContext, reqId}
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
  interactions: AppBskyFeedDefs.Interaction[],
) {
  for (let interaction of interactions) {
    switch (interaction.event) {
      // Pressing "Show more" / "Show less" is relatively uncommon so we won't aggregate them.
      // This lets us send the feed context together with them.
      case 'app.bsky.feed.defs#requestLess': {
        logEvent('discover:showLess', {
          feedContext: interaction.feedContext ?? '',
        })
        break
      }
      case 'app.bsky.feed.defs#requestMore': {
        logEvent('discover:showMore', {
          feedContext: interaction.feedContext ?? '',
        })
        break
      }

      // The rest of the events are aggregated and sent later in batches.
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

function flushToStatsig(stats: AggregatedStats | null) {
  if (stats === null) {
    return
  }

  if (stats.clickthroughCount > 0) {
    logEvent('discover:clickthrough', {
      count: stats.clickthroughCount,
    })
    stats.clickthroughCount = 0
  }

  if (stats.engagedCount > 0) {
    logEvent('discover:engaged', {
      count: stats.engagedCount,
    })
    stats.engagedCount = 0
  }

  if (stats.seenCount > 0) {
    logEvent('discover:seen', {
      count: stats.seenCount,
    })
    stats.seenCount = 0
  }
}
