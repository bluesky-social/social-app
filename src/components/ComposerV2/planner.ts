import {TID} from '@atproto/common-web'
import {type $Typed, type BlobRef, type Client} from '@atproto/lex'
import {
  type AtUriString,
  type DidString,
  isValidTid,
  toDatetimeString,
  type UriString,
} from '@atproto/syntax'
import {RichText} from '@bsky/sdk/richtext'

import {computeCid} from '#/lib/api/computeCid'
import {type ResolvedLink} from '#/lib/api/resolve'
import {resolveRichText} from '#/lib/api/rich-text'
import {createGIFDescription} from '#/lib/gif-alt-text'
import {
  type ComposerV2OnError,
  isComposerV2Cancellation,
  reportComposerV2Error,
} from '#/components/ComposerV2/errors'
import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {
  type MediaAttachment,
  type MediaCardValue,
  type PostMediaImage,
  type PostMediaItem,
  type PostMediaVideo,
  type ThreadPost,
  type ThreadReplyTarget,
  type ThreadState,
} from '#/components/ComposerV2/store/types'
import {cloneSerializable} from '#/components/ComposerV2/store/utils/buildThreadState'
import {type Gif} from '#/features/gifPicker/types'
import {app, chat, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type ComposerV2PlanErrorCode =
  | 'missing-dependency'
  | 'invalid-snapshot'
  | 'empty-composition'
  | 'empty-post-requires-confirmation'
  | 'missing-alt-text'
  | 'attachment-not-ready'
  | 'media-failed'
  | 'unsupported-attachment'
  | 'reply-resolution-failed'
  | 'rich-text-resolution-failed'
  | 'media-upload-failed'
  | 'invalid-record-key'
  | 'invalid-record'
  | 'invalid-write-input'
  | 'unexpected-error'

export type ComposerV2PlanError = {
  code: ComposerV2PlanErrorCode
  message: string
  /** Position of the offending post within the captured snapshot order. */
  postIndex?: number
  postId?: string
  mediaId?: string
  collection?: string
  /** Non-enumerable diagnostic; never render or log without deliberate policy. */
  readonly cause?: unknown
}

/**
 * Caller-supplied submission policy that is not a lexicon constraint. These
 * decisions belong to the composing surface (user preferences, confirmation
 * dialogs), so the planner takes them as explicit inputs.
 */
export type ComposerV2PlannerPreflight = {
  /**
   * Mirrors the user's require-alt-text preference. When true, resolved
   * images, GIFs, and non-failed videos without alt text fail preflight.
   */
  requireAltText?: boolean
  /**
   * Production asks for confirmation before skipping empty posts in the
   * middle of a thread. Pass true only after that confirmation; otherwise a
   * non-trailing empty post returns a structured error.
   */
  skipEmptyPostsConfirmed?: boolean
}

export type ComposerV2PlannerDependencies = {
  /** DID that owns every planned post and gate record. */
  did: string
  /** AppView client used only for authoritative rich-text and reply reads. */
  appviewClient?: Client
  /** Captured once per plan. */
  now?: () => Date
  /**
   * Test-only deterministic key seam. When absent, keys always come from the
   * collision-resistant TID.next sequence. Either way keys must be valid
   * TIDs and unique per plan.
   */
  __createRkey?: (index: number, createdAt: Date) => string
  /**
   * Resolve the actual reply refs of the external parent; never fabricate a
   * root from a preview. The default reads the parent through the AppView
   * and uses its authoritative uri/cid for the parent ref.
   */
  resolveReply?: (
    replyTo: ThreadReplyTarget,
  ) => Promise<NonNullable<app.bsky.feed.post.Main['reply']>>
  /** Uploads a card/GIF thumbnail. This is a blob upload, never a record write. */
  uploadBlob?: (input: {path: string; mime: string}) => Promise<BlobRef>
  /** Injectable GIF resolver keeps planner tests off the network. */
  resolveGif?: (gif: Gif) => Promise<Extract<ResolvedLink, {type: 'external'}>>
}

export type PlannedComposerV2Post = {
  postId: string
  rkey: string
  uri: string
  cid: string
  record: app.bsky.feed.post.Main
}

export type PlannedComposerV2Write =
  com.atproto.repo.applyWrites.$InputBody['writes'][number]

export type ComposerV2Plan = {
  ok: true
  input: com.atproto.repo.applyWrites.$InputBody
  posts: PlannedComposerV2Post[]
  writes: PlannedComposerV2Write[]
}

export type ComposerV2PlanResult =
  ComposerV2Plan | {ok: false; errors: ComposerV2PlanError[]}

class PlannerFailure extends Error {
  constructor(
    readonly detail: ComposerV2PlanError,
    cause?: unknown,
  ) {
    super(detail.message, {cause})
    if (cause !== undefined)
      Object.defineProperty(detail, 'cause', {value: cause})
  }
}

/**
 * Construct a complete, locally validated applyWrites input without writing it.
 *
 * Snapshot policy: callers pass one published store snapshot. Published
 * snapshots are immutable - the store replaces changed branches instead of
 * mutating them - so the planner captures the snapshot reference once and
 * relies on that contract instead of defensively copying. It never reads the
 * store again, never mixes a later upload/edit into the captured snapshot,
 * and never waits in a React effect. An upload that completes after capture
 * is visible to the next planning attempt, while an edit during another
 * caller's preparation cannot affect the in-flight plan. Pending or failed
 * work in the captured snapshot returns a structured error instead of being
 * serialized.
 *
 * Preflight policy: an all-empty composition is rejected, trailing empty
 * posts are dropped, and non-trailing empty posts require the caller's
 * explicit confirmation before being skipped. A post is empty only when it
 * has no trimmed text, no attachments, and no explicit tags - a tags-only
 * post has content and is never silently discarded. Required alt text is a
 * caller preference passed through `preflight`, not a lexicon constraint.
 */
export async function planComposerV2({
  snapshot,
  dependencies,
  preflight,
  onError,
}: {
  snapshot: ThreadState
  dependencies: ComposerV2PlannerDependencies
  preflight?: ComposerV2PlannerPreflight
  /** Pass a session/attempt-guarded callback when planning can be superseded. */
  onError?: ComposerV2OnError
}): Promise<ComposerV2PlanResult> {
  try {
    if (
      !snapshot ||
      typeof snapshot !== 'object' ||
      !snapshot.posts ||
      typeof snapshot.posts !== 'object' ||
      Array.isArray(snapshot.posts) ||
      !Array.isArray(snapshot.postgateEmbeddingRules) ||
      (snapshot.threadgateAllowRules !== undefined &&
        !Array.isArray(snapshot.threadgateAllowRules))
    ) {
      throw failure('invalid-snapshot', 'Composition snapshot is invalid')
    }
    /* Capture the immutable snapshot's branches once, before the first await.
     * Concurrent store edits publish new snapshots and cannot alter these. */
    const {posts, replyTo, threadgateAllowRules, postgateEmbeddingRules} =
      snapshot
    validateSnapshot(snapshot, dependencies)
    const allEntries = Object.entries(posts)
    if (allEntries.length === 0) {
      throw failure('invalid-snapshot', 'Composition has no posts')
    }

    const acceptedEntries = preflightEntries(allEntries, preflight)

    const now = dependencies.now?.() ?? new Date()
    if (!Number.isFinite(now.getTime())) {
      throw failure('invalid-snapshot', 'Composition time is invalid')
    }

    const externalReply = replyTo
      ? await resolveExternalReply(replyTo, dependencies)
      : undefined
    const prepared = [] as Array<{
      postId: string
      postIndex: number
      post: app.bsky.feed.post.Main
    }>

    for (const [order, entry] of acceptedEntries.entries()) {
      const {postId, postIndex, post} = entry
      const richText = await normalizeRichText(
        post.text,
        dependencies.appviewClient,
        postIndex,
        postId,
      )
      const embed = await buildEmbed(
        post.attachments.media,
        post.attachments.record,
        {
          postIndex,
          postId,
          dependencies,
        },
      )
      const labels = post.labels.length
        ? {
            $type: 'com.atproto.label.defs#selfLabels' as const,
            values: post.labels.map(val => ({val})),
          }
        : undefined

      const record: app.bsky.feed.post.Main = {
        $type: 'app.bsky.feed.post',
        createdAt: toDatetimeString(new Date(now.getTime() + order)),
        text: richText.text,
        ...(richText.facets ? {facets: richText.facets} : {}),
        ...(post.langs.length ? {langs: post.langs.slice(0, 3)} : {}),
        ...(labels ? {labels} : {}),
        ...(post.tags.length ? {tags: [...post.tags]} : {}),
        ...(embed ? {embed} : {}),
      }
      prepared.push({postId, postIndex, post: record})
    }

    const plannedPosts: PlannedComposerV2Post[] = []
    const usedKeys = new Set<string>()
    let tid: TID | undefined
    let reply = externalReply
    for (const [order, entry] of prepared.entries()) {
      const createdAt = new Date(now.getTime() + order)
      let rkey: string
      if (dependencies.__createRkey) {
        rkey = dependencies.__createRkey(order, createdAt)
      } else {
        tid = TID.next(tid)
        rkey = tid.toString()
      }
      if (!isValidTid(rkey)) {
        throw failure(
          'invalid-record-key',
          'Post record key is not a valid TID',
          entry.postIndex,
          entry.postId,
        )
      }
      if (usedKeys.has(rkey)) {
        throw failure(
          'invalid-record-key',
          'Post record keys must be unique within a plan',
          entry.postIndex,
          entry.postId,
        )
      }
      usedKeys.add(rkey)
      const uri =
        `at://${dependencies.did}/app.bsky.feed.post/${rkey}` as AtUriString
      const record: app.bsky.feed.post.Main = reply
        ? {...entry.post, reply}
        : entry.post
      const cid = await computeCid(record)
      plannedPosts.push({
        postId: entry.postId,
        rkey,
        uri,
        cid,
        record,
      })
      // The next post replies to this one, keeping the original thread root.
      const ref = {uri, cid}
      reply = {root: reply?.root ?? ref, parent: ref}
    }

    const writes: PlannedComposerV2Write[] = []
    for (const [postIndex, planned] of plannedPosts.entries()) {
      addValidatedWrite(
        writes,
        {
          $type: 'com.atproto.repo.applyWrites#create',
          collection: 'app.bsky.feed.post',
          rkey: planned.rkey,
          value: planned.record,
        },
        postIndex,
        planned.postId,
      )

      /* Gate records intentionally reuse their post's record key in another
       * collection; only post keys must be unique among themselves. */
      if (postIndex === 0 && threadgateAllowRules !== undefined) {
        const value: app.bsky.feed.threadgate.Main = {
          $type: 'app.bsky.feed.threadgate',
          post: planned.uri as AtUriString,
          createdAt: planned.record.createdAt,
          allow: threadgateAllowRules.map(rule => cloneSerializable(rule)),
        }
        addValidatedWrite(
          writes,
          {
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.feed.threadgate',
            rkey: planned.rkey,
            value,
          },
          postIndex,
          planned.postId,
        )
      }

      if (postgateEmbeddingRules.length > 0) {
        const value: app.bsky.feed.postgate.Main = {
          $type: 'app.bsky.feed.postgate',
          post: planned.uri as AtUriString,
          createdAt: planned.record.createdAt,
          embeddingRules: postgateEmbeddingRules.map(rule =>
            cloneSerializable(rule),
          ),
        }
        addValidatedWrite(
          writes,
          {
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.feed.postgate',
            rkey: planned.rkey,
            value,
          },
          postIndex,
          planned.postId,
        )
      }
    }

    const input: com.atproto.repo.applyWrites.$InputBody = {
      repo: dependencies.did as DidString,
      writes,
      validate: true,
    }
    const inputValidation =
      com.atproto.repo.applyWrites.main.input.schema.$safeParse(input)
    if (!inputValidation.success) {
      throw failure(
        'invalid-write-input',
        'Generated write input failed validation',
      )
    }
    return {ok: true, input, posts: plannedPosts, writes}
  } catch (error) {
    const detail =
      error instanceof PlannerFailure
        ? error.detail
        : new PlannerFailure(
            {code: 'unexpected-error', message: 'Record planning failed'},
            error,
          ).detail
    const operational =
      detail.code === 'reply-resolution-failed' ||
      detail.code === 'rich-text-resolution-failed' ||
      detail.code === 'media-upload-failed'
    const unexpected =
      detail.code === 'unexpected-error' ||
      detail.code === 'missing-dependency' ||
      detail.code === 'invalid-snapshot' ||
      detail.code === 'invalid-record-key' ||
      detail.code === 'invalid-write-input'
    /* Preflight, record validation and existing store failures stay local.
     * Reading a failed upload in a snapshot is not a new failed attempt. */
    if (
      (operational || unexpected) &&
      !isComposerV2Cancellation(detail.cause)
    ) {
      reportComposerV2Error(
        onError,
        {
          source: 'planner',
          code: detail.code,
          postId: detail.postId,
          mediaId: detail.mediaId,
          kind: operational ? 'operational' : 'unexpected',
          recovery: operational ? 'retry' : 'none',
        },
        detail.cause,
      )
    }
    return {ok: false, errors: [detail]}
  }
}

/**
 * Empty-post handling: reject an all-empty composition, silently drop
 * trailing empty posts, and require explicit confirmation before skipping
 * empty posts in the middle of the thread. Attachment-only posts are not
 * empty; pending/failed attachments keep their posts and fail later
 * readiness checks instead of being dropped.
 */
function preflightEntries(
  allEntries: Array<[string, ThreadPost]>,
  preflight: ComposerV2PlannerPreflight | undefined,
): Array<{postId: string; postIndex: number; post: ThreadPost}> {
  const emptyFlags = allEntries.map(([, post]) => isEmptyThreadPost(post))
  if (emptyFlags.every(Boolean)) {
    throw failure('empty-composition', 'Composition has no content to post')
  }

  if (preflight?.requireAltText) {
    requireAltText(allEntries)
  }

  const lastNonEmptyIndex = emptyFlags.lastIndexOf(false)
  const firstNonTrailingEmpty = emptyFlags.findIndex(
    (empty, index) => empty && index < lastNonEmptyIndex,
  )
  if (firstNonTrailingEmpty !== -1 && !preflight?.skipEmptyPostsConfirmed) {
    throw failure(
      'empty-post-requires-confirmation',
      'Skipping an empty post inside the thread requires confirmation',
      firstNonTrailingEmpty,
      allEntries[firstNonTrailingEmpty][0],
    )
  }

  return allEntries
    .map(([postId, post], postIndex) => ({postId, postIndex, post}))
    .filter(({postIndex}) => !emptyFlags[postIndex])
}

/**
 * A post is empty when it has no trimmed text, no attachments, and no
 * explicit tags: a post carrying only tags has content and must not be
 * silently discarded.
 */
function isEmptyThreadPost(post: ThreadPost): boolean {
  return (
    post.text.trim().length === 0 &&
    !post.attachments.media &&
    !post.attachments.record &&
    post.tags.length === 0
  )
}

/**
 * Preference-dependent alt-text preflight: images and GIFs always need alt
 * text, and videos need it unless their upload already failed (the failure
 * error takes precedence).
 */
function requireAltText(allEntries: Array<[string, ThreadPost]>) {
  for (const [postIndex, [postId, post]] of allEntries.entries()) {
    const media = post.attachments.media
    if (!media || media.state !== 'resolved') continue
    if (media.kind === 'images') {
      const missing = media.items.find(item => !item.altText)
      if (missing) {
        throw failure(
          'missing-alt-text',
          'One or more images is missing alt text',
          postIndex,
          postId,
          missing.id,
        )
      }
    } else if (media.kind === 'gif') {
      if (!media.item.altText) {
        throw failure(
          'missing-alt-text',
          'A GIF is missing alt text',
          postIndex,
          postId,
          media.item.id,
        )
      }
    } else if (media.kind === 'video') {
      if (media.item.upload.state !== 'failed' && !media.item.altText) {
        throw failure(
          'missing-alt-text',
          'A video is missing alt text',
          postIndex,
          postId,
          media.item.id,
        )
      }
    }
  }
}

function validateSnapshot(
  snapshot: ThreadState,
  dependencies: ComposerV2PlannerDependencies,
) {
  if (!dependencies.did || !dependencies.did.startsWith('did:')) {
    throw failure('missing-dependency', 'A repository DID is required')
  }
  if (!snapshot || typeof snapshot.posts !== 'object') {
    throw failure('invalid-snapshot', 'Composition snapshot is invalid')
  }
  for (const [postId, post] of Object.entries(snapshot.posts)) {
    if (!Array.isArray(post.tags)) {
      throw failure(
        'invalid-snapshot',
        'Post tags are invalid',
        undefined,
        postId,
      )
    }
  }
}

async function normalizeRichText(
  text: string,
  appviewClient: Client | undefined,
  postIndex: number,
  postId: string,
): Promise<RichText> {
  if (!appviewClient) {
    throw failure(
      'missing-dependency',
      'An AppView client is required for rich-text resolution',
      postIndex,
      postId,
    )
  }
  try {
    return await resolveRichText(appviewClient, text)
  } catch (cause) {
    throw failure(
      'rich-text-resolution-failed',
      'Rich-text resolution failed',
      postIndex,
      postId,
      undefined,
      undefined,
      cause,
    )
  }
}

/**
 * Resolve the reply refs of the external parent: the parent ref comes from
 * the fetched post (not the local preview), the root is the parent's own
 * root when the parent is itself a reply, and otherwise the parent is the
 * root.
 */
async function resolveExternalReply(
  replyTo: ThreadReplyTarget,
  dependencies: ComposerV2PlannerDependencies,
): Promise<NonNullable<app.bsky.feed.post.Main['reply']>> {
  if (dependencies.resolveReply) {
    try {
      return await dependencies.resolveReply(replyTo)
    } catch (cause) {
      throw failure(
        'reply-resolution-failed',
        'Reply root could not be resolved',
        undefined,
        undefined,
        undefined,
        undefined,
        cause,
      )
    }
  }
  if (!dependencies.appviewClient) {
    throw failure(
      'missing-dependency',
      'An AppView client is required to resolve a reply root',
    )
  }
  try {
    const data = await dependencies.appviewClient.call(app.bsky.feed.getPosts, {
      uris: [replyTo.uri as AtUriString],
    })
    const parentPost = data.posts[0]
    if (!parentPost) throw new Error('missing')
    const parentRef = {uri: parentPost.uri, cid: parentPost.cid}
    let rootRef: com.atproto.repo.strongRef.Main = parentRef
    if (
      bsky.isType(app.bsky.feed.post, parentPost.record) &&
      parentPost.record.reply
    ) {
      rootRef = parentPost.record.reply.root
    }
    return {root: rootRef, parent: parentRef}
  } catch (cause) {
    throw failure(
      'reply-resolution-failed',
      'Reply root could not be resolved',
      undefined,
      undefined,
      undefined,
      undefined,
      cause,
    )
  }
}

async function buildEmbed(
  media: MediaAttachment | undefined,
  record: ThreadState['posts'][string]['attachments']['record'],
  context: {
    postIndex: number
    postId: string
    dependencies: ComposerV2PlannerDependencies
  },
): Promise<PlannedEmbed | undefined> {
  const recordEmbed: $Typed<app.bsky.embed.record.Main> | undefined = record
    ? {
        $type: 'app.bsky.embed.record',
        record: requireResolvedRecord(record, context),
      }
    : undefined
  const mediaEmbed = media ? await buildMediaEmbed(media, context) : undefined
  if (recordEmbed && mediaEmbed) {
    return {
      $type: 'app.bsky.embed.recordWithMedia',
      record: recordEmbed,
      media: mediaEmbed,
    }
  }
  return recordEmbed ?? mediaEmbed
}

function requireResolvedRecord(
  attachment: NonNullable<
    ThreadState['posts'][string]['attachments']['record']
  >,
  context: {postIndex: number; postId: string},
): com.atproto.repo.strongRef.Main {
  if (attachment.state !== 'resolved') {
    throw failure(
      attachment.state === 'failed' ? 'media-failed' : 'attachment-not-ready',
      'Record attachment is not ready',
      context.postIndex,
      context.postId,
    )
  }
  // The output record set owns its refs; copy out of the shared snapshot.
  return {...attachment.record}
}

async function buildMediaEmbed(
  media: MediaAttachment,
  context: {
    postIndex: number
    postId: string
    dependencies: ComposerV2PlannerDependencies
  },
): Promise<PlannedMediaEmbed> {
  if (media.state !== 'resolved') {
    throw failure(
      media.state === 'failed' ? 'media-failed' : 'attachment-not-ready',
      'Media attachment is not ready',
      context.postIndex,
      context.postId,
    )
  }
  if (media.kind === 'images') {
    if (media.items.length < 1 || media.items.length > MAX_IMAGES_PER_POST) {
      throw failure(
        'unsupported-attachment',
        'Image count is outside the supported range',
        context.postIndex,
        context.postId,
      )
    }
    const images = media.items.map(item => imageRecord(item, context))
    return images.length <= 4
      ? {$type: 'app.bsky.embed.images', images}
      : {
          $type: 'app.bsky.embed.gallery',
          items: images.map(image => ({
            $type: 'app.bsky.embed.gallery#image' as const,
            ...image,
          })),
        }
  }
  if (media.kind === 'video') {
    return videoRecord(media.item, context)
  }
  if (media.kind === 'gif') {
    const resolve = context.dependencies.resolveGif
    if (!resolve) {
      throw failure(
        'missing-dependency',
        'A GIF resolver is required for a GIF embed',
        context.postIndex,
        context.postId,
      )
    }
    let resolved: Extract<ResolvedLink, {type: 'external'}>
    try {
      resolved = await resolve(media.item.gif)
    } catch (cause) {
      throw failure(
        'media-upload-failed',
        'GIF embed preparation failed',
        context.postIndex,
        context.postId,
        media.item.id,
        undefined,
        cause,
      )
    }
    const external = await externalRecord(resolved, context)
    return {
      ...external,
      external: {
        ...external.external,
        /* A nonempty user alt is preserved with the user prefix; otherwise
         * fall back to the provider title. */
        description: createGIFDescription(resolved.title, media.item.altText),
      },
    }
  }
  return externalRecord(media, context)
}

type ImageData = {
  image: BlobRef
  alt: string
  aspectRatio: {width: number; height: number}
}

type PlannedMediaEmbed =
  | $Typed<app.bsky.embed.images.Main>
  | $Typed<app.bsky.embed.gallery.Main>
  | $Typed<app.bsky.embed.video.Main>
  | $Typed<app.bsky.embed.external.Main>

type PlannedEmbed =
  | $Typed<app.bsky.embed.images.Main>
  | $Typed<app.bsky.embed.gallery.Main>
  | $Typed<app.bsky.embed.video.Main>
  | $Typed<app.bsky.embed.external.Main>
  | $Typed<app.bsky.embed.record.Main>
  | $Typed<app.bsky.embed.recordWithMedia.Main>

function imageRecord(
  item: PostMediaImage,
  context: {postIndex: number; postId: string},
): ImageData {
  const blob = uploadedBlob(item, context)
  const dimensions = item.prepared ?? {
    width: item.width,
    height: item.height,
  }
  if (!validDimensions(dimensions)) {
    throw failure(
      'invalid-record',
      'Image dimensions are invalid',
      context.postIndex,
      context.postId,
      item.id,
    )
  }
  return {
    image: blob,
    alt: item.altText,
    aspectRatio: {width: dimensions.width, height: dimensions.height},
  }
}

function videoRecord(
  item: PostMediaVideo,
  context: {postIndex: number; postId: string},
): $Typed<app.bsky.embed.video.Main> {
  if (item.upload.state !== 'uploaded') {
    throw failure(
      item.upload.state === 'failed' ? 'media-failed' : 'attachment-not-ready',
      'Video upload is not ready',
      context.postIndex,
      context.postId,
      item.id,
    )
  }
  const dimensions = item.prepared ?? {
    width: item.width,
    height: item.height,
  }
  if (!validDimensions(dimensions)) {
    throw failure(
      'invalid-record',
      'Video dimensions are invalid',
      context.postIndex,
      context.postId,
      item.id,
    )
  }
  const captions = item.captions.map(caption => {
    const uploaded = item.captionBlobs.find(
      value => value.lang === caption.lang,
    )
    if (!uploaded) {
      throw failure(
        'attachment-not-ready',
        'Video caption upload is not ready',
        context.postIndex,
        context.postId,
        item.id,
      )
    }
    return {lang: caption.lang, file: uploaded.blob}
  })
  return {
    $type: 'app.bsky.embed.video',
    video: item.upload.blob,
    ...(item.altText ? {alt: item.altText} : {}),
    ...(captions.length ? {captions} : {}),
    aspectRatio: {width: dimensions.width, height: dimensions.height},
    presentation: item.mimeType === 'image/gif' ? 'gif' : 'default',
  }
}

function uploadedBlob(
  item: PostMediaItem,
  context: {postIndex: number; postId: string},
): BlobRef {
  if (item.kind === 'gif' || item.upload.state !== 'uploaded') {
    throw failure(
      item.kind !== 'gif' && item.upload.state === 'failed'
        ? 'media-failed'
        : 'attachment-not-ready',
      'Media upload is not ready',
      context.postIndex,
      context.postId,
      item.kind === 'gif' ? undefined : item.id,
    )
  }
  return item.upload.blob
}

async function externalRecord(
  link: MediaCardValue | Extract<ResolvedLink, {type: 'external'}>,
  context: {
    postIndex: number
    postId: string
    dependencies: ComposerV2PlannerDependencies
  },
): Promise<$Typed<app.bsky.embed.external.Main>> {
  let thumb: BlobRef | undefined
  const linkThumb = 'thumb' in link ? link.thumb : undefined
  if (linkThumb) {
    if (!context.dependencies.uploadBlob) {
      throw failure(
        'missing-dependency',
        'A blob uploader is required for an external thumbnail',
        context.postIndex,
        context.postId,
      )
    }
    try {
      thumb = await context.dependencies.uploadBlob({
        path: linkThumb.source.path,
        mime: linkThumb.source.mime,
      })
    } catch (cause) {
      throw failure(
        'media-upload-failed',
        'External thumbnail upload failed',
        context.postIndex,
        context.postId,
        undefined,
        undefined,
        cause,
      )
    }
  }

  if ('kind' in link && link.kind === 'chat-invite') {
    if (
      !link.view ||
      !bsky.matches(chat.bsky.group.defs.joinLinkPreviewView, link.view)
    ) {
      throw failure(
        'unsupported-attachment',
        'Chat invite preview is missing',
        context.postIndex,
        context.postId,
      )
    }
    return {
      $type: 'app.bsky.embed.external',
      external: {
        uri: link.uri as UriString,
        title: link.view.name,
        description: `${link.view.memberCount}/${link.view.memberLimit}`,
      },
    }
  }
  return {
    $type: 'app.bsky.embed.external',
    external: {
      uri: link.uri as UriString,
      title: link.title,
      description: link.description,
      ...(thumb ? {thumb} : {}),
      ...(link.associatedRefs ? {associatedRefs: link.associatedRefs} : {}),
    },
  }
}

function validDimensions(value: {width: number; height: number}) {
  return (
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width > 0 &&
    value.height > 0
  )
}

function addValidatedWrite(
  writes: PlannedComposerV2Write[],
  write: PlannedComposerV2Write,
  postIndex: number,
  postId: string,
) {
  if (write.$type !== 'com.atproto.repo.applyWrites#create') {
    throw failure(
      'invalid-write-input',
      'Unexpected write operation',
      postIndex,
      postId,
    )
  }
  const result =
    write.collection === 'app.bsky.feed.post'
      ? app.bsky.feed.post.$safeParse(write.value)
      : write.collection === 'app.bsky.feed.threadgate'
        ? app.bsky.feed.threadgate.$safeParse(write.value)
        : write.collection === 'app.bsky.feed.postgate'
          ? app.bsky.feed.postgate.$safeParse(write.value)
          : undefined
  if (!result?.success) {
    throw failure(
      'invalid-record',
      'Generated record failed lexicon validation',
      postIndex,
      postId,
      undefined,
      write.collection,
    )
  }
  writes.push(write)
}

function failure(
  code: ComposerV2PlanErrorCode,
  message: string,
  postIndex?: number,
  postId?: string,
  mediaId?: string,
  collection?: string,
  cause?: unknown,
): PlannerFailure {
  return new PlannerFailure(
    {
      code,
      message,
      postIndex,
      postId,
      mediaId,
      collection,
    },
    cause,
  )
}

/** Return only structural data suitable for the debug harness. */
export function summarizeComposerV2Plan(result: ComposerV2PlanResult) {
  if (!result.ok) {
    return {
      ok: false as const,
      errors: result.errors.map(({code, postIndex, collection}) => ({
        code,
        postIndex,
        collection,
      })),
    }
  }
  return {
    ok: true as const,
    postCount: result.posts.length,
    writeCount: result.writes.length,
    posts: result.posts.map(post => ({
      postId: post.postId,
      rkey: post.rkey,
      uri: post.uri,
      cid: post.cid,
      hasReply: !!post.record.reply,
      /*
       * Final reply relationship by reference only: at:// URIs are
       * structural (repo/collection/rkey), never post text.
       */
      replyRootUri: post.record.reply?.root.uri,
      replyParentUri: post.record.reply?.parent.uri,
      embedType:
        typeof post.record.embed === 'object' && post.record.embed
          ? (post.record.embed.$type ?? 'unknown')
          : undefined,
      textGraphemes: new RichText({text: post.record.text}).graphemeLength,
      tagCount: post.record.tags?.length ?? 0,
    })),
    /*
     * Gate record writes with the URI of the post each one governs, so the
     * harness can show per-post gate associations without the rule payloads.
     */
    gates: result.writes.flatMap(write => {
      if (write.$type !== 'com.atproto.repo.applyWrites#create') return []
      if (
        write.collection !== 'app.bsky.feed.threadgate' &&
        write.collection !== 'app.bsky.feed.postgate'
      ) {
        return []
      }
      const subject = (write.value as {post?: unknown}).post
      return [
        {
          collection: write.collection,
          rkey: write.rkey,
          postUri: typeof subject === 'string' ? subject : undefined,
        },
      ]
    }),
    writesByCollection: result.writes.reduce<Record<string, number>>(
      (counts, write) => {
        if (write.$type === 'com.atproto.repo.applyWrites#create') {
          counts[write.collection] = (counts[write.collection] ?? 0) + 1
        }
        return counts
      },
      {},
    ),
  }
}
