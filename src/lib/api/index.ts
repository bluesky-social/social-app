import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedPost,
  AppBskyFeedPostgate,
  AtUri,
  BlobRef,
  BskyAgent,
  ComAtprotoLabelDefs,
  ComAtprotoRepoApplyWrites,
  ComAtprotoRepoStrongRef,
  RichText,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {t} from '@lingui/macro'
import {QueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {logger} from '#/logger'
import {compressImage} from '#/state/gallery'
import {
  fetchResolveGifQuery,
  fetchResolveLinkQuery,
} from '#/state/queries/resolve-link'
import {
  createThreadgateRecord,
  threadgateAllowUISettingToAllowRecordValue,
} from '#/state/queries/threadgate'
import {ComposerDraft, EmbedDraft} from '#/view/com/composer/state/composer'
import {createGIFDescription} from '../gif-alt-text'
import {uploadBlob} from './upload-blob'

export {uploadBlob}

interface PostOpts {
  draft: ComposerDraft
  replyTo?: string
  onStateChange?: (state: string) => void
  langs?: string[]
}

export async function post(
  agent: BskyAgent,
  queryClient: QueryClient,
  opts: PostOpts,
) {
  const draft = opts.draft

  opts.onStateChange?.(t`Processing...`)
  // NB -- Do not await anything here to avoid waterfalls!
  // Instead, store Promises which will be unwrapped as they're needed.
  const rtPromise = resolveRT(agent, draft.richtext)
  const embedPromise = resolveEmbed(
    agent,
    queryClient,
    draft,
    opts.onStateChange,
  )
  let replyPromise
  if (opts.replyTo) {
    replyPromise = resolveReply(agent, opts.replyTo)
  }

  // set labels
  let labels: ComAtprotoLabelDefs.SelfLabels | undefined
  if (draft.labels.length) {
    labels = {
      $type: 'com.atproto.label.defs#selfLabels',
      values: draft.labels.map(val => ({val})),
    }
  }

  // add top 3 languages from user preferences if langs is provided
  let langs = opts.langs
  if (opts.langs) {
    langs = opts.langs.slice(0, 3)
  }

  const rkey = TID.nextStr()
  const uri = `at://${agent.assertDid}/app.bsky.feed.post/${rkey}`
  const date = new Date().toISOString()

  const writes: ComAtprotoRepoApplyWrites.Create[] = []

  // Create post record
  {
    const rt = await rtPromise
    const embed = await embedPromise
    const reply = await replyPromise
    const record: AppBskyFeedPost.Record = {
      $type: 'app.bsky.feed.post',
      createdAt: date,
      text: rt.text,
      facets: rt.facets,
      reply,
      embed,
      langs,
      labels,
    }

    writes.push({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.feed.post',
      rkey: rkey,
      value: record,
    })
  }

  // Create threadgate record
  if (draft.threadgate.some(tg => tg.type !== 'everybody')) {
    const record = createThreadgateRecord({
      createdAt: date,
      post: uri,
      allow: threadgateAllowUISettingToAllowRecordValue(draft.threadgate),
    })

    writes.push({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.feed.threadgate',
      rkey: rkey,
      value: record,
    })
  }

  // Create postgate record
  if (
    draft.postgate.embeddingRules?.length ||
    draft.postgate.detachedEmbeddingUris?.length
  ) {
    const record: AppBskyFeedPostgate.Record = {
      ...draft.postgate,
      $type: 'app.bsky.feed.postgate',
      createdAt: date,
      post: uri,
    }

    writes.push({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.feed.postgate',
      rkey: rkey,
      value: record,
    })
  }

  try {
    await agent.com.atproto.repo.applyWrites({
      repo: agent.assertDid,
      writes: writes,
      validate: true,
    })
  } catch (e: any) {
    logger.error(`Failed to create post`, {
      safeMessage: e.message,
    })
    if (isNetworkError(e)) {
      throw new Error(
        t`Post failed to upload. Please check your Internet connection and try again.`,
      )
    } else {
      throw e
    }
  }

  return {uri}
}

async function resolveRT(agent: BskyAgent, richtext: RichText) {
  let rt = new RichText({text: richtext.text.trimEnd()}, {cleanNewlines: true})
  await rt.detectFacets(agent)

  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)
  return rt
}

async function resolveReply(agent: BskyAgent, replyTo: string) {
  const replyToUrip = new AtUri(replyTo)
  const parentPost = await agent.getPost({
    repo: replyToUrip.host,
    rkey: replyToUrip.rkey,
  })
  if (parentPost) {
    const parentRef = {
      uri: parentPost.uri,
      cid: parentPost.cid,
    }
    return {
      root: parentPost.value.reply?.root || parentRef,
      parent: parentRef,
    }
  }
}

