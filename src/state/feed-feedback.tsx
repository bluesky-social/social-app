import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import debounce from 'lodash.debounce'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {FeedDescriptor, isFeedPostSlice} from '#/state/queries/post-feed'

type StateContext = {
  enabled: boolean
  onItemSeen: (item: any) => void
  sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => void
  flushAndReset: () => void
}

const stateContext = React.createContext<StateContext>({
  enabled: false,
  onItemSeen: (_item: any) => {},
  sendInteraction: (_interaction: AppBskyFeedDefs.Interaction) => {},
  flushAndReset: () => {},
})

export function useFeedFeedback(feed: FeedDescriptor) {
  const enabled = isDiscoverFeed(feed)
  const queue = React.useRef<Set<string>>(new Set())
  const history = React.useRef<Set<string>>(new Set())

  const [sendToFeed] = React.useState(() =>
    debounce(
      () => {
        console.log(Array.from(queue.current).map(toInteraction))
        for (const v of queue.current) {
          history.current.add(v)
        }
        queue.current.clear()
      },
      15e3,
      {maxWait: 60e3},
    ),
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

  return React.useMemo(() => {
    return {
      enabled,

      // pass this method to the <List> onItemSeen
      onItemSeen: (slice: any) => {
        if (!enabled) {
          return
        }
        if (!isFeedPostSlice(slice)) {
          return
        }
        for (const postItem of slice.items) {
          const str = toString({
            uri: postItem.uri,
            event: 'app.bsky.feed.defs#interactionSeen',
            feedContext: postItem.feedContext,
          })
          if (!history.current.has(str)) {
            queue.current.add(str)
            sendToFeed()
          }
        }
      },

      // call on various events
      // queues the event to be sent with the debounced sendToFeed call
      sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => {
        if (!enabled) {
          return
        }
        const str = toString(interaction)
        if (!history.current.has(str)) {
          queue.current.add(str)
          sendToFeed()
        }
      },

      // call on feed refresh
      // immediately sends all queued events and clears the history tracker
      flushAndReset: () => {
        if (!enabled) {
          return
        }
        sendToFeed.flush()
        history.current.clear()
      },
    }
  }, [enabled, queue, sendToFeed])
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
  return feed === `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`
}

function toString(interaction: AppBskyFeedDefs.Interaction): string {
  return `${interaction.uri}|${interaction.event}|${
    interaction.feedContext || ''
  }`
}

function toInteraction(str: string): AppBskyFeedDefs.Interaction {
  const [uri, event, feedContext] = str.split('|')
  return {uri, event, feedContext}
}
