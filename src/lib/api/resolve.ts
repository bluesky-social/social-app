import {AppBskyActorDefs, ComAtprotoRepoStrongRef} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {BskyAgent} from '@atproto/api'

import {POST_IMG_MAX} from '#/lib/constants'
import {
  getFeedAsEmbed,
  getListAsEmbed,
  getPostAsQuote,
  getStarterPackAsEmbed,
} from '#/lib/link-meta/bsky'
import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {resolveShortLink} from '#/lib/link-meta/resolve-short-link'
import {downloadAndResize} from '#/lib/media/manip'
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

type ResolvedLink =
  | ResolvedExternalLink
  | ResolvedPostRecord
  | ResolvedOtherRecord

export async function resolveLink(
  agent: BskyAgent,
  uri: string,
): Promise<ResolvedLink> {
  if (isShortLink(uri)) {
    uri = await resolveShortLink(uri)
  }
  if (isBskyPostUrl(uri)) {
    const result = await getPostAsQuote(getPost, uri)
    return {
      type: 'record',
      record: {
        cid: result.cid,
        uri: result.uri,
      },
      kind: 'post',
      meta: result,
    }
  }
  if (isBskyCustomFeedUrl(uri)) {
    const result = await getFeedAsEmbed(agent, fetchDid, uri)
    return {
      type: 'record',
      record: result.embed!.record,
      kind: 'other',
      meta: {
        // TODO: Include hydrated content instead.
        title: result.meta!.title!,
      },
    }
  }
  if (isBskyListUrl(uri)) {
    const result = await getListAsEmbed(agent, fetchDid, uri)
    return {
      type: 'record',
      record: result.embed!.record,
      kind: 'other',
      meta: {
        // TODO: Include hydrated content instead.
        title: result.meta!.title!,
      },
    }
  }
  if (isBskyStartUrl(uri) || isBskyStarterPackUrl(uri)) {
    const result = await getStarterPackAsEmbed(agent, fetchDid, uri)
    return {
      type: 'record',
      record: result.embed!.record,
      kind: 'other',
      meta: {
        // TODO: Include hydrated content instead.
        title: result.meta!.title!,
      },
    }
  }
  return resolveExternal(agent, uri)

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
