import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type AtpAgent,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {AtUri} from '@atproto/api'

import {DM_SERVICE_HEADERS, IMAGE_SIZE_CONFIG_2K_1MB} from '#/lib/constants'
import {getLinkMeta, type LinkMeta} from '#/lib/link-meta/link-meta'
import {resolveShortLink} from '#/lib/link-meta/resolve-short-link'
import {downloadAndResize} from '#/lib/media/manip'
import {
  createStarterPackUri,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {
  convertBskyAppUrlIfNeeded,
  getChatInviteCodeFromUrl,
  isBskyCustomFeedUrl,
  isBskyListUrl,
  isBskyPostUrl,
  isBskyStarterPackUrl,
  isBskyStartUrl,
  isShortLink,
  makeRecordUri,
} from '#/lib/strings/url-helpers'
import {communityXrpc} from '#/lib/api/community'
import {type ComposerImage} from '#/state/gallery'
import {createComposerImage} from '#/state/gallery'
import {type ChatInvitePreview} from '#/state/queries/join-links'
import {type Gif} from '#/features/gifPicker/types'
import {createGIFDescription} from '../gif-alt-text'

type ResolvedExternalLink = {
  type: 'external'
  uri: string
  title: string
  description: string
  thumb: ComposerImage | undefined
  /**
   * The AT-URI of the Atmosphere record representing this external content, if
   * it exists. Example: a site.standard.document record.
   */
  associatedRefs?: LinkMeta['associatedRefs']
  view?: LinkMeta['view']
}

type ResolvedPostRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'post'
  view: AppBskyFeedDefs.PostView
}

type ResolvedFeedRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'feed'
  view: AppBskyFeedDefs.GeneratorView
}

type ResolvedListRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'list'
  view: AppBskyGraphDefs.ListView
}

type ResolvedStarterPackRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'starter-pack'
  view: AppBskyGraphDefs.StarterPackView
}

type ResolvedChatInvite = {
  type: 'chat-invite'
  uri: string
  code: string
  view?: ChatInvitePreview
}

export type ResolvedLink =
  | ResolvedExternalLink
  | ResolvedPostRecord
  | ResolvedFeedRecord
  | ResolvedListRecord
  | ResolvedStarterPackRecord
  | ResolvedChatInvite

export class EmbeddingDisabledError extends Error {
  constructor() {
    super('Embedding is disabled for this record')
  }
}

const COMMUNITY_POST_COLLECTION = 'community.blacksky.feed.post'

// Pull the path portion (without ?query) and the collection from a bsky-style
// post URL. Community posts share the /profile/<x>/post/<rkey> shape with a
// ?collection=community.blacksky.feed.post tail.
function splitPostUrl(url: string): {path: string; collection: string} {
  const stripped = convertBskyAppUrlIfNeeded(url)
  try {
    const u = new URL(stripped, 'http://_')
    const collection =
      u.searchParams.get('collection') || 'app.bsky.feed.post'
    return {path: u.pathname, collection}
  } catch {
    const [path] = stripped.split('?')
    return {path, collection: 'app.bsky.feed.post'}
  }
}

async function getCommunityPost(agent: AtpAgent, uri: string) {
  const urip = new AtUri(uri)
  if (!urip.host.startsWith('did:')) {
    const res = await agent.resolveHandle({handle: urip.host})
    // @ts-expect-error TODO new-sdk-migration
    urip.host = res.data.did
  }
  const res = await communityXrpc(
    agent,
    'community.blacksky.feed.getCommunityPost',
    {params: {uri: urip.toString()}},
  )
  if (!res.ok) {
    throw new Error(`getCommunityPost ${res.status}`)
  }
  const data = (await res.json()) as {post?: any}
  if (!data.post) throw new Error('getCommunityPost: post not found')
  return data.post
}

