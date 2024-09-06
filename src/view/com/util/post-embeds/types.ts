export enum PostEmbedViewContext {
  ThreadHighlighted = 'ThreadHighlighted',
  Feed = 'Feed',
  FeedEmbedRecordWithMedia = 'FeedEmbedRecordWithMedia',
}

export enum QuoteEmbedViewContext {
  FeedEmbedRecordWithMedia = PostEmbedViewContext.FeedEmbedRecordWithMedia,
}
