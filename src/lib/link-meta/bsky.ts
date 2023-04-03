import {LikelyType, LinkMeta} from './link-meta'
// import {match as matchRoute} from 'view/routes'
import {convertBskyAppUrlIfNeeded, makeRecordUri} from '../strings/url-helpers'
import {RootStoreModel} from 'state/index'
import {PostThreadModel} from 'state/models/content/post-thread'
import {ComposerOptsQuote} from 'state/models/ui/shell'

// TODO
// import {Home} from 'view/screens/Home'
// import {Search} from 'view/screens/Search'
// import {Notifications} from 'view/screens/Notifications'
// import {PostThread} from 'view/screens/PostThread'
// import {PostUpvotedBy} from 'view/screens/PostUpvotedBy'
// import {PostRepostedBy} from 'view/screens/PostRepostedBy'
// import {Profile} from 'view/screens/Profile'
// import {ProfileFollowers} from 'view/screens/ProfileFollowers'
// import {ProfileFollows} from 'view/screens/ProfileFollows'

// NOTE
// this is a hack around the lack of hosted social metadata
// remove once that's implemented
// -prf
export async function extractBskyMeta(
  store: RootStoreModel,
  url: string,
): Promise<LinkMeta> {
  url = convertBskyAppUrlIfNeeded(url)
  // const route = matchRoute(url)
  let meta: LinkMeta = {
    likelyType: LikelyType.AtpData,
    url,
    // title: route.defaultTitle,
  }

  // if (route.Com === Home) {
  //   meta = {
  //     ...meta,
  //     title: 'Bluesky',
  //     description: 'A new kind of social network',
  //   }
  // } else if (route.Com === Search) {
  //   meta = {
  //     ...meta,
  //     title: 'Search - Bluesky',
  //     description: 'A new kind of social network',
  //   }
  // } else if (route.Com === Notifications) {
  //   meta = {
  //     ...meta,
  //     title: 'Notifications - Bluesky',
  //     description: 'A new kind of social network',
  //   }
  // } else if (
  //   route.Com === PostThread ||
  //   route.Com === PostUpvotedBy ||
  //   route.Com === PostRepostedBy
  // ) {
  //   // post and post-related screens
  //   const threadUri = makeRecordUri(
  //     route.params.name,
  //     'app.bsky.feed.post',
  //     route.params.rkey,
  //   )
  //   const threadView = new PostThreadViewModel(store, {
  //     uri: threadUri,
  //     depth: 0,
  //   })
  //   await threadView.setup().catch(_err => undefined)
  //   const title = [
  //     route.Com === PostUpvotedBy
  //       ? 'Likes on a post by'
  //       : route.Com === PostRepostedBy
  //       ? 'Reposts of a post by'
  //       : 'Post by',
  //     threadView.thread?.post.author.displayName ||
  //       threadView.thread?.post.author.handle ||
  //       'a bluesky user',
  //   ].join(' ')
  //   meta = {
  //     ...meta,
  //     title,
  //     description: threadView.thread?.postRecord?.text,
  //   }
  // } else if (
  //   route.Com === Profile ||
  //   route.Com === ProfileFollowers ||
  //   route.Com === ProfileFollows
  // ) {
  //   // profile and profile-related screens
  //   const profile = await store.profiles.getProfile(route.params.name)
  //   if (profile?.data) {
  //     meta = {
  //       ...meta,
  //       title: profile.data.displayName || profile.data.handle,
  //       description: profile.data.description,
  //     }
  //   }
  // }

  return meta
}

export async function getPostAsQuote(
  store: RootStoreModel,
  url: string,
): Promise<ComposerOptsQuote> {
  url = convertBskyAppUrlIfNeeded(url)
  const [_0, user, _1, rkey] = url.split('/').filter(Boolean)
  const threadUri = makeRecordUri(user, 'app.bsky.feed.post', rkey)

  const threadView = new PostThreadModel(store, {
    uri: threadUri,
    depth: 0,
  })
  await threadView.setup()
  if (!threadView.thread || threadView.notFound) {
    throw new Error('Not found')
  }
  return {
    uri: threadView.thread.post.uri,
    cid: threadView.thread.post.cid,
    text: threadView.thread.postRecord?.text || '',
    indexedAt: threadView.thread.post.indexedAt,
    author: {
      handle: threadView.thread.post.author.handle,
      displayName: threadView.thread.post.author.displayName,
      avatar: threadView.thread.post.author.avatar,
    },
  }
}
