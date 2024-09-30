import {
  AppBskyEmbedDefs,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyFeedPostgate,
  AtUri,
  BlobRef,
  BskyAgent,
  ComAtprotoLabelDefs,
  RichText,
} from '@atproto/api'

import {isNetworkError} from '#/lib/strings/errors'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {logger} from '#/logger'
import {ComposerImage, compressImage} from '#/state/gallery'
import {writePostgateRecord} from '#/state/queries/postgate'
import {
  createThreadgateRecord,
  ThreadgateAllowUISetting,
  threadgateAllowUISettingToAllowRecordValue,
  writeThreadgateRecord,
} from '#/state/queries/threadgate'
import {LinkMeta} from '../link-meta/link-meta'
import {uploadBlob} from './upload-blob'

export {uploadBlob}

export interface ExternalEmbedDraft {
  uri: string
  isLoading: boolean
  meta?: LinkMeta
  embed?: AppBskyEmbedRecord.Main
  localThumb?: ComposerImage
}

interface PostOpts {
  rawText: string
  replyTo?: string
  quote?: {
    uri: string
    cid: string
  }
  video?: {
    blobRef: BlobRef
    altText: string
    captions: {lang: string; file: File}[]
    aspectRatio?: AppBskyEmbedDefs.AspectRatio
  }
  extLink?: ExternalEmbedDraft
  images?: ComposerImage[]
  labels?: string[]
  threadgate: ThreadgateAllowUISetting[]
  postgate: AppBskyFeedPostgate.Record
  onStateChange?: (state: string) => void
  langs?: string[]
}

export async function post(agent: BskyAgent, opts: PostOpts) {
  let reply
  let rt = new RichText({text: opts.rawText.trimEnd()}, {cleanNewlines: true})

  opts.onStateChange?.('Processing...')

  await rt.detectFacets(agent)

  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)

  const embed = await resolveEmbed(agent, opts)

  // add replyTo if post is a reply to another post
  if (opts.replyTo) {
    const replyToUrip = new AtUri(opts.replyTo)
    const parentPost = await agent.getPost({
      repo: replyToUrip.host,
      rkey: replyToUrip.rkey,
    })
    if (parentPost) {
      const parentRef = {
        uri: parentPost.uri,
        cid: parentPost.cid,
      }
      reply = {
        root: parentPost.value.reply?.root || parentRef,
        parent: parentRef,
      }
    }
  }

  // set labels
  let labels: ComAtprotoLabelDefs.SelfLabels | undefined
  if (opts.labels?.length) {
    labels = {
      $type: 'com.atproto.label.defs#selfLabels',
      values: opts.labels.map(val => ({val})),
    }
  }

  // add top 3 languages from user preferences if langs is provided
  let langs = opts.langs
  if (opts.langs) {
    langs = opts.langs.slice(0, 3)
  }

  let res
  try {
    opts.onStateChange?.('Posting...')
    res = await agent.post({
      text: rt.text,
      facets: rt.facets,
      reply,
      embed,
      langs,
      labels,
    })
  } catch (e: any) {
    logger.error(`Failed to create post`, {
      safeMessage: e.message,
    })
    if (isNetworkError(e)) {
      throw new Error(
        'Post failed to upload. Please check your Internet connection and try again.',
      )
    } else {
      throw e
    }
  }

  if (opts.threadgate.some(tg => tg.type !== 'everybody')) {
    try {
      // TODO: this needs to be batch-created with the post!
      await writeThreadgateRecord({
        agent,
        postUri: res.uri,
        threadgate: createThreadgateRecord({
          post: res.uri,
          allow: threadgateAllowUISettingToAllowRecordValue(opts.threadgate),
        }),
      })
    } catch (e: any) {
      logger.error(`Failed to create threadgate`, {
        context: 'composer',
        safeMessage: e.message,
      })
      throw new Error(
        'Failed to save post interaction settings. Your post was created but users may be able to interact with it.',
      )
    }
  }

  if (
    opts.postgate.embeddingRules?.length ||
    opts.postgate.detachedEmbeddingUris?.length
  ) {
    try {
      // TODO: this needs to be batch-created with the post!
      await writePostgateRecord({
        agent,
        postUri: res.uri,
        postgate: {
          ...opts.postgate,
          post: res.uri,
        },
      })
    } catch (e: any) {
      logger.error(`Failed to create postgate`, {
        context: 'composer',
        safeMessage: e.message,
      })
      throw new Error(
        'Failed to save post interaction settings. Your post was created but users may be able to interact with it.',
      )
    }
  }

  return res
}

