import {AtUri} from '@atproto/syntax'
import {RichText} from '@bsky/sdk/richtext'

import {insertMentionAt} from '#/lib/strings/mention-manip'
import {type ComposerOpts} from '#/state/shell/composer'
import {suggestLinkCardUri} from '#/view/com/composer/text-input/text-input-util'
import {
  type ComposerV2OnError,
  isComposerV2Cancellation,
  reportComposerV2Error,
} from '#/components/ComposerV2/errors'
import {
  type MediaAttachmentInput,
  type PostMediaImageInput,
  type PostMediaVideoInput,
  type RecordAttachmentInput,
  type ThreadReplyTarget,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {classifyUriTarget} from '#/components/ComposerV2/store/utils/classifyUriTarget'
import {type Gif} from '#/features/gifPicker/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

const TENOR_HOSTNAME = 'media.tenor.com'
const KLIPY_HOSTNAME = 'static.klipy.com'

export type ComposerAdapterErrorCode =
  | 'conflicting-explicit-media'
  | 'conflicting-attachments'
  | 'oversized-images'
  | 'missing-local-media'
  | 'unsupported-gallery-entry'
  | 'unsupported-record'
  | 'unsupported-labels'

/** A stable, source-local error for input that cannot be represented by V2. */
export class ComposerAdapterError extends Error {
  constructor(
    readonly code: ComposerAdapterErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ComposerAdapterError'
  }
}

/*
 * Neither adapter reads media. Sources pass through with the metadata they
 * already carry, and the upload workers resolve anything missing.
 */
export type AdapterOptions = {
  /** Omit when an owning caller reports the initialization rejection instead. */
  onError?: ComposerV2OnError
  /** Defaults used for a new composition; drafts use their own saved values. */
  postInteractionSettings?: app.bsky.actor.defs.PostInteractionSettingsPref
}

export type DraftToInitialStateInput = AdapterOptions & {
  draftId: string
  draft: app.bsky.draft.defs.Draft
  /**
   * Local ref paths mapped to the URIs draft storage loaded: native file URIs,
   * or web object URLs. The caller owns them and must keep them readable for
   * the store's lifetime, because upload retries read the source again.
   */
  loadedMedia: ReadonlyMap<string, string>
}

/**
 * Convert an open-composer intent into the source-independent V2 input.
 *
 * A video intent has no MIME type or duration in the shell contract. The
 * adapter passes the source through and the video worker resolves the missing
 * metadata, so the source is not probed twice. It still returns a promise, and
 * rejects rather than throws, so callers can treat both adapters alike.
 */
export function composerOptsToInitialState({
  composerOpts,
  ...options
}: AdapterOptions & {
  composerOpts: ComposerOpts
}): Promise<ThreadStoreInitialState> {
  return new Promise<ThreadStoreInitialState>(resolve =>
    resolve(normalizeComposerOpts({composerOpts, ...options})),
  ).catch((cause: unknown) => {
    reportInitializationError({onError: options.onError, cause})
    throw cause
  })
}

function normalizeComposerOpts({
  composerOpts: opts,
  postInteractionSettings,
}: AdapterOptions & {
  composerOpts: ComposerOpts
}): ThreadStoreInitialState {
  const imageUris = opts.imageUris?.length ? opts.imageUris : undefined
  if (imageUris && opts.videoUri) {
    throw new ComposerAdapterError(
      'conflicting-explicit-media',
      'Composer intent contains both images and video',
    )
  }
  if (imageUris && imageUris.length > 10) {
    throw new ComposerAdapterError(
      'oversized-images',
      'Composer intent contains too many images',
    )
  }

  const text = opts.text
    ? opts.text
    : opts.mention
      ? insertMentionAt(
          `@${opts.mention}`,
          opts.mention.length + 1,
          `${opts.mention}`,
        )
      : ''

  const explicitMedia = imageUris
    ? ({
        kind: 'images',
        items: imageUris.map(image => ({
          uri: image.uri,
          width: image.width,
          height: image.height,
          altText: image.altText,
        })),
      } satisfies MediaAttachmentInput)
    : opts.videoUri
      ? ({
          kind: 'video',
          item: {
            uri: opts.videoUri.uri,
            width: opts.videoUri.width,
            height: opts.videoUri.height,
          },
        } satisfies MediaAttachmentInput)
      : undefined

  const explicitRecord = opts.quote
    ? ({
        kind: 'post',
        record: {uri: opts.quote.uri, cid: opts.quote.cid},
        view: opts.quote,
      } satisfies RecordAttachmentInput)
    : undefined

  const detected = detectInitialLinks({text})
  const record =
    explicitRecord ??
    (detected.recordUri
      ? ({kind: 'uri', uri: detected.recordUri} satisfies RecordAttachmentInput)
      : undefined)
  const media =
    explicitMedia ??
    (!explicitMedia && detected.mediaUri
      ? ({kind: 'uri', uri: detected.mediaUri} satisfies MediaAttachmentInput)
      : undefined)

  return {
    replyTo: opts.replyTo ? toReplyTarget({replyTo: opts.replyTo}) : undefined,
    threadgateAllowRules: postInteractionSettings?.threadgateAllowRules,
    postgateEmbeddingRules:
      postInteractionSettings?.postgateEmbeddingRules ?? [],
    posts: [
      {
        text,
        attachments: {
          record,
          media,
        },
      },
    ],
  }
}

/**
 * Convert a loaded draft without mounting a store or dispatching edits.
 *
 * Structural problems (missing loaded media, conflicting or unsupported
 * content) reject here. Media metadata is not read: restored images and videos
 * pass through with their durable local ref, and the upload workers prepare
 * them, so a metadata failure surfaces as that item's upload failure rather
 * than blocking the whole draft. It returns a promise, and rejects rather than
 * throws, so callers can treat both adapters alike.
 */
export function draftToInitialState({
  onError,
  ...input
}: DraftToInitialStateInput): Promise<ThreadStoreInitialState> {
  return new Promise<ThreadStoreInitialState>(resolve =>
    resolve(normalizeDraft(input)),
  ).catch((cause: unknown) => {
    reportInitializationError({onError, cause})
    throw cause
  })
}

/** For owning callers that deliberately leave adapter-level reporting off. */
export function reportInitializationError({
  onError,
  cause,
}: {
  onError: ComposerV2OnError | undefined
  cause: unknown
}) {
  const adapterError = cause instanceof ComposerAdapterError ? cause : undefined
  const hasCause = adapterError && Object.hasOwn(adapterError, 'cause')
  const diagnostic = hasCause ? adapterError.cause : cause
  if (isComposerV2Cancellation({cause: diagnostic})) return
  reportComposerV2Error({
    onError,
    event: {
      source: 'initialization',
      code: adapterError?.code ?? 'initial-state-failed',
      kind: adapterError
        ? hasCause
          ? 'operational'
          : 'validation'
        : 'unexpected',
      recovery: adapterError ? 'edit' : 'none',
    },
    cause: diagnostic,
  })
}

function normalizeDraft({
  draftId,
  draft,
  loadedMedia,
}: Omit<DraftToInitialStateInput, 'onError'>): ThreadStoreInitialState {
  const posts = draft.posts.map(post =>
    draftPostToInitialState({
      post,
      langs: draft.langs ?? [],
      loadedMedia,
    }),
  )

  return {
    draftId,
    isDirty: false,
    threadgateAllowRules: draft.threadgateAllow,
    postgateEmbeddingRules: draft.postgateEmbeddingRules ?? [],
    posts,
  }
}

function draftPostToInitialState({
  post,
  langs,
  loadedMedia,
}: {
  post: app.bsky.draft.defs.DraftPost
  langs: readonly string[]
  loadedMedia: ReadonlyMap<string, string>
}) {
  const images = restoreImages({post, loadedMedia})
  const videos = post.embedVideos ?? []
  if (videos.length > 1) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains more than one video',
    )
  }
  if (images.length > 10) {
    throw new ComposerAdapterError(
      'oversized-images',
      'Draft contains too many images',
    )
  }

  const recordRefs = post.embedRecords ?? []
  if (recordRefs.length > 1) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains more than one record attachment',
    )
  }
  const record = recordRefs[0]
    ? draftRecordToAttachment({record: recordRefs[0].record})
    : undefined

  const externals = post.embedExternals ?? []
  const externalInputs = externals.map(external =>
    draftExternalToInput({uri: external.uri}),
  )
  const gifs = externalInputs.filter(
    (input): input is Extract<MediaAttachmentInput, {kind: 'gif'}> =>
      input.kind === 'gif',
  )
  const uriInputs = externalInputs.filter(
    (input): input is Extract<MediaAttachmentInput, {kind: 'uri'}> =>
      input.kind === 'uri',
  )
  const externalRecordInputs = uriInputs.filter(
    input => classifyUriTarget({uri: input.uri}) === 'record',
  )
  const externalMediaInputs = uriInputs.filter(
    input => classifyUriTarget({uri: input.uri}) === 'media',
  )

  if (
    gifs.length > 1 ||
    externalRecordInputs.length > 1 ||
    externalMediaInputs.length > 1
  ) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains competing external attachments',
    )
  }
  if (record && externalRecordInputs.length > 0) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains competing record attachments',
    )
  }
  if (gifs.length > 0 && uriInputs.length > 0) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains both a GIF and another external attachment',
    )
  }

  const externalRecord = externalRecordInputs[0]
  const normalizedRecord = record ?? externalRecord
  const video = videos[0]
    ? restoreVideo({video: videos[0], loadedMedia})
    : undefined
  if (images.length > 0 && video) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains both images and video',
    )
  }
  if (
    images.length > 0 &&
    (gifs.length > 0 || externalMediaInputs.length > 0)
  ) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains images and another media attachment',
    )
  }
  if (video && (gifs.length > 0 || externalMediaInputs.length > 0)) {
    throw new ComposerAdapterError(
      'conflicting-attachments',
      'Draft contains video and another media attachment',
    )
  }

  let media: MediaAttachmentInput | undefined
  if (images.length > 0) {
    media = {kind: 'images', items: images}
  } else if (video) {
    media = {kind: 'video', item: video}
  } else {
    media = gifs[0] ?? externalMediaInputs[0]
  }

  return {
    text: post.text,
    langs: [...langs],
    labels: draftLabels({post}),
    attachments: {record: normalizedRecord, media},
  }
}

