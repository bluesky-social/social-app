import {
  type $Typed,
  type AppBskyEmbedExternal,
  type AppBskyEmbedGallery,
  type AppBskyEmbedImages,
  type AppBskyEmbedRecord,
  type AppBskyEmbedRecordWithMedia,
  type AppBskyEmbedVideo,
  AppBskyFeedPost,
  type AtpAgent,
  BlobRef,
  ChatBskyGroupDefs,
  type ComAtprotoLabelDefs,
  type ComAtprotoRepoApplyWrites,
  type ComAtprotoRepoStrongRef,
  RichText,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import * as dcbor from '@ipld/dag-cbor'
import {t} from '@lingui/core/macro'
import {type QueryClient} from '@tanstack/react-query'
import {sha256} from 'js-sha256'
import {CID} from 'multiformats/cid'
import * as Hasher from 'multiformats/hashes/hasher'

import {communityXrpc} from '#/lib/api/community'
import {IMAGE_SIZE_CONFIG_POSTS} from '#/lib/constants'
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
import {
  type EmbedDraft,
  type PostDraft,
  type ThreadDraft,
} from '#/view/com/composer/state/composer'
import * as bsky from '#/types/bsky'
import {createGIFDescription} from '../gif-alt-text'
import {uploadBlob} from './upload-blob'

export {uploadBlob}

const COMMUNITY_POST_COLLECTION = 'community.blacksky.feed.post'

interface PostOpts {
  thread: ThreadDraft
  replyTo?: string
  onStateChange?: (state: string) => void
  langs?: string[]
}

export async function post(
  agent: AtpAgent,
  queryClient: QueryClient,
  opts: PostOpts,
) {
  const thread = opts.thread
  opts.onStateChange?.(t`Processing...`)

  if (thread.blackskyOnly) {
    return postCommunity(agent, queryClient, opts)
  }

  let replyPromise:
    | Promise<AppBskyFeedPost.Record['reply']>
    | AppBskyFeedPost.Record['reply']
    | undefined
  if (opts.replyTo) {
    // Not awaited to avoid waterfalls.
    replyPromise = resolveReply(agent, opts.replyTo)
  }

  // add top 3 languages from user preferences if langs is provided
  let langs = opts.langs
  if (opts.langs) {
    langs = opts.langs.slice(0, 3)
  }

  const did = agent.assertDid
  const writes: $Typed<ComAtprotoRepoApplyWrites.Create>[] = []
  const uris: string[] = []

  let now = new Date()
  let tid: TID | undefined

  for (let i = 0; i < thread.posts.length; i++) {
    const draft = thread.posts[i]

    // Not awaited to avoid waterfalls.
    const rtPromise = resolveRT(agent, draft.richtext)
    const embedPromise = resolveEmbed(
      agent,
      queryClient,
      draft,
      opts.onStateChange,
    )
    let labels: $Typed<ComAtprotoLabelDefs.SelfLabels> | undefined
    if (draft.labels.length) {
      labels = {
        $type: 'com.atproto.label.defs#selfLabels',
        values: draft.labels.map(val => ({val})),
      }
    }

    // The sorting behavior for multiple posts sharing the same createdAt time is
    // undefined, so what we'll do here is increment the time by 1 for every post
    now.setMilliseconds(now.getMilliseconds() + 1)
    tid = TID.next(tid)
    const rkey = tid.toString()
    const uri = `at://${did}/app.bsky.feed.post/${rkey}`
    uris.push(uri)

    const rt = await rtPromise
    const embed = await embedPromise
    const reply = await replyPromise
    const record: AppBskyFeedPost.Record = {
      // IMPORTANT: $type has to exist, CID is calculated with the `$type` field
      // present and will produce the wrong CID if you omit it.
      $type: 'app.bsky.feed.post',
      createdAt: now.toISOString(),
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

    if (i === 0 && thread.threadgate.some(tg => tg.type !== 'everybody')) {
      writes.push({
        $type: 'com.atproto.repo.applyWrites#create',
        collection: 'app.bsky.feed.threadgate',
        rkey: rkey,
        value: createThreadgateRecord({
          createdAt: now.toISOString(),
          post: uri,
          allow: threadgateAllowUISettingToAllowRecordValue(thread.threadgate),
        }),
      })
    }

    if (
      thread.postgate.embeddingRules?.length ||
      thread.postgate.detachedEmbeddingUris?.length
    ) {
      writes.push({
        $type: 'com.atproto.repo.applyWrites#create',
        collection: 'app.bsky.feed.postgate',
        rkey: rkey,
        value: {
          ...thread.postgate,
          $type: 'app.bsky.feed.postgate',
          createdAt: now.toISOString(),
          post: uri,
        },
      })
    }

    // Prepare a ref to the current post for the next post in the thread.
    const ref = {
      cid: await computeCid(record),
      uri,
    }
    replyPromise = {
      root: reply?.root ?? ref,
      parent: ref,
    }
  }

  try {
    await agent.com.atproto.repo.applyWrites({
      repo: agent.assertDid,
      writes: writes,
      validate: true,
    })
  } catch (err) {
    const e = err as Error
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

  return {uris}
}

async function postCommunity(
  agent: AtpAgent,
  queryClient: QueryClient,
  opts: PostOpts,
) {
  const thread = opts.thread

  let replyPromise:
    | Promise<AppBskyFeedPost.Record['reply']>
    | AppBskyFeedPost.Record['reply']
    | undefined
  if (opts.replyTo) {
    replyPromise = resolveReply(agent, opts.replyTo)
  }

  let langs = opts.langs
  if (opts.langs) {
    langs = opts.langs.slice(0, 3)
  }

  const did = agent.assertDid
  const writes: $Typed<ComAtprotoRepoApplyWrites.Create>[] = []
  const uris: string[] = []

  let now = new Date()
  let tid: TID | undefined

  for (let i = 0; i < thread.posts.length; i++) {
    const draft = thread.posts[i]

    const rtPromise = resolveRT(agent, draft.richtext)
    const embedPromise = resolveEmbed(
      agent,
      queryClient,
      draft,
      opts.onStateChange,
    )
    let labels: $Typed<ComAtprotoLabelDefs.SelfLabels> | undefined
    if (draft.labels.length) {
      labels = {
        $type: 'com.atproto.label.defs#selfLabels',
        values: draft.labels.map(val => ({val})),
      }
    }

    now.setMilliseconds(now.getMilliseconds() + 1)
    tid = TID.next(tid)
    const rkey = tid.toString()
    const uri = `at://${did}/${COMMUNITY_POST_COLLECTION}/${rkey}`
    uris.push(uri)

    const rt = await rtPromise
    const embed = await embedPromise
    const reply = await replyPromise

    // Step 1: Build the canonical record for CID computation
    // This MUST match the structure the appview uses for CID verification
    const createdAt = now.toISOString()
    const canonicalRecord: Record<string, unknown> = {
      $type: COMMUNITY_POST_COLLECTION,
      text: rt.text,
      createdAt,
    }
    if (rt.facets?.length) {
      canonicalRecord.facets = rt.facets
    }
    if (langs?.length) {
      canonicalRecord.langs = langs
    }
    if (embed) {
      canonicalRecord.embed = embed
    }
    if (reply) {
      canonicalRecord.reply = reply
    }

    // Step 2: Compute CID locally - this is the SOURCE OF TRUTH for integrity
    const cid = await computeCid(
      canonicalRecord as unknown as AppBskyFeedPost.Record,
    )

    // Step 3: Submit to appview with expectedCid for verification
    opts.onStateChange?.(t`Submitting to community...`)
    const submitBody: Record<string, unknown> = {
      rkey,
      text: rt.text,
      createdAt,
      expectedCid: cid, // Appview will verify this matches
    }
    if (rt.facets?.length) {
      submitBody.facets = rt.facets
    }
    if (reply) {
      submitBody.reply = reply
    }
    if (embed) {
      submitBody.embed = embed
    }
    if (langs?.length) {
      submitBody.langs = langs
    }
    if (labels) {
      submitBody.labels = labels
    }

    try {
      const submitRes = await communityXrpc(
        agent,
        'community.blacksky.feed.submitPost',
        {body: submitBody},
      )
      if (!submitRes.ok) {
        const errBody = (await submitRes.json().catch(() => ({}))) as {
          message?: string
        }
        throw new Error(errBody.message || `HTTP ${submitRes.status}`)
      }
      // Appview returns the verified CID - should match our local computation
      const submitData = (await submitRes.json()) as {cid?: string}
      if (submitData?.cid !== cid) {
        logger.warn(`CID mismatch: local=${cid}, server=${submitData?.cid}`)
      }
    } catch (e) {
      logger.error(`Failed to submit community post content`, {
        safeMessage: e instanceof Error ? e.message : String(e),
      })
      throw new Error(t`Failed to submit community post. Please try again.`)
    }

    // Step 4: Build stub record for PDS with CLIENT-COMPUTED CID
    const stubRecord: Record<string, unknown> = {
      $type: COMMUNITY_POST_COLLECTION,
      createdAt,
      cid, // Client's own CID - source of truth for integrity verification
    }

    writes.push({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: COMMUNITY_POST_COLLECTION,
      rkey,
      value: stubRecord,
    })

    // Prepare ref for next post in thread
    const ref = {
      cid: await computeCid(stubRecord as unknown as AppBskyFeedPost.Record),
      uri,
    }
    replyPromise = {
      root: reply?.root ?? ref,
      parent: ref,
    }
  }

  // Write stubs to PDS
  try {
    await agent.com.atproto.repo.applyWrites({
      repo: agent.assertDid,
      writes,
      validate: false,
    })
  } catch (e) {
    logger.error(`Failed to write community post stubs`, {
      safeMessage: e instanceof Error ? e.message : String(e),
    })
    if (isNetworkError(e)) {
      throw new Error(
        t`Post failed to upload. Please check your Internet connection and try again.`,
      )
    } else {
      throw e
    }
  }

  return {uris}
}

async function resolveRT(agent: AtpAgent, richtext: RichText) {
  const trimmedText = richtext.text
    // Trim leading whitespace-only lines (but don't break ASCII art).
    .replace(/^(\s*\n)+/, '')
    // Trim any trailing whitespace.
    .trimEnd()
  let rt = new RichText({text: trimmedText}, {cleanNewlines: true})
  await rt.detectFacets(agent)

  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)
  return rt
}

export class ReplyDeletedError extends Error {
  constructor() {
    super('Could not resolve reply')
  }
}

async function resolveReply(agent: AtpAgent, replyTo: string) {
  const replyToUrip = new AtUri(replyTo)

  // Community posts are fetched from the appview, not the standard feed API.
  if (replyToUrip.collection === COMMUNITY_POST_COLLECTION) {
    const res = await communityXrpc(
      agent,
      'community.blacksky.feed.getCommunityPost',
      {params: {uri: replyTo}},
    )
    if (!res.ok) {
      logger.error('Failed to fetch parent community post for reply', {
        uri: replyTo,
      })
      return undefined
    }
    const data = (await res.json()) as {
      post?: {
        uri: string
        cid: string
        replyRoot?: string
        replyRootCid?: string
      }
    }
    if (data.post) {
      const parentRef = {uri: data.post.uri, cid: data.post.cid}
      const rootRef =
        data.post.replyRoot && data.post.replyRootCid
          ? {uri: data.post.replyRoot, cid: data.post.replyRootCid}
          : parentRef
      return {root: rootRef, parent: parentRef}
    }
    return undefined
  }

  // Standard Bluesky post
  const {data} = await agent.app.bsky.feed.getPosts({
    uris: [replyTo],
  })
  const parentPost = data.posts[0]
  if (!parentPost) {
    throw new ReplyDeletedError()
  }

  const parentRef = {
    uri: parentPost.uri,
    cid: parentPost.cid,
  }
  let rootRef = parentRef

  if (
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      parentPost.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    if (parentPost.record.reply) {
      rootRef = parentPost.record.reply.root
    }
  }

  return {
    root: rootRef,
    parent: parentRef,
  }
}

async function resolveEmbed(
  agent: AtpAgent,
  queryClient: QueryClient,
  draft: PostDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | $Typed<AppBskyEmbedImages.Main>
  | $Typed<AppBskyEmbedGallery.Main>
  | $Typed<AppBskyEmbedVideo.Main>
  | $Typed<AppBskyEmbedExternal.Main>
  | $Typed<AppBskyEmbedRecord.Main>
  | $Typed<AppBskyEmbedRecordWithMedia.Main>
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
  agent: AtpAgent,
  queryClient: QueryClient,
  embedDraft: EmbedDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | $Typed<AppBskyEmbedExternal.Main>
  | $Typed<AppBskyEmbedImages.Main>
  | $Typed<AppBskyEmbedGallery.Main>
  | $Typed<AppBskyEmbedVideo.Main>
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
        const {path, width, height, mime} = await compressImage(
          image,
          IMAGE_SIZE_CONFIG_POSTS,
        )
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
  if (embedDraft.media?.type === 'gallery') {
    const imagesDraft = embedDraft.media.images
    logger.debug(`Uploading images`, {
      count: imagesDraft.length,
    })
    onStateChange?.(t`Uploading images...`)
    const items: $Typed<AppBskyEmbedGallery.Image>[] = await Promise.all(
      imagesDraft.map(async (image, i) => {
        logger.debug(`Compressing image #${i}`)
        const {path, width, height, mime} = await compressImage(
          image,
          IMAGE_SIZE_CONFIG_POSTS,
        )
        logger.debug(`Uploading image #${i}`)
        const res = await uploadBlob(agent, path, mime)
        return {
          $type: 'app.bsky.embed.gallery#image' as const,
          image: res.data.blob,
          alt: image.alt,
          aspectRatio: {width, height},
        }
      }),
    )
    return {
      $type: 'app.bsky.embed.gallery',
      items,
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

    // lexicon numbers must be floats
    const width = Math.round(videoDraft.asset.width)
    const height = Math.round(videoDraft.asset.height)

    // aspect ratio values must be >0 - better to leave as unset otherwise
    // posting will fail if aspect ratio is set to 0
    const aspectRatio = width > 0 && height > 0 ? {width, height} : undefined

    if (!aspectRatio) {
      logger.error(
        `Invalid aspect ratio - got { width: ${videoDraft.asset.width}, height: ${videoDraft.asset.height} }`,
      )
    }

    return {
      $type: 'app.bsky.embed.video',
      video: videoDraft.pendingPublish.blobRef,
      alt: videoDraft.altText || undefined,
      captions: captions.length === 0 ? undefined : captions,
      aspectRatio,
      presentation:
        videoDraft.video.mimeType === 'image/gif' ? 'gif' : 'default',
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
          associatedRefs: resolvedLink.associatedRefs,
        },
      }
    }
    if (
      resolvedLink.type === 'chat-invite' &&
      ChatBskyGroupDefs.isJoinLinkPreviewView(resolvedLink.view)
    ) {
      return {
        $type: 'app.bsky.embed.external',
        external: {
          uri: resolvedLink.uri,
          title: resolvedLink.view.name,
          description: `${resolvedLink.view.memberCount}/${resolvedLink.view.memberLimit}`,
        },
      }
    }
  }
  return undefined
}

async function resolveRecord(
  agent: AtpAgent,
  queryClient: QueryClient,
  uri: string,
): Promise<ComAtprotoRepoStrongRef.Main> {
  const resolvedLink = await fetchResolveLinkQuery(queryClient, agent, uri)
  if (resolvedLink.type !== 'record') {
    throw Error(t`Expected uri to resolve to a record`)
  }
  return resolvedLink.record
}

// The built-in hashing functions from multiformats (`multiformats/hashes/sha2`)
// are meant for Node.js, this is the cross-platform equivalent.
const mf_sha256 = Hasher.from({
  name: 'sha2-256',
  code: 0x12,
  encode: input => {
    const digest = sha256.arrayBuffer(input)
    return new Uint8Array(digest)
  },
})

async function computeCid(record: AppBskyFeedPost.Record): Promise<string> {
  // IMPORTANT: `prepareObject` prepares the record to be hashed by removing
  // fields with undefined value, and converting BlobRef instances to the
  // right IPLD representation.
  const prepared = prepareForHashing(record)
  // 1. Encode the record into DAG-CBOR format
  const encoded = dcbor.encode(prepared)
  // 2. Hash the record in SHA-256 (code 0x12)
  const digest = await mf_sha256.digest(encoded)
  // 3. Create a CIDv1, specifying DAG-CBOR as content (code 0x71)
  const cid = CID.createV1(0x71, digest)
  // 4. Get the Base32 representation of the CID (`b` prefix)
  return cid.toString()
}

// Returns a transformed version of the object for use in DAG-CBOR.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prepareForHashing(v: any): any {
  // IMPORTANT: BlobRef#ipld() returns the correct object we need for hashing,
  // the API client will convert this for you but we're hashing in the client,
  // so we need it *now*.
  if (v instanceof BlobRef) {
    return v.ipld()
  }

  // Walk through arrays
  if (Array.isArray(v)) {
    let pure = true
    const mapped = v.map(value => {
      if (value !== (value = prepareForHashing(value))) {
        pure = false
      }
      return value
    })
    return pure ? v : mapped
  }

  // Walk through plain objects
  if (isPlainObject(v)) {
    const obj: Record<string, unknown> = {}
    let pure = true
    for (const key in v) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      let value = v[key]
      // `value` is undefined
      if (value === undefined) {
        pure = false
        continue
      }
      // `prepareObject` returned a value that's different from what we had before
      if (value !== (value = prepareForHashing(value))) {
        pure = false
      }
      obj[key] = value
    }
    // Return as is if we haven't needed to tamper with anything
    return pure ? v : obj
  }
  return v
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPlainObject(v: any): boolean {
  if (typeof v !== 'object' || v === null) {
    return false
  }
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}
