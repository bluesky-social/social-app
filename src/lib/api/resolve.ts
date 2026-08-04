import {type Client} from '@atproto/lex'
import {AtUri, type AtUriString, type HandleString} from '@atproto/syntax'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '#/lib/constants'
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
import {type ComposerImage} from '#/state/gallery'
import {createComposerImage} from '#/state/gallery'
import {type ChatInvitePreview} from '#/state/queries/join-links'
import {type Gif} from '#/features/gifPicker/types'
import {app, chat, com} from '#/lexicons'
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
  record: com.atproto.repo.strongRef.Main
  kind: 'post'
  view: app.bsky.feed.defs.PostView
}

type ResolvedFeedRecord = {
  type: 'record'
  record: com.atproto.repo.strongRef.Main
  kind: 'feed'
  view: app.bsky.feed.defs.GeneratorView
}

type ResolvedListRecord = {
  type: 'record'
  record: com.atproto.repo.strongRef.Main
  kind: 'list'
  view: app.bsky.graph.defs.ListView
}

type ResolvedStarterPackRecord = {
  type: 'record'
  record: com.atproto.repo.strongRef.Main
  kind: 'starter-pack'
  view: app.bsky.graph.defs.StarterPackView
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

/**
 * The clients a link resolution may need.
 *
 * Everything but the chat-invite branch is an appview read, and the chat invite
 * preview goes through the chat client so it is proxied to the chat service.
 * Both are passed together because the caller cannot know which branch a URL
 * will take until it is parsed.
 */
export type LinkResolvers = {
  appviewClient: Client
  chatClient: Client
}

export async function resolveLink(
  {appviewClient, chatClient}: LinkResolvers,
  uri: string,
): Promise<ResolvedLink> {
  if (isShortLink(uri)) {
    uri = await resolveShortLink(uri)
  }
  if (isBskyPostUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, user, _1, rkey] = uri.split('/').filter(Boolean)
    const recordUri = makeRecordUri(user, 'app.bsky.feed.post', rkey)
    const post = await getPost({uri: recordUri})
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
    const data = await appviewClient.call(app.bsky.feed.getFeedGenerator, {
      feed: feed,
    })
    return {
      type: 'record',
      record: {
        uri: data.view.uri,
        cid: data.view.cid,
      },
      kind: 'feed',
      view: data.view,
    }
  }
  if (isBskyListUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean)
    const did = await fetchDid(handleOrDid)
    const list = makeRecordUri(did, 'app.bsky.graph.list', rkey)
    const data = await appviewClient.call(app.bsky.graph.getList, {
      list: list,
    })
    return {
      type: 'record',
      record: {
        uri: data.list.uri,
        cid: data.list.cid,
      },
      kind: 'list',
      view: data.list,
    }
  }
  const chatInviteCode = getChatInviteCodeFromUrl(uri)
  if (chatInviteCode) {
    const data = await chatClient.call(chat.bsky.group.getJoinLinkPreviews, {
      codes: [chatInviteCode],
    })
    return {
      type: 'chat-invite',
      uri,
      code: chatInviteCode,
      view: data.joinLinkPreviews[0],
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
    const data = await appviewClient.call(app.bsky.graph.getStarterPack, {
      starterPack: starterPack as AtUriString,
    })
    return {
      type: 'record',
      record: {
        uri: data.starterPack.uri,
        cid: data.starterPack.cid,
      },
      kind: 'starter-pack',
      view: data.starterPack,
    }
  }
  return resolveExternal(uri)

  // Forked from useGetPost. TODO: move into RQ.
  async function getPost({uri}: {uri: string}) {
    const urip = new AtUri(uri)
    if (!urip.host.startsWith('did:')) {
      const data = await appviewClient.call(
        com.atproto.identity.resolveHandle,
        {handle: urip.host as HandleString},
      )
      urip.host = data.did
    }
    const data = await appviewClient.call(app.bsky.feed.getPosts, {
      uris: [urip.toString()],
    })
    if (data.posts[0]) {
      return data.posts[0]
    }
    throw new Error('getPost: post not found')
  }

  // Forked from useFetchDid. TODO: move into RQ.
  async function fetchDid(handleOrDid: string) {
    let identifier = handleOrDid
    if (!identifier.startsWith('did:')) {
      const data = await appviewClient.call(
        com.atproto.identity.resolveHandle,
        {handle: identifier as HandleString},
      )
      identifier = data.did
    }
    return identifier
  }
}

export async function resolveGif(gif: Gif): Promise<ResolvedExternalLink> {
  const gifUrl = gif.media_formats.gif.url
  const params = new URLSearchParams()
  params.set('hh', String(gif.media_formats.gif.dims[1]))
  params.set('ww', String(gif.media_formats.gif.dims[0]))

  // For Klipy GIFs, embed video format slugs so parseKlipyGif can
  // swap to the right format per platform at render time. Klipy uses
  // different filename slugs per format (unlike Tenor where format is
  // encoded in the URL ID), so this info must travel with the URL.
  try {
    const url = new URL(gifUrl)
    if (url.hostname === 'static.klipy.com') {
      const mp4Slug = getFileSlug(gif.media_formats.mp4?.url)
      const webmSlug = getFileSlug(gif.media_formats.webm?.url)
      if (mp4Slug) params.set('mp4', mp4Slug)
      if (webmSlug) params.set('webm', webmSlug)
    }
  } catch {}

  const uri = `${gifUrl}?${params.toString()}`
  const altText = gif.content_description || gif.title
  return {
    type: 'external',
    uri,
    title: altText,
    description: createGIFDescription(altText),
    thumb: await imageToThumb(gif.media_formats.preview.url),
  }
}

function getFileSlug(url: string | undefined): string | undefined {
  if (!url) return undefined
  const filename = url.split('/').pop()
  if (!filename) return undefined
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex > 0 ? filename.slice(0, dotIndex) : undefined
}

async function resolveExternal(uri: string): Promise<ResolvedExternalLink> {
  const result = await getLinkMeta(uri)
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