function restoreImages({
  post,
  loadedMedia,
}: {
  post: app.bsky.draft.defs.DraftPost
  loadedMedia: ReadonlyMap<string, string>
}): PostMediaImageInput[] {
  const entries = [...(post.embedImages ?? [])]
  if (post.embedGallery) {
    for (const item of post.embedGallery.items) {
      if (!isDraftImageEntry(item)) {
        throw new ComposerAdapterError(
          'unsupported-gallery-entry',
          'Draft gallery contains an unsupported entry',
        )
      }
      entries.push(item)
    }
  }

  /* The image worker reads dimensions; drafts do not store them. */
  return entries.map(image => ({
    uri: requireLoadedMedia({loadedMedia, path: image.localRef.path}),
    altText: image.alt,
    localRefPath: image.localRef.path,
  }))
}

/**
 * The MIME type comes from the local ref (the only type a draft records); the
 * video worker resolves dimensions, duration, and size. An `image/gif` ref
 * keeps an animated GIF file on the GIF-safe preparation path.
 */
function restoreVideo({
  video,
  loadedMedia,
}: {
  video: app.bsky.draft.defs.DraftEmbedVideo
  loadedMedia: ReadonlyMap<string, string>
}): PostMediaVideoInput {
  return {
    uri: requireLoadedMedia({loadedMedia, path: video.localRef.path}),
    mimeType: parseVideoMimeType({localRefPath: video.localRef.path}),
    altText: video.alt,
    localRefPath: video.localRef.path,
    captions: video.captions?.map(caption => ({
      lang: caption.lang,
      content: caption.content,
    })),
  }
}

