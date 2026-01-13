export type LiveEventFeedImageLayout = 'wide' // maybe more in the future

export type LiveEventFeedImage = {
  alt: string
  overlayColor: string
  url: string
  blurhash: string
}

export type LiveEventFeed = {
  title: string
  url: string
  images: Record<LiveEventFeedImageLayout, LiveEventFeedImage>
}

export type LiveEventsWorkerResponse = {
  feeds: LiveEventFeed[]
}