export async function resolveLink(
  agent: AtpAgent,
  uri: string,
): Promise<ResolvedLink> {
  if (isShortLink(uri)) {
    uri = await resolveShortLink(uri)
  }
  if (isBskyPostUrl(uri)) {
    const {path, collection} = splitPostUrl(uri)
    const [_0, user, _1, rkey] = path.split('/').filter(Boolean)
    const recordUri = makeRecordUri(user, collection, rkey)
    const post =
      collection === COMMUNITY_POST_COLLECTION
        ? await getCommunityPost(agent, recordUri)
        : await getPost({uri: recordUri})
    if (post.viewer?.embeddingDisabled) {
      throw new EmbeddingDisabledError()
    }
    return {
      type: 'record',
      record: {
        cid: post.cid,
        uri: post.uri,
      },
      kind: 'post',
      view: post,
    }
  }
  if (isBskyCustomFeedUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean)
    const did = await fetchDid(handleOrDid)
    const feed = makeRecordUri(did, 'app.bsky.feed.generator', rkey)
    const res = await agent.app.bsky.feed.getFeedGenerator({feed})
    return {
      type: 'record',
      record: {
        uri: res.data.view.uri,
        cid: res.data.view.cid,
      },
      kind: 'feed',
      view: res.data.view,
    }
  }
  if (isBskyListUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean)
    const did = await fetchDid(handleOrDid)
    const list = makeRecordUri(did, 'app.bsky.graph.list', rkey)
    const res = await agent.app.bsky.graph.getList({list})
    return {
      type: 'record',
      record: {
        uri: res.data.list.uri,
        cid: res.data.list.cid,
      },
      kind: 'list',
      view: res.data.list,
    }
  }
  const chatInviteCode = getChatInviteCodeFromUrl(uri)
  if (chatInviteCode) {
    const res = await agent.chat.bsky.group.getJoinLinkPreviews(
      {codes: [chatInviteCode]},
      {headers: DM_SERVICE_HEADERS},
    )
    return {
      type: 'chat-invite',
      uri,
      code: chatInviteCode,
      view: res.data.joinLinkPreviews[0],
    }
  }
  if (isBskyStartUrl(uri) || isBskyStarterPackUrl(uri)) {
    const parsed = parseStarterPackUri(uri)
    if (!parsed) {
      throw new Error(
        'Unexpectedly called getStarterPackAsEmbed with a non-starterpack url',
      )
    }
    const did = await fetchDid(parsed.name)
    const starterPack = createStarterPackUri({did, rkey: parsed.rkey})
    const res = await agent.app.bsky.graph.getStarterPack({starterPack})
    return {
      type: 'record',
      record: {
        uri: res.data.starterPack.uri,
        cid: res.data.starterPack.cid,
      },
      kind: 'starter-pack',
      view: res.data.starterPack,
    }
  }
  return resolveExternal(agent, uri)

  // Forked from useGetPost. TODO: move into RQ.
  async function getPost({uri}: {uri: string}) {
    const urip = new AtUri(uri)
    if (!urip.host.startsWith('did:')) {
      const res = await agent.resolveHandle({
        handle: urip.host,
      })
      // @ts-expect-error TODO new-sdk-migration
      urip.host = res.data.did
    }
    const res = await agent.getPosts({
      uris: [urip.toString()],
    })
    if (res.success && res.data.posts[0]) {
      return res.data.posts[0]
    }
    throw new Error('getPost: post not found')
  }

  // Forked from useFetchDid. TODO: move into RQ.
  async function fetchDid(handleOrDid: string) {
    let identifier = handleOrDid
    if (!identifier.startsWith('did:')) {
      const res = await agent.resolveHandle({handle: identifier})
      identifier = res.data.did
    }
    return identifier
  }
}

export async function resolveGif(
  agent: AtpAgent,
  gif: Gif,
): Promise<ResolvedExternalLink> {
  const gifUrl = gif.media_formats.gif.url
  const uri = buildGifUri(gif, gifUrl)
  const altText = gif.content_description || gif.title
  return {
    type: 'external',
    uri,
    title: altText,
    description: createGIFDescription(altText),
    thumb: await tryImageToThumb(gif.media_formats.preview.url),
  }
}

async function tryImageToThumb(
  uri: string,
): Promise<ComposerImage | undefined> {
  return await Promise.race([
    imageToThumb(uri),
    new Promise<undefined>(resolve =>
      setTimeout(() => resolve(undefined), 8e3),
    ),
  ])
}

function buildGifUri(gif: Gif, gifUrl: string): string {
  let url: URL
  try {
    url = new URL(gifUrl)
  } catch {
    return gifUrl
  }

  if (url.hostname === 'static.klipy.com') {
    url.searchParams.set('hh', String(gif.media_formats.gif.dims[1]))
    url.searchParams.set('ww', String(gif.media_formats.gif.dims[0]))
    const mp4Slug = getFileSlug(gif.media_formats.mp4?.url)
    const webmSlug = getFileSlug(gif.media_formats.webm?.url)
    if (mp4Slug) url.searchParams.set('mp4', mp4Slug)
    if (webmSlug) url.searchParams.set('webm', webmSlug)
    return url.toString()
  }

  if (/(^|\.)giphy\.com$/.test(url.hostname)) {
    const cleaned = new URL(`https://media.giphy.com${url.pathname}`)
    cleaned.searchParams.set('hh', String(gif.media_formats.gif.dims[1]))
    cleaned.searchParams.set('ww', String(gif.media_formats.gif.dims[0]))
    return cleaned.toString()
  }

  url.searchParams.set('hh', String(gif.media_formats.gif.dims[1]))
  url.searchParams.set('ww', String(gif.media_formats.gif.dims[0]))
  return url.toString()
}

function getFileSlug(url: string | undefined): string | undefined {
  if (!url) return undefined
  const filename = url.split('/').pop()
  if (!filename) return undefined
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex > 0 ? filename.slice(0, dotIndex) : undefined
}

async function resolveExternal(
  agent: AtpAgent,
  uri: string,
): Promise<ResolvedExternalLink> {
  const result = await getLinkMeta(agent, uri)
  if (result.error) {
    throw new Error(result.error)
  }
  return {
    type: 'external',
    uri: result.url,
    title: result.title ?? '',
    description: result.description ?? '',
    thumb: result.image ? await imageToThumb(result.image) : undefined,
    /*
     * New fields from Standard Site integration. Other fields are derived from
     * opengraph/oembed as before.
     */
    associatedRefs: result.associatedRefs,
    view: result.view,
  }
}

export async function imageToThumb(
  imageUri: string,
): Promise<ComposerImage | undefined> {
  try {
    const img = await downloadAndResize({
      uri: imageUri,
      ...IMAGE_SIZE_CONFIG_2K_1MB,
      timeout: 15e3,
    })
    if (img) {
      return await createComposerImage(img)
    }
  } catch {}
}
