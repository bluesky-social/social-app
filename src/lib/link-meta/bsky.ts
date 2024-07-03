import {AppBskyFeedPost, AppBskyGraphStarterpack, BskyAgent} from '@atproto/api'

import {useFetchDid} from '#/state/queries/handle'
import {useGetPost} from '#/state/queries/post'
import * as apilib from 'lib/api/index'
import {
  createStarterPackUri,
  parseStarterPackUri,
} from 'lib/strings/starter-pack'
import {ComposerOptsQuote} from 'state/shell/composer'
// import {match as matchRoute} from 'view/routes'
import {convertBskyAppUrlIfNeeded, makeRecordUri} from '../strings/url-helpers'
import {LikelyType, LinkMeta} from './link-meta'

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
  agent: BskyAgent,
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
  getPost: ReturnType<typeof useGetPost>,
  url: string,
): Promise<ComposerOptsQuote> {
  url = convertBskyAppUrlIfNeeded(url)
  const [_0, user, _1, rkey] = url.split('/').filter(Boolean)
  const uri = makeRecordUri(user, 'app.bsky.feed.post', rkey)
  const post = await getPost({uri: uri})
  return {
    uri: post.uri,
    cid: post.cid,
    text: AppBskyFeedPost.isRecord(post.record) ? post.record.text : '',
    indexedAt: post.indexedAt,
    author: post.author,
  }
}

export async function getFeedAsEmbed(
  agent: BskyAgent,
  fetchDid: ReturnType<typeof useFetchDid>,
  url: string,
): Promise<apilib.ExternalEmbedDraft> {
  url = convertBskyAppUrlIfNeeded(url)
  const [_0, handleOrDid, _1, rkey] = url.split('/').filter(Boolean)
  const did = await fetchDid(handleOrDid)
  const feed = makeRecordUri(did, 'app.bsky.feed.generator', rkey)
  const res = await agent.app.bsky.feed.getFeedGenerator({feed})
  return {
    isLoading: false,
    uri: feed,
    meta: {
      url: feed,
      likelyType: LikelyType.AtpData,
      title: res.data.view.displayName,
    },
    embed: {
      $type: 'app.bsky.embed.record',
      record: {
        uri: res.data.view.uri,
        cid: res.data.view.cid,
      },
    },
  }
}

export async function getListAsEmbed(
  agent: BskyAgent,
  fetchDid: ReturnType<typeof useFetchDid>,
  url: string,
): Promise<apilib.ExternalEmbedDraft> {
  url = convertBskyAppUrlIfNeeded(url)
  const [_0, handleOrDid, _1, rkey] = url.split('/').filter(Boolean)
  const did = await fetchDid(handleOrDid)
  const list = makeRecordUri(did, 'app.bsky.graph.list', rkey)
  const res = await agent.app.bsky.graph.getList({list})
  return {
    isLoading: false,
    uri: list,
    meta: {
      url: list,
      likelyType: LikelyType.AtpData,
      title: res.data.list.name,
    },
    embed: {
      $type: 'app.bsky.embed.record',
      record: {
        uri: res.data.list.uri,
        cid: res.data.list.cid,
      },
    },
  }
}

export async function getStarterPackAsEmbed(
  agent: BskyAgent,
  fetchDid: ReturnType<typeof useFetchDid>,
  url: string,
): Promise<apilib.ExternalEmbedDraft> {
  const parsed = parseStarterPackUri(url)
  if (!parsed) {
    throw new Error(
      'Unexepectedly called getStarterPackAsEmbed with a non-starterpack url',
    )
  }
  const did = await fetchDid(parsed.name)
  const starterPack = createStarterPackUri({did, rkey: parsed.rkey})
  const res = await agent.app.bsky.graph.getStarterPack({starterPack})
  const record = res.data.starterPack.record
  return {
    isLoading: false,
    uri: starterPack,
    meta: {
      url: starterPack,
      likelyType: LikelyType.AtpData,
      // Validation here should never fail
      title: AppBskyGraphStarterpack.isRecord(record)
        ? record.name
        : 'Starter Pack',
    },
    embed: {
      $type: 'app.bsky.embed.record',
      record: {
        uri: res.data.starterPack.uri,
        cid: res.data.starterPack.cid,
      },
    },
  }
}
