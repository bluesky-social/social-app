export type LiveEventFeedImageLayout = 'wide' | 'compact' // maybe more in the future

export type LiveEventFeedLayout = {
  title: string
  overlayColor: string
  textColor: string
  image: string
  blurhash: string
}

export type LiveEventFeed = {
  id: string
  preview: boolean
  title: string
  url: string
  layouts: Record<LiveEventFeedImageLayout, LiveEventFeedLayout>
}

export type LiveEventsWorkerResponse = {
  feeds: LiveEventFeed[]
}

export type LiveEventFeedMetricContext =
  | 'explore'
  | 'discover'
  | 'sidebar'
  | 'settings'
