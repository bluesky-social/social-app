import {TID} from '@atproto/common-web'
import {type $Typed, type BlobRef, type Client} from '@atproto/lex'
import {
  type AtUriString,
  type DidString,
  toDatetimeString,
  type UriString,
} from '@atproto/syntax'
import {RichText} from '@bsky/sdk/richtext'

import {computeCid} from '#/lib/api/computeCid'
import {type ResolvedLink} from '#/lib/api/resolve'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {
  type MediaAttachment,
  type MediaCardValue,
  type PostMediaImage,
  type PostMediaItem,
  type PostMediaVideo,
  type ThreadReplyTarget,
  type ThreadState,
} from '#/components/ComposerV2/store/types'
import {type Gif} from '#/features/gifPicker/types'
import {app, chat, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type ComposerV2PlanErrorCode =
  | 'missing-dependency'
  | 'invalid-snapshot'
  | 'attachment-not-ready'
  | 'media-failed'
  | 'unsupported-attachment'
  | 'reply-resolution-failed'
  | 'rich-text-resolution-failed'
  | 'media-upload-failed'
  | 'invalid-record'
  | 'invalid-write-input'
  | 'unexpected-error'

export type ComposerV2PlanError = {
  code: ComposerV2PlanErrorCode
  message: string
  postIndex?: number
  postId?: string
  mediaId?: string
  collection?: string
}

export type ComposerV2PlannerDependencies = {
  /** DID that owns every planned post and gate record. */
  did: string
  /** AppView client used only for authoritative rich-text and reply-root reads. */
  appviewClient?: Client
  /** Captured once per plan. */
  now?: () => Date
  /** Deterministic seam for tests and future submit orchestration. */
  createRkey?: (index: number, createdAt: Date) => string
  /** Resolve the root of the external parent; never fabricate one from a preview. */
  resolveReplyRoot?: (
    replyTo: ThreadReplyTarget,
  ) => Promise<com.atproto.repo.strongRef.Main>
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
  constructor(readonly detail: ComposerV2PlanError) {
    super(detail.message)
  }
}

/**
 * Construct a complete, locally validated applyWrites input without writing it.
 *
 * Snapshot policy: callers pass one immutable ThreadState snapshot. The planner
 * never reads a store again, never mixes a later upload/edit into that snapshot,
 * and never waits in a React effect. An upload that completes after capture is
 * visible to the next planning attempt, while an edit during another caller's
 * preparation cannot affect the in-flight plan. Pending or failed work in the
 * captured snapshot returns a structured error instead of being serialized.
 */
export async function planComposerV2({
  snapshot,
  dependencies,
}: {
  snapshot: ThreadState
  dependencies: ComposerV2PlannerDependencies
}): Promise<ComposerV2PlanResult> {
  /* Copy the composition projection before the first await. Runtime handles
   * and upload callbacks are not part of the plan, but their current statuses
   * are. This makes concurrent store edits unable to alter this attempt. */
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
    snapshot = clonePlannerSnapshot(snapshot)
    validateSnapshot(snapshot, dependencies)
    const postEntries = Object.entries(snapshot.posts)
    if (postEntries.length === 0) {
      throw failure('invalid-snapshot', 'Composition has no posts')
    }

    const now = dependencies.now?.() ?? new Date()
    if (!Number.isFinite(now.getTime())) {
      throw failure('invalid-snapshot', 'Composition time is invalid')
    }

    const externalReplyRoot = snapshot.replyTo
      ? await resolveExternalReplyRoot(snapshot.replyTo, dependencies)
      : undefined
    const prepared = [] as Array<{
      postId: string
      post: app.bsky.feed.post.Main
    }>

    for (const [postIndex, [postId, post]] of postEntries.entries()) {
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
        createdAt: toDatetimeString(new Date(now.getTime() + postIndex)),
        text: richText.text,
        ...(richText.facets ? {facets: richText.facets} : {}),
        ...(post.langs.length ? {langs: post.langs.slice(0, 3)} : {}),
        ...(labels ? {labels} : {}),
        ...(post.tags.length ? {tags: [...post.tags]} : {}),
        ...(embed ? {embed} : {}),
      }
      prepared.push({postId, post: record})
    }

    const plannedPosts: PlannedComposerV2Post[] = []
    let previous: com.atproto.repo.strongRef.Main | undefined
    for (const [postIndex, entry] of prepared.entries()) {
      const createdAt = new Date(now.getTime() + postIndex)
      const rkey =
        dependencies.createRkey?.(postIndex, createdAt) ??
        TID.fromTime(createdAt.getTime() * 1000, 0).toString()
      const uri =
        `at://${dependencies.did}/app.bsky.feed.post/${rkey}` as AtUriString
      const parent =
        previous ??
        (snapshot.replyTo
          ? {
              uri: snapshot.replyTo.uri as AtUriString,
              cid: snapshot.replyTo.cid,
            }
          : undefined)
      const root =
        externalReplyRoot ??
        (plannedPosts[0]
          ? {
              uri: plannedPosts[0].uri as AtUriString,
              cid: plannedPosts[0].cid,
            }
          : undefined)
      const reply = root && parent ? {root, parent} : undefined
      const record: app.bsky.feed.post.Main = reply
        ? {...entry.post, reply}
        : entry.post
      const cid = await computeCid(record)
      const planned = {
        postId: entry.postId,
        rkey,
        uri,
        cid,
        record,
      }
      plannedPosts.push(planned)
      previous = {uri, cid}
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

      if (postIndex === 0 && snapshot.threadgateAllowRules !== undefined) {
        const value: app.bsky.feed.threadgate.Main = {
          $type: 'app.bsky.feed.threadgate',
          post: planned.uri as AtUriString,
          createdAt: planned.record.createdAt,
          allow: snapshot.threadgateAllowRules.map(rule => clone(rule)),
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

      if (snapshot.postgateEmbeddingRules.length > 0) {
        const value: app.bsky.feed.postgate.Main = {
          $type: 'app.bsky.feed.postgate',
          post: planned.uri as AtUriString,
          createdAt: planned.record.createdAt,
          embeddingRules: snapshot.postgateEmbeddingRules.map(rule =>
            clone(rule),
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
    if (error instanceof PlannerFailure)
      return {ok: false, errors: [error.detail]}
    return {
      ok: false,
      errors: [{code: 'unexpected-error', message: 'Record planning failed'}],
    }
  }
}

function clonePlannerSnapshot(input: ThreadState): ThreadState {
  const posts: ThreadState['posts'] = {}
  for (const [postId, post] of Object.entries(input.posts)) {
    const record = post.attachments.record
    const media = post.attachments.media
    posts[postId] = {
      ...post,
      langs: [...post.langs],
      labels: [...post.labels],
      tags: [...post.tags],
      attachments: {
        record:
          record?.state === 'resolved'
            ? {...record, record: {...record.record}}
            : record
              ? {...record}
              : undefined,
        media: cloneMediaAttachment(media),
      },
    }
  }
  return {
    ...input,
    posts,
    replyTo: input.replyTo
      ? {
          ...input.replyTo,
          langs: [...input.replyTo.langs],
        }
      : undefined,
    threadgateAllowRules: input.threadgateAllowRules?.map(rule => clone(rule)),
    postgateEmbeddingRules: input.postgateEmbeddingRules.map(rule =>
      clone(rule),
    ),
  }
}

function cloneMediaAttachment(media: MediaAttachment | undefined) {
  if (!media || media.state !== 'resolved')
    return media ? {...media} : undefined
  if (media.kind === 'images') {
    return {
      ...media,
      items: media.items.map(item => ({
        ...item,
        upload: {...item.upload},
        prepared: item.prepared ? {...item.prepared} : undefined,
      })),
    }
  }
  if (media.kind === 'video') {
    return {
      ...media,
      item: {
        ...media.item,
        upload: {...media.item.upload},
        captions: media.item.captions.map(caption => ({...caption})),
        captionBlobs: media.item.captionBlobs.map(caption => ({...caption})),
        prepared: media.item.prepared ? {...media.item.prepared} : undefined,
      },
    }
  }
  return {...media}
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
  try {
    const trimmedText = text.replace(/^((?:\s*\n)+)/, '').trimEnd()
    const richText = new RichText({text: trimmedText}, {cleanNewlines: true})
    if (!appviewClient) {
      throw failure(
        'missing-dependency',
        'An AppView client is required for rich-text resolution',
        postIndex,
        postId,
      )
    }
    await richText.detectFacets(appviewClient)
    return stripInvalidMentions(shortenLinks(richText))
  } catch (error) {
    if (error instanceof PlannerFailure) throw error
    throw failure(
      'rich-text-resolution-failed',
      'Rich-text resolution failed',
      postIndex,
      postId,
    )
  }
}

async function resolveExternalReplyRoot(
  replyTo: ThreadReplyTarget,
  dependencies: ComposerV2PlannerDependencies,
): Promise<com.atproto.repo.strongRef.Main> {
  if (dependencies.resolveReplyRoot) {
    try {
      return await dependencies.resolveReplyRoot(replyTo)
    } catch {
      throw failure(
        'reply-resolution-failed',
        'Reply root could not be resolved',
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
    const parent = data.posts[0]
    if (!parent) throw new Error('missing')
    if (
      bsky.matches(app.bsky.feed.post, parent.record) &&
      parent.record.reply
    ) {
      return parent.record.reply.root
    }
    return {uri: parent.uri, cid: parent.cid}
  } catch {
    throw failure('reply-resolution-failed', 'Reply root could not be resolved')
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
    try {
      const resolved = await resolve(media.item.gif)
      return externalRecord(resolved, context)
    } catch {
      throw failure(
        'media-upload-failed',
        'GIF embed preparation failed',
        context.postIndex,
        context.postId,
        media.item.id,
      )
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
    } catch {
      throw failure(
        'media-upload-failed',
        'External thumbnail upload failed',
        context.postIndex,
        context.postId,
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
): PlannerFailure {
  return new PlannerFailure({
    code,
    message,
    postIndex,
    postId,
    mediaId,
    collection,
  })
}

function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, clone(entry)]),
    ) as T
  }
  return value
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
      embedType:
        typeof post.record.embed === 'object' && post.record.embed
          ? (post.record.embed.$type ?? 'unknown')
          : undefined,
      textGraphemes: new RichText({text: post.record.text}).graphemeLength,
      tagCount: post.record.tags?.length ?? 0,
    })),
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
