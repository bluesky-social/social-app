import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import {AppBskyFeedDefs, BskyAgent} from '@atproto/api'
import throttle from 'lodash.throttle'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {logger} from '#/logger'
import {
  FeedDescriptor,
  FeedPostSliceItem,
  isFeedPostSlice,
} from '#/state/queries/post-feed'
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
  const {getAgent} = useAgent()
  const enabled = isDiscoverFeed(feed) && hasSession
  const queue = React.useRef<Set<string>>(new Set())
  const history = React.useRef<
    // Use a WeakSet so that we don't need to clear it.
    // This assumes that referential identity of slice items maps 1:1 to feed (re)fetches.
    WeakSet<FeedPostSliceItem | AppBskyFeedDefs.Interaction>
  >(new WeakSet())

  const sendToFeedNoDelay = React.useCallback(() => {
    const proxyAgent = getAgent().withProxy(
      // @ts-ignore TODO need to update withProxy() to support this key -prf
      'bsky_fg',
      // TODO when we start sending to other feeds, we need to grab their DID -prf
      'did:web:discover.bsky.app',
    ) as BskyAgent

    const interactions = Array.from(queue.current).map(toInteraction)
    queue.current.clear()

    proxyAgent.app.bsky.feed
      .sendInteractions({interactions})
      .catch((e: any) => {
        logger.warn('Failed to send feed interactions', {error: e})
      })
  }, [getAgent])

  const sendToFeed = React.useMemo(
    () =>
      throttle(sendToFeedNoDelay, 15e3, {
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
    (slice: any) => {
      if (!enabled) {
        return
      }
      if (!isFeedPostSlice(slice)) {
        return
      }
      for (const postItem of slice.items) {
        if (!history.current.has(postItem)) {
          history.current.add(postItem)
          queue.current.add(
            toString({
              item: postItem.uri,
              event: 'app.bsky.feed.defs#interactionSeen',
              feedContext: postItem.feedContext,
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
  return feed === `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`
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
