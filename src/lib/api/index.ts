import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPostgate,
  BskyAgent,
  ComAtprotoLabelDefs,
  RichText,
} from '@atproto/api'
import {AtUri} from '@atproto/api'

import {logger} from '#/logger'
import {writePostgateRecord} from '#/state/queries/postgate'
import {
  createThreadgateRecord,
  ThreadgateAllowUISetting,
  threadgateAllowUISettingToAllowRecordValue,
  writeThreadgateRecord,
} from '#/state/queries/threadgate'
import {isNetworkError} from 'lib/strings/errors'
import {shortenLinks, stripInvalidMentions} from 'lib/strings/rich-text-manip'
import {isNative} from 'platform/detection'
import {ImageModel} from 'state/models/media/image'
import {LinkMeta} from '../link-meta/link-meta'
import {safeDeleteAsync} from '../media/manip'
import {uploadBlob} from './upload-blob'

export {uploadBlob}

export interface ExternalEmbedDraft {
  uri: string
  isLoading: boolean
  meta?: LinkMeta
  embed?: AppBskyEmbedRecord.Main
  localThumb?: ImageModel
}

interface PostOpts {
  rawText: string
  replyTo?: string
  quote?: {
    uri: string
    cid: string
  }
  video?: {
    uri: string
    cid: string
  }
  extLink?: ExternalEmbedDraft
  images?: ImageModel[]
  labels?: string[]
  threadgate: ThreadgateAllowUISetting[]
  postgate: AppBskyFeedPostgate.Record
  onStateChange?: (state: string) => void
  langs?: string[]
}

export async function post(agent: BskyAgent, opts: PostOpts) {
  let embed:
    | AppBskyEmbedImages.Main
    | AppBskyEmbedExternal.Main
    | AppBskyEmbedRecord.Main
    | AppBskyEmbedRecordWithMedia.Main
    | undefined
  let reply
  let rt = new RichText(
    {text: opts.rawText.trimEnd()},
    {
      cleanNewlines: true,
    },
  )

  opts.onStateChange?.('Processing...')
  await rt.detectFacets(agent)
  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)

  // add quote embed if present
  if (opts.quote) {
    embed = {
      $type: 'app.bsky.embed.record',
      record: {
        uri: opts.quote.uri,
        cid: opts.quote.cid,
      },
    } as AppBskyEmbedRecord.Main
  }

  // add image embed if present
  if (opts.images?.length) {
    logger.debug(`Uploading images`, {
      count: opts.images.length,
    })

    const images: AppBskyEmbedImages.Image[] = []
    for (const image of opts.images) {
      opts.onStateChange?.(`Uploading image #${images.length + 1}...`)
      logger.debug(`Compressing image`)
      await image.compress()
      const path = image.compressed?.path ?? image.path
      const {width, height} = image.compressed || image
      logger.debug(`Uploading image`)
      const res = await uploadBlob(agent, path, 'image/jpeg')
      if (isNative) {
        safeDeleteAsync(path)
      }
      images.push({
        image: res.data.blob,
        alt: image.altText ?? '',
        aspectRatio: {width, height},
      })
    }

    if (opts.quote) {
      embed = {
        $type: 'app.bsky.embed.recordWithMedia',
        record: embed,
        media: {
          $type: 'app.bsky.embed.images',
          images,
        },
      } as AppBskyEmbedRecordWithMedia.Main
    } else {
      embed = {
        $type: 'app.bsky.embed.images',
        images,
      } as AppBskyEmbedImages.Main
    }
  }

  // add external embed if present
  if (opts.extLink && !opts.images?.length) {
    if (opts.extLink.embed) {
      embed = opts.extLink.embed
    } else {
      let thumb
      if (opts.extLink.localThumb) {
        opts.onStateChange?.('Uploading link thumbnail...')
        let encoding
        if (opts.extLink.localThumb.mime) {
          encoding = opts.extLink.localThumb.mime
        } else if (opts.extLink.localThumb.path.endsWith('.png')) {
          encoding = 'image/png'
        } else if (
          opts.extLink.localThumb.path.endsWith('.jpeg') ||
          opts.extLink.localThumb.path.endsWith('.jpg')
        ) {
          encoding = 'image/jpeg'
        } else {
          logger.warn('Unexpected image format for thumbnail, skipping', {
            thumbnail: opts.extLink.localThumb.path,
          })
        }
        if (encoding) {
          const thumbUploadRes = await uploadBlob(
            agent,
            opts.extLink.localThumb.path,
            encoding,
          )
          thumb = thumbUploadRes.data.blob
          if (isNative) {
            safeDeleteAsync(opts.extLink.localThumb.path)
          }
        }
      }

      if (opts.quote) {
        embed = {
          $type: 'app.bsky.embed.recordWithMedia',
          record: embed,
          media: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: opts.extLink.uri,
              title: opts.extLink.meta?.title || '',
              description: opts.extLink.meta?.description || '',
              thumb,
            },
          } as AppBskyEmbedExternal.Main,
        } as AppBskyEmbedRecordWithMedia.Main
      } else {
        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: opts.extLink.uri,
            title: opts.extLink.meta?.title || '',
            description: opts.extLink.meta?.description || '',
            thumb,
          },
        } as AppBskyEmbedExternal.Main
      }
    }
  }

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

export async function createThreadgate(
  agent: BskyAgent,
  postUri: string,
  threadgate: ThreadgateSetting[],
) {
  let allow: (
    | AppBskyFeedThreadgate.MentionRule
    | AppBskyFeedThreadgate.FollowingRule
    | AppBskyFeedThreadgate.ListRule
  )[] = []
  if (!threadgate.find(v => v.type === 'nobody')) {
    for (const rule of threadgate) {
      if (rule.type === 'mention') {
        allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'})
      } else if (rule.type === 'following') {
        allow.push({$type: 'app.bsky.feed.threadgate#followingRule'})
      } else if (rule.type === 'list') {
        allow.push({
          $type: 'app.bsky.feed.threadgate#listRule',
          list: rule.list,
        })
      }
    }
  }

  const postUrip = new AtUri(postUri)
  await agent.api.com.atproto.repo.putRecord({
    repo: agent.accountDid,
    collection: 'app.bsky.feed.threadgate',
    rkey: postUrip.rkey,
    record: {
      $type: 'app.bsky.feed.threadgate',
      post: postUri,
      allow,
      createdAt: new Date().toISOString(),
    },
  })
}
