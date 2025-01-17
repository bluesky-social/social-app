import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import throttle from 'lodash.throttle'

import {FEEDBACK_FEEDS, STAGING_FEEDS} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {FeedDescriptor, FeedPostSliceItem} from '#/state/queries/post-feed'
import {getFeedPostSlice} from '#/view/com/posts/PostFeed'
import {useAgent} from './session'

type StateContext = {
  enabled: boolean
  onItemSeen: (item: any) => void
  sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => void
}

const stateContext = React.createContext<StateContext>({
  enabled: false,
  onItemSeen: (_item: any) => {},
  sendInteraction: (_interaction: AppBskyFeedDefs.Interaction) => {},
})

export function useFeedFeedback(feed: FeedDescriptor, hasSession: boolean) {
  const agent = useAgent()
  const enabled = isDiscoverFeed(feed) && hasSession

  const queue = React.useRef<Set<string>>(new Set())
  const history = React.useRef<
    // Use a WeakSet so that we don't need to clear it.
    // This assumes that referential identity of slice items maps 1:1 to feed (re)fetches.
    WeakSet<FeedPostSliceItem | AppBskyFeedDefs.Interaction>
  >(new WeakSet())

  const aggregatedStats = React.useRef<AggregatedStats | null>(null)
  const throttledFlushAggregatedStats = React.useMemo(
    () =>
      throttle(() => flushToStatsig(aggregatedStats.current), 45e3, {
        leading: true, // The outer call is already throttled somewhat.
        trailing: true,
      }),
    [],
  )

  const sendToFeedNoDelay = React.useCallback(() => {
    const interactions = Array.from(queue.current).map(toInteraction)
    queue.current.clear()

    let proxyDid = 'did:web:discover.bsky.app'
    if (STAGING_FEEDS.includes(feed)) {
      proxyDid = 'did:web:algo.pop2.bsky.app'
    }

    // Send to the feed
    agent.app.bsky.feed
      .sendInteractions(
        {interactions},
        {
          encoding: 'application/json',
          headers: {
            // TODO when we start sending to other feeds, we need to grab their DID -prf
            'atproto-proxy': `${proxyDid}#bsky_fg`,
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
    sendOrAggregateInteractionsForStats(aggregatedStats.current, interactions)
    throttledFlushAggregatedStats()
  }, [agent, throttledFlushAggregatedStats, feed])

  const sendToFeed = React.useMemo(
    () =>
      throttle(sendToFeedNoDelay, 10e3, {
        leading: false,
        trailing: true,
      }),
    [sendToFeedNoDelay],
  )

  React.useEffect(() => {
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

  const onItemSeen = React.useCallback(
    (feedItem: any) => {
      if (!enabled) {
        return
      }
      const slice = getFeedPostSlice(feedItem)
      if (slice === null) {
        return
      }
      for (const postItem of slice.items) {
        if (!history.current.has(postItem)) {
          history.current.add(postItem)
          queue.current.add(
            toString({
              item: postItem.uri,
              event: 'app.bsky.feed.defs#interactionSeen',
              feedContext: slice.feedContext,
            }),
          )
          sendToFeed()
        }
      }
    },
    [enabled, sendToFeed],
  )

  const sendInteraction = React.useCallback(
    (interaction: AppBskyFeedDefs.Interaction) => {
      if (!enabled) {
        return
      }
      if (!history.current.has(interaction)) {
        history.current.add(interaction)
        queue.current.add(toString(interaction))
        sendToFeed()
      }
    },
    [enabled, sendToFeed],
  )

  return React.useMemo(() => {
    return {
      enabled,
      // pass this method to the <List> onItemSeen
      onItemSeen,
      // call on various events
      // queues the event to be sent with the throttled sendToFeed call
      sendInteraction,
    }
  }, [enabled, onItemSeen, sendInteraction])
}

export const FeedFeedbackProvider = stateContext.Provider

export function useFeedFeedbackContext() {
  return React.useContext(stateContext)
}

// TODO
// We will introduce a permissions framework for 3p feeds to
// take advantage of the feed feedback API. Until that's in
// place, we're hardcoding it to the discover feed.
// -prf
function isDiscoverFeed(feed: FeedDescriptor) {
  return FEEDBACK_FEEDS.includes(feed)
}

function toString(interaction: AppBskyFeedDefs.Interaction): string {
  return `${interaction.item}|${interaction.event}|${
    interaction.feedContext || ''
  }`
}

function toInteraction(str: string): AppBskyFeedDefs.Interaction {
  const [item, event, feedContext] = str.split('|')
  return {item, event, feedContext}
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