async function resolveEmbed(
  agent: BskyAgent,
  queryClient: QueryClient,
  draft: ComposerDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | AppBskyEmbedImages.Main
  | AppBskyEmbedVideo.Main
  | AppBskyEmbedExternal.Main
  | AppBskyEmbedRecord.Main
  | AppBskyEmbedRecordWithMedia.Main
  | undefined
> {
  if (draft.embed.quote) {
    const [resolvedMedia, resolvedQuote] = await Promise.all([
      resolveMedia(agent, queryClient, draft.embed, onStateChange),
      resolveRecord(agent, queryClient, draft.embed.quote.uri),
    ])
    if (resolvedMedia) {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {
          $type: 'app.bsky.embed.record',
          record: resolvedQuote,
        },
        media: resolvedMedia,
      }
    }
    return {
      $type: 'app.bsky.embed.record',
      record: resolvedQuote,
    }
  }
  const resolvedMedia = await resolveMedia(
    agent,
    queryClient,
    draft.embed,
    onStateChange,
  )
  if (resolvedMedia) {
    return resolvedMedia
  }
  if (draft.embed.link) {
    const resolvedLink = await fetchResolveLinkQuery(
      queryClient,
      agent,
      draft.embed.link.uri,
    )
    if (resolvedLink.type === 'record') {
      return {
        $type: 'app.bsky.embed.record',
        record: resolvedLink.record,
      }
    }
  }
  return undefined
}

async function resolveMedia(
  agent: BskyAgent,
  queryClient: QueryClient,
  embedDraft: EmbedDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | AppBskyEmbedExternal.Main
  | AppBskyEmbedImages.Main
  | AppBskyEmbedVideo.Main
  | undefined
> {
  if (embedDraft.media?.type === 'images') {
    const imagesDraft = embedDraft.media.images
    logger.debug(`Uploading images`, {
      count: imagesDraft.length,
    })
    onStateChange?.(t`Uploading images...`)
    const images: AppBskyEmbedImages.Image[] = await Promise.all(
      imagesDraft.map(async (image, i) => {
        logger.debug(`Compressing image #${i}`)
        const {path, width, height, mime} = await compressImage(image)
        logger.debug(`Uploading image #${i}`)
        const res = await uploadBlob(agent, path, mime)
        return {
          image: res.data.blob,
          alt: image.alt,
          aspectRatio: {width, height},
        }
      }),
    )
    return {
      $type: 'app.bsky.embed.images',
      images,
    }
  }
  if (
    embedDraft.media?.type === 'video' &&
    embedDraft.media.video.status === 'done'
  ) {
    const videoDraft = embedDraft.media.video
    const captions = await Promise.all(
      videoDraft.captions
        .filter(caption => caption.lang !== '')
        .map(async caption => {
          const {data} = await agent.uploadBlob(caption.file, {
            encoding: 'text/vtt',
          })
          return {lang: caption.lang, file: data.blob}
        }),
    )
    return {
      $type: 'app.bsky.embed.video',
      video: videoDraft.pendingPublish.blobRef,
      alt: videoDraft.altText || undefined,
      captions: captions.length === 0 ? undefined : captions,
      aspectRatio: {
        width: videoDraft.asset.width,
        height: videoDraft.asset.height,
      },
    }
  }
  if (embedDraft.media?.type === 'gif') {
    const gifDraft = embedDraft.media
    const resolvedGif = await fetchResolveGifQuery(
      queryClient,
      agent,
      gifDraft.gif,
    )
    let blob: BlobRef | undefined
    if (resolvedGif.thumb) {
      onStateChange?.(t`Uploading link thumbnail...`)
      const {path, mime} = resolvedGif.thumb.source
      const response = await uploadBlob(agent, path, mime)
      blob = response.data.blob
    }
    return {
      $type: 'app.bsky.embed.external',
      external: {
        uri: resolvedGif.uri,
        title: resolvedGif.title,
        description: createGIFDescription(resolvedGif.title, gifDraft.alt),
        thumb: blob,
      },
    }
  }
  if (embedDraft.link) {
    const resolvedLink = await fetchResolveLinkQuery(
      queryClient,
      agent,
      embedDraft.link.uri,
    )
    if (resolvedLink.type === 'external') {
      let blob: BlobRef | undefined
      if (resolvedLink.thumb) {
        onStateChange?.(t`Uploading link thumbnail...`)
        const {path, mime} = resolvedLink.thumb.source
        const response = await uploadBlob(agent, path, mime)
        blob = response.data.blob
      }
      return {
        $type: 'app.bsky.embed.external',
        external: {
          uri: resolvedLink.uri,
          title: resolvedLink.title,
          description: resolvedLink.description,
          thumb: blob,
        },
      }
    }
  }
  return undefined
}

async function resolveRecord(
  agent: BskyAgent,
  queryClient: QueryClient,
  uri: string,
): Promise<ComAtprotoRepoStrongRef.Main> {
  const resolvedLink = await fetchResolveLinkQuery(queryClient, agent, uri)
  if (resolvedLink.type !== 'record') {
    throw Error(t`Expected uri to resolve to a record`)
  }
  return resolvedLink.record
}
