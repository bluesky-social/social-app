import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type BskyAgent,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {AtUri} from '@atproto/api'

import {POST_IMG_MAX} from '#/lib/constants'
import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {resolveShortLink} from '#/lib/link-meta/resolve-short-link'
import {downloadAndResize} from '#/lib/media/manip'
import {
  createStarterPackUri,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {
  convertBskyAppUrlIfNeeded,
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
import {type Gif} from '#/state/queries/tenor'
import {createGIFDescription} from '../gif-alt-text'

type ResolvedExternalLink = {
  type: 'external'
  uri: string
  title: string
  description: string
  thumb: ComposerImage | undefined
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

export type ResolvedLink =
  | ResolvedExternalLink
  | ResolvedPostRecord
  | ResolvedFeedRecord
  | ResolvedListRecord
  | ResolvedStarterPackRecord

export class EmbeddingDisabledError extends Error {
  constructor() {
    super('Embedding is disabled for this record')
  }
}

export async function resolveLink(
  agent: BskyAgent,
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
  agent: BskyAgent,
  gif: Gif,
): Promise<ResolvedExternalLink> {
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

async function resolveExternal(
  agent: BskyAgent,
  uri: string,
): Promise<ResolvedExternalLink> {
  const result = await getLinkMeta(agent, uri)
  return {
    type: 'external',
    uri: result.url,
    title: result.title ?? '',
    description: result.description ?? '',
    thumb: result.image ? await imageToThumb(result.image) : undefined,
  }
}

export async function imageToThumb(
  imageUri: string,
): Promise<ComposerImage | undefined> {
  try {
    const img = await downloadAndResize({
      uri: imageUri,
      width: POST_IMG_MAX.width,
      height: POST_IMG_MAX.height,
      mode: 'contain',
      maxSize: POST_IMG_MAX.size,
      timeout: 15e3,
    })
    if (img) {
      return await createComposerImage(img)
    }
  } catch {}
}
