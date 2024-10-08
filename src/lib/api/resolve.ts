import {
  AppBskyActorDefs,
  AppBskyFeedPost,
  AppBskyGraphStarterpack,
  ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {BskyAgent} from '@atproto/api'

import {POST_IMG_MAX} from '#/lib/constants'
import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {resolveShortLink} from '#/lib/link-meta/resolve-short-link'
import {downloadAndResize} from '#/lib/media/manip'
import {
  createStarterPackUri,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {
  isBskyCustomFeedUrl,
  isBskyListUrl,
  isBskyPostUrl,
  isBskyStarterPackUrl,
  isBskyStartUrl,
  isShortLink,
} from '#/lib/strings/url-helpers'
import {ComposerImage} from '#/state/gallery'
import {createComposerImage} from '#/state/gallery'
import {Gif} from '#/state/queries/tenor'
import {createGIFDescription} from '../gif-alt-text'
import {convertBskyAppUrlIfNeeded, makeRecordUri} from '../strings/url-helpers'

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
  meta: {
    text: string
    indexedAt: string
    author: AppBskyActorDefs.ProfileViewBasic
  }
}

type ResolvedOtherRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'other'
  meta: {
    // We should replace this with a hydrated record (e.g. feed, list, starter pack)
    // and change the composer preview to use the actual post embed components:
    title: string
  }
}

export type ResolvedLink =
  | ResolvedExternalLink
  | ResolvedPostRecord
  | ResolvedOtherRecord

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
      meta: {
        text: AppBskyFeedPost.isRecord(post.record) ? post.record.text : '',
        indexedAt: post.indexedAt,
        author: post.author,
      },
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
      kind: 'other',
      meta: {
        // TODO: Include hydrated content instead.
        title: res.data.view.displayName,
      },
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
      kind: 'other',
      meta: {
        // TODO: Include hydrated content instead.
        title: res.data.list.name,
      },
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
    const record = res.data.starterPack.record
    return {
      type: 'record',
      record: {
        uri: res.data.starterPack.uri,
        cid: res.data.starterPack.cid,
      },
      kind: 'other',
      meta: {
        // TODO: Include hydrated content instead.
        title: AppBskyGraphStarterpack.isRecord(record)
          ? record.name
          : 'Starter Pack',
      },
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
  const uri = `${gif.media_formats.gif.url}?hh=${gif.media_formats.gif.dims[1]}&ww=${gif.media_formats.gif.dims[0]}`
  return {
    type: 'external',
    uri,
    title: gif.content_description,
    description: createGIFDescription(gif.content_description),
    thumb: await imageToThumb(gif.media_formats.preview.url),
  }
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

async function imageToThumb(
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
