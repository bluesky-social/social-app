import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import debounce from 'lodash.debounce'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {FeedDescriptor, isFeedPostSlice} from '#/state/queries/post-feed'

// TODO replace with atproto api
interface Interaction {
  uri: string
  event: string
  feedContext: string
}

type StateContext = {
  enabled: boolean
  onItemSeen: (item: any) => void
  sendInteraction: (interaction: Interaction) => void
}

const stateContext = React.createContext<StateContext>({
  enabled: false,
  onItemSeen: (_item: any) => {},
  sendInteraction: (_interaction: Interaction) => {},
})

export function Provider({
  feed,
  children,
}: React.PropsWithChildren<{feed: FeedDescriptor}>) {
  const enabled = isDiscoverFeed(feed)
  const queue = React.useRef<Set<string>>(new Set())

  const sendToFeed = React.useRef(
    debounce(
      () => {
        console.log(Array.from(queue.current).map(toInteraction))
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
        sendToFeed.current.flush()
      }
    })
    return () => sub.remove()
  }, [enabled, sendToFeed])

  const state = React.useMemo(() => {
    return {
      enabled,
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
            feedContext: 'TODO',
          })
          if (!queue.current.has(str)) {
            queue.current.add(str)
            sendToFeed.current()
          }
        }
      },
      sendInteraction: (interaction: Interaction) => {
        queue.current.add(toString(interaction))
        sendToFeed.current()
      },
    }
  }, [enabled, queue, sendToFeed])

  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useFeedFeedback() {
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

function toString(interaction: Interaction): string {
  return `${interaction.uri}|${interaction.event}|${interaction.feedContext}`
}

function toInteraction(str: string): Interaction {
  const [uri, event, feedContext] = str.split('|')
  return {uri, event, feedContext}
}
