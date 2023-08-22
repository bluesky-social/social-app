// TODO: ATM, @atproto/api does not export ids but it does have these listed at @atproto/api/client/lexicons
// once we start exporting the ids from the @atproto/ap package, replace these hardcoded ones
export enum CollectionId {
  FeedGenerator = 'app.bsky.feed.generator',
  Profile = 'app.bsky.actor.profile',
  List = 'app.bsky.graph.list',
  Post = 'app.bsky.feed.post',
}
