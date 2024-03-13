export type Events = {
  init: {
    initMs: number
  }
  'post:like': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unlike': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
}