function detectInitialLinks({text}: {text: string}) {
  const recordUris = new Map<
    string,
    {facet: app.bsky.richtext.facet.Main; rt: RichText}
  >()
  const mediaUris = new Map<
    string,
    {facet: app.bsky.richtext.facet.Main; rt: RichText}
  >()
  if (!text) return {recordUri: undefined, mediaUri: undefined}

  const richText = new RichText({text})
  richText.detectFacetsWithoutResolution()
  for (const facet of richText.facets ?? []) {
    for (const feature of facet.features) {
      if (!bsky.isType(app.bsky.richtext.facet.link, feature)) continue
      const uri = feature.uri
      const target = classifyUriTarget({uri})
      const match = {facet, rt: richText}
      if (target === 'record') recordUris.set(uri, match)
      else mediaUris.set(uri, match)
    }
  }

  const past = new Set<string>()
  const mediaUri = suggestLinkCardUri(true, mediaUris, new Map(), past)
  const recordUri = suggestLinkCardUri(true, recordUris, new Map(), past)
  return {recordUri, mediaUri}
}

function toReplyTarget({
  replyTo,
}: {
  replyTo: NonNullable<ComposerOpts['replyTo']>
}): ThreadReplyTarget {
  const {moderation: _moderation, ...reply} = replyTo
  return {
    uri: reply.uri,
    cid: reply.cid,
    text: reply.text,
    langs: [...(reply.langs ?? [])],
    author: cloneWithoutModeration({value: reply.author}),
    embed: reply.embed
      ? cloneWithoutModeration({value: reply.embed})
      : undefined,
  }
}

function draftRecordToAttachment({
  record,
}: {
  record: app.bsky.draft.defs.DraftEmbedRecord['record']
}): RecordAttachmentInput {
  let kind: 'post' | 'feed' | 'list' | 'starter-pack'
  try {
    const collection = new AtUri(record.uri).collection
    if (collection === 'app.bsky.feed.post') kind = 'post'
    else if (collection === 'app.bsky.feed.generator') kind = 'feed'
    else if (collection === 'app.bsky.graph.list') kind = 'list'
    else if (collection === 'app.bsky.graph.starterpack') kind = 'starter-pack'
    else throw new Error('unsupported collection')
  } catch {
    throw new ComposerAdapterError(
      'unsupported-record',
      'Draft contains an unsupported record attachment',
    )
  }
  return {kind, record: {uri: record.uri, cid: record.cid}}
}