async function resolveEmbed(agent: BskyAgent, opts: PostOpts) {
  if (opts.images?.length) {
    logger.debug(`Uploading images`, {
      count: opts.images.length,
    })

    const images: AppBskyEmbedImages.Image[] = []
    for (const image of opts.images) {
      opts.onStateChange?.(`Uploading image #${images.length + 1}...`)

      logger.debug(`Compressing image`)
      const {path, width, height, mime} = await compressImage(image)

      logger.debug(`Uploading image`)
      const res = await uploadBlob(agent, path, mime)

      images.push({
        image: res.data.blob,
        alt: image.alt,
        aspectRatio: {width, height},
      })
    }

    if (opts.quote) {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {
          $type: 'app.bsky.embed.record',
          record: {
            uri: opts.quote.uri,
            cid: opts.quote.cid,
          },
        },
        media: {
          $type: 'app.bsky.embed.images',
          images,
        },
      }
    }
    return {
      $type: 'app.bsky.embed.images',
      images,
    }
  }

  if (opts.video) {
    const captions = await Promise.all(
      opts.video.captions
        .filter(caption => caption.lang !== '')
        .map(async caption => {
          const {data} = await agent.uploadBlob(caption.file, {
            encoding: 'text/vtt',
          })
          return {lang: caption.lang, file: data.blob}
        }),
    )
    if (opts.quote) {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {
          $type: 'app.bsky.embed.record',
          record: {
            uri: opts.quote.uri,
            cid: opts.quote.cid,
          },
        },
        media: {
          $type: 'app.bsky.embed.video',
          video: opts.video.blobRef,
          alt: opts.video.altText || undefined,
          captions: captions.length === 0 ? undefined : captions,
          aspectRatio: opts.video.aspectRatio,
        },
      }
    }
    return {
      $type: 'app.bsky.embed.video',
      video: opts.video.blobRef,
      alt: opts.video.altText || undefined,
      captions: captions.length === 0 ? undefined : captions,
      aspectRatio: opts.video.aspectRatio,
    }
  }

  if (opts.extLink) {
    if (opts.extLink.embed) {
      return opts.extLink.embed
    }
    let thumb
    if (opts.extLink.localThumb) {
      opts.onStateChange?.('Uploading link thumbnail...')

      const {path, mime} = opts.extLink.localThumb.source
      const res = await uploadBlob(agent, path, mime)

      thumb = res.data.blob
    }

    if (opts.quote) {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {
          $type: 'app.bsky.embed.record',
          record: {
            uri: opts.quote.uri,
            cid: opts.quote.cid,
          },
        },
        media: {
          $type: 'app.bsky.embed.external',
          external: {
            uri: opts.extLink.uri,
            title: opts.extLink.meta?.title || '',
            description: opts.extLink.meta?.description || '',
            thumb,
          },
        },
      }
    }
    return {
      $type: 'app.bsky.embed.external',
      external: {
        uri: opts.extLink.uri,
        title: opts.extLink.meta?.title || '',
        description: opts.extLink.meta?.description || '',
        thumb,
      },
    }
  }

  if (opts.quote) {
    return {
      $type: 'app.bsky.embed.record',
      record: {
        uri: opts.quote.uri,
        cid: opts.quote.cid,
      },
    }
  }

  return undefined
}