function isDraftImageEntry(
  value: unknown,
): value is app.bsky.draft.defs.DraftEmbedImage {
  if (bsky.isType(app.bsky.draft.defs.draftEmbedImage, value)) return true
  if (!value || typeof value !== 'object') return false
  const image = value as {
    alt?: unknown
    localRef?: {path?: unknown}
  }
  return (
    (image.alt === undefined || typeof image.alt === 'string') &&
    typeof image.localRef?.path === 'string'
  )
}

function draftExternalToInput({uri}: {uri: string}): MediaAttachmentInput {
  const gif = parseDraftGif({uri})
  if (gif) return {kind: 'gif', item: {gif, altText: gif.content_description}}

  return {kind: 'uri', uri}
}

function parseDraftGif({uri}: {uri: string}): Gif | undefined {
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    return undefined
  }
  if (url.hostname !== TENOR_HOSTNAME && url.hostname !== KLIPY_HOSTNAME) {
    return undefined
  }

  const width = Number(url.searchParams.get('ww'))
  const height = Number(url.searchParams.get('hh'))
  if (!validDimensions({width, height})) return undefined
  const alt = url.searchParams.get('alt') ?? ''
  const mp4Slug = url.searchParams.get('mp4')
  const webmSlug = url.searchParams.get('webm')
  for (const key of ['ww', 'hh', 'alt', 'mp4', 'webm']) {
    url.searchParams.delete(key)
  }
  const baseUrl = url.toString()
  const format = {
    url: baseUrl,
    dims: [width, height] as [number, number],
    duration: 0,
    size: 0,
  }
  const mediaFormats: Gif['media_formats'] = {
    gif: format,
    tinygif: format,
    preview: format,
  }
  if (mp4Slug)
    mediaFormats.mp4 = {
      ...format,
      url: formatUrl({url, slug: mp4Slug, extension: 'mp4'}),
    }
  if (webmSlug)
    mediaFormats.webm = {
      ...format,
      url: formatUrl({url, slug: webmSlug, extension: 'webm'}),
    }

  return {
    id: '',
    created: 0,
    hasaudio: false,
    hascaption: false,
    flags: '',
    tags: [],
    title: alt,
    content_description: alt,
    itemurl: baseUrl,
    url: baseUrl,
    media_formats: mediaFormats,
  }
}

function formatUrl({
  url,
  slug,
  extension,
}: {
  url: URL
  slug: string
  extension: string
}) {
  const formatted = new URL(url.href)
  const parts = formatted.pathname.split('/')
  parts[parts.length - 1] = `${slug}.${extension}`
  formatted.pathname = parts.join('/')
  return formatted.toString()
}

function draftLabels({post}: {post: app.bsky.draft.defs.DraftPost}): string[] {
  if (!post.labels) return []
  const values = (post.labels as {values?: unknown}).values
  if (!Array.isArray(values)) {
    throw new ComposerAdapterError(
      'unsupported-labels',
      'Draft labels are not supported',
    )
  }
  return values.map(value => {
    if (
      !value ||
      typeof value !== 'object' ||
      typeof (value as {val?: unknown}).val !== 'string'
    ) {
      throw new ComposerAdapterError(
        'unsupported-labels',
        'Draft labels are not supported',
      )
    }
    return (value as {val: string}).val
  })
}

function requireLoadedMedia({
  loadedMedia,
  path,
}: {
  loadedMedia: ReadonlyMap<string, string>
  path: string
}) {
  const uri = loadedMedia.get(path)
  if (!uri) {
    throw new ComposerAdapterError(
      'missing-local-media',
      'Draft references media that is not loaded',
    )
  }
  return uri
}

function parseVideoMimeType({localRefPath}: {localRefPath: string}): string {
  const parts = localRefPath.split(':')
  if (parts.length >= 3 && parts[1].includes('/')) return parts[1]
  return 'video/mp4'
}

function validDimensions(value: {
  width?: number
  height?: number
}): value is {width: number; height: number} {
  return (
    typeof value.width === 'number' &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    typeof value.height === 'number' &&
    Number.isFinite(value.height) &&
    value.height > 0
  )
}

function cloneWithoutModeration<T>({value}: {value: T}): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneWithoutModeration({value: item})) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        key === 'moderation'
          ? []
          : [[key, cloneWithoutModeration({value: item})]],
      ),
    ) as T
  }
  return value
}
