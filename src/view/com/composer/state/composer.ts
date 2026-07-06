import {type ImagePickerAsset} from 'expo-image-picker'
import {
  type AppBskyActorDefs,
  type AppBskyDraftDefs,
  type AppBskyFeedPostgate,
  AppBskyRichtextFacet,
  RichText,
} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {type VideoTelemetry} from '#/lib/media/video/telemetry'
import {type SelfLabel} from '#/lib/moderation'
import {insertMentionAt} from '#/lib/strings/mention-manip'
import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {
  isBskyPostUrl,
  postUriToRelativePath,
  toBskyAppUrl,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {type ComposerImage, createInitialImages} from '#/state/gallery'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {threadgateRecordToAllowUISetting} from '#/state/queries/threadgate'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {type ComposerOpts} from '#/state/shell/composer'
import {
  type LinkFacetMatch,
  suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util'
import {type Gif} from '#/features/gifPicker/types'
import {
  createVideoState,
  type VideoAction,
  videoReducer,
  type VideoState,
} from './video'

type ImagesMedia = {
  type: 'images'
  images: ComposerImage[]
}

type GalleryMedia = {
  type: 'gallery'
  images: ComposerImage[]
}

type VideoMedia = {
  type: 'video'
  video: VideoState
}

type GifMedia = {
  type: 'gif'
  gif: Gif
  alt: string
}

type Link = {
  type: 'link'
  uri: string
}

// This structure doesn't exactly correspond to the data model.
// Instead, it maps to how the UI is organized, and how we present a post.
export type EmbedDraft = {
  // We'll always submit quote and actual media (images, video, gifs) chosen by the user.
  quote: Link | undefined
  media: ImagesMedia | GalleryMedia | VideoMedia | GifMedia | undefined
  // This field may end up ignored if we have more important things to display than a link card:
  link: Link | undefined
}

export type PostDraft = {
  id: string
  richtext: RichText
  labels: SelfLabel[]
  embed: EmbedDraft
  shortenedGraphemeLength: number
}

export type PostAction =
  | {type: 'update_richtext'; richtext: RichText}
  | {type: 'update_labels'; labels: SelfLabel[]}
  | {
      type: 'embed_add_images'
      images: ComposerImage[]
      preferredLayout?: ImageLayout
    }
  | {type: 'embed_update_image'; image: ComposerImage}
  | {
      type: 'embed_remove_image'
      image: ComposerImage
      preferredLayout?: ImageLayout
    }
  | {type: 'embed_set_image_layout'; layout: ImageLayout}
  | {
      type: 'embed_add_video'
      asset: ImagePickerAsset
      abortController: AbortController
      telemetry: VideoTelemetry
    }
  | {type: 'embed_remove_video'}
  | {type: 'embed_update_video'; videoAction: VideoAction}
  | {type: 'embed_add_uri'; uri: string}
  | {type: 'embed_remove_quote'}
  | {type: 'embed_remove_link'}
  | {type: 'embed_add_gif'; gif: Gif}
  | {type: 'embed_update_gif'; alt: string}
  | {type: 'embed_remove_gif'}

export type ThreadDraft = {
  posts: PostDraft[]
  postgate: AppBskyFeedPostgate.Record
  threadgate: ThreadgateAllowUISetting[]
}

export type ComposerState = {
  thread: ThreadDraft
  activePostIndex: number
  mutableNeedsFocusActive: boolean
  /** ID of the draft being edited, if any. Used to update existing draft on save. */
  draftId?: string
  /** Whether the composer has been modified since loading a draft. */
  isDirty: boolean
  /** Map of localId -> loaded media path/URL for the current draft. Used for re-saving without re-copying media. */
  loadedMediaMap?: Map<string, string>
  /** Set of original localRef paths from the draft being edited. Used to identify orphaned media on save. */
  originalLocalRefs?: Set<string>
}

export type ComposerAction =
  | {type: 'update_postgate'; postgate: AppBskyFeedPostgate.Record}
  | {type: 'update_threadgate'; threadgate: ThreadgateAllowUISetting[]}
  | {
      type: 'update_post'
      postId: string
      postAction: PostAction
    }
  | {
      type: 'add_post'
    }
  | {
      type: 'remove_post'
      postId: string
    }
  | {
      type: 'focus_post'
      postId: string
    }
  | {
      type: 'restore_from_draft'
      draftId: string
      posts: PostDraft[]
      threadgateAllow: AppBskyDraftDefs.Draft['threadgateAllow']
      postgateEmbeddingRules: AppBskyDraftDefs.Draft['postgateEmbeddingRules']

      /** Map of localRefPath -> loaded media path/URL */
      loadedMedia: Map<string, string>
      /** Set of original localRef paths from the draft. Used to identify orphaned media on save. */
      originalLocalRefs: Set<string>
    }
  | {
      type: 'clear'
      initInteractionSettings:
        | AppBskyActorDefs.PostInteractionSettingsPref
        | undefined
    }
  | {
      type: 'mark_saved'
      draftId: string
    }

/**
 * Threshold for picking between embed variants. <= this count uses the
 * legacy `app.bsky.embed.images` shape; > this count promotes to
 * `app.bsky.embed.gallery`. Named to flag that if/when we deprecate the
 * legacy images embed entirely, this constant (and the variant split it
 * gates) should go away.
 */
export const LEGACY_IMAGES_EMBED_MAX = 4
export const MAX_GALLERY_IMAGES = 10

/**
 * How a set of images is displayed in the final post. Maps to the embed
 * variant: `grid` is the legacy `app.bsky.embed.images` shape, `carousel`
 * is the newer `app.bsky.embed.gallery` shape.
 */
export type ImageLayout = 'grid' | 'carousel'

/**
 * Whether the user can pick between the grid and carousel layouts for the
 * given media. Only image media with 2 to 4 images qualifies: a single
 * image renders the same either way, and >4 images always requires the
 * gallery embed.
 */
export function canToggleImageLayout(
  media: EmbedDraft['media'],
): media is ImagesMedia | GalleryMedia {
  return (
    (media?.type === 'images' || media?.type === 'gallery') &&
    media.images.length >= 2 &&
    media.images.length <= LEGACY_IMAGES_EMBED_MAX
  )
}

/**
 * Picks the embed variant for a set of images. A single image always uses the
 * legacy `app.bsky.embed.images` shape (it renders identically either way) and
 * >4 images always promote to `app.bsky.embed.gallery`. For 2-4 images the
 * `preferredLayout` decides: `carousel` uses the gallery shape, `grid` (the
 * default) keeps the legacy images shape. Anything beyond the gallery cap is
 * dropped by the hard slice; callers should already have enforced the cap
 * upstream (picker, paste, etc), and the reducer logs a warning when the cap
 * is exceeded so the UI layer can surface a toast.
 */
function imagesToMediaVariant(
  images: ComposerImage[],
  preferredLayout: ImageLayout = 'grid',
): ImagesMedia | GalleryMedia {
  if (images.length > LEGACY_IMAGES_EMBED_MAX) {
    return {type: 'gallery', images: images.slice(0, MAX_GALLERY_IMAGES)}
  }
  if (images.length >= 2 && preferredLayout === 'carousel') {
    return {type: 'gallery', images}
  }
  return {type: 'images', images: images.slice(0, LEGACY_IMAGES_EMBED_MAX)}
}

export function composerReducer(
  state: ComposerState,
  action: ComposerAction,
): ComposerState {
  switch (action.type) {
    case 'update_postgate': {
      return {
        ...state,
        isDirty: true,
        thread: {
          ...state.thread,
          postgate: action.postgate,
        },
      }
    }
    case 'update_threadgate': {
      return {
        ...state,
        isDirty: true,
        thread: {
          ...state.thread,
          threadgate: action.threadgate,
        },
      }
    }
    case 'update_post': {
      let nextPosts = state.thread.posts
      const postIndex = state.thread.posts.findIndex(
        p => p.id === action.postId,
      )
      if (postIndex !== -1) {
        nextPosts = state.thread.posts.slice()
        nextPosts[postIndex] = postReducer(
          state.thread.posts[postIndex],
          action.postAction,
        )
      }
      return {
        ...state,
        isDirty: true,
        thread: {
          ...state.thread,
          posts: nextPosts,
        },
      }
    }
    case 'add_post': {
      const activePostIndex = state.activePostIndex
      const nextPosts = [...state.thread.posts]
      nextPosts.splice(activePostIndex + 1, 0, {
        id: nanoid(),
        richtext: new RichText({text: ''}),
        shortenedGraphemeLength: 0,
        labels: [],
        embed: {
          quote: undefined,
          media: undefined,
          link: undefined,
        },
      })
      return {
        ...state,
        isDirty: true,
        thread: {
          ...state.thread,
          posts: nextPosts,
        },
      }
    }
    case 'remove_post': {
      if (state.thread.posts.length < 2) {
        return state
      }
      let nextActivePostIndex = state.activePostIndex
      const indexToRemove = state.thread.posts.findIndex(
        p => p.id === action.postId,
      )
      let nextPosts = [...state.thread.posts]
      if (indexToRemove !== -1) {
        const postToRemove = state.thread.posts[indexToRemove]
        if (postToRemove.embed.media?.type === 'video') {
          postToRemove.embed.media.video.abortController.abort()
        }
        nextPosts.splice(indexToRemove, 1)
        nextActivePostIndex = Math.max(0, indexToRemove - 1)
      }
      return {
        ...state,
        isDirty: true,
        activePostIndex: nextActivePostIndex,
        mutableNeedsFocusActive: true,
        thread: {
          ...state.thread,
          posts: nextPosts,
        },
      }
    }
    case 'focus_post': {
      const nextActivePostIndex = state.thread.posts.findIndex(
        p => p.id === action.postId,
      )
      if (nextActivePostIndex === -1) {
        return state
      }
      return {
        ...state,
        activePostIndex: nextActivePostIndex,
      }
    }
    case 'restore_from_draft': {
      const {
        draftId,
        posts,
        threadgateAllow,
        postgateEmbeddingRules,
        loadedMedia,
        originalLocalRefs,
      } = action

      return {
        activePostIndex: 0,
        mutableNeedsFocusActive: true,
        draftId,
        isDirty: false,
        loadedMediaMap: loadedMedia,
        originalLocalRefs,
        thread: {
          posts,
          postgate: createPostgateRecord({
            post: '',
            embeddingRules: postgateEmbeddingRules,
          }),
          threadgate: threadgateRecordToAllowUISetting({
            $type: 'app.bsky.feed.threadgate',
            post: '',
            createdAt: new Date().toString(),
            allow: threadgateAllow,
          }),
        },
      }
    }
    case 'clear': {
      return createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: [],
        initQuoteUri: undefined,
        initInteractionSettings: action.initInteractionSettings,
      })
    }
    case 'mark_saved': {
      return {
        ...state,
        isDirty: false,
        draftId: action.draftId,
      }
    }
  }
}

function postReducer(state: PostDraft, action: PostAction): PostDraft {
  switch (action.type) {
    case 'update_richtext': {
      return {
        ...state,
        richtext: action.richtext,
        shortenedGraphemeLength: getShortenedLength(action.richtext),
      }
    }
    case 'update_labels': {
      return {
        ...state,
        labels: action.labels,
      }
    }
    case 'embed_add_images': {
      if (action.images.length === 0) {
        return state
      }
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      const prevCount =
        prevMedia?.type === 'images' || prevMedia?.type === 'gallery'
          ? prevMedia.images.length
          : 0
      const incomingCount = prevCount + action.images.length
      if (incomingCount > MAX_GALLERY_IMAGES) {
        // Defense in depth: callers (applyGalleryCap in Composer) should have
        // already trimmed and surfaced a toast. The hard slice in
        // imagesToMediaVariant still drops the excess so the cap holds.
        logger.warn('composer: image add exceeds MAX_GALLERY_IMAGES', {
          prevCount,
          incomingCount,
          dropped: incomingCount - MAX_GALLERY_IMAGES,
        })
      }
      if (!prevMedia) {
        nextMedia = imagesToMediaVariant(action.images, action.preferredLayout)
      } else if (prevMedia.type === 'images' || prevMedia.type === 'gallery') {
        /*
         * Re-pick using the caller's current effective preference. Because an
         * explicit toggle also persists to that preference, this keeps the
         * shape consistent as the set grows: a carousel preference stays
         * gallery, a grid preference stays legacy images. The count guards in
         * imagesToMediaVariant still force gallery past the legacy cap.
         */
        nextMedia = imagesToMediaVariant(
          [...prevMedia.images, ...action.images],
          action.preferredLayout,
        )
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_image': {
      const prevMedia = state.embed.media
      if (prevMedia?.type === 'images' || prevMedia?.type === 'gallery') {
        const updatedImage = action.image
        const nextMedia = {
          ...prevMedia,
          images: prevMedia.images.map(img => {
            if (img.source.id === updatedImage.source.id) {
              return updatedImage
            }
            return img
          }),
        }
        return {
          ...state,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_remove_image': {
      const prevMedia = state.embed.media
      let nextLabels = state.labels
      if (prevMedia?.type === 'images' || prevMedia?.type === 'gallery') {
        const removedImage = action.image
        const remainingImages = prevMedia.images.filter(img => {
          return img.source.id !== removedImage.source.id
        })
        let nextMedia: ImagesMedia | GalleryMedia | undefined
        if (remainingImages.length === 0) {
          nextMedia = undefined
          if (!state.embed.link) {
            nextLabels = []
          }
        } else {
          /*
           * Re-pick using the caller's current effective preference so a
           * gallery that shrinks to <=4 demotes back to legacy `images` for
           * grid users (keeping old clients rendering it), while a carousel
           * preference keeps it a gallery. imagesToMediaVariant still forces
           * gallery above the legacy cap and images for a lone remaining image.
           */
          nextMedia = imagesToMediaVariant(
            remainingImages,
            action.preferredLayout,
          )
        }
        return {
          ...state,
          labels: nextLabels,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_set_image_layout': {
      const prevMedia = state.embed.media
      /*
       * Only 2-4 images can move between the two shapes: adding or removing
       * images re-picks the variant via imagesToMediaVariant, so an explicit
       * layout choice only holds while the count stays in that range.
       */
      if (!canToggleImageLayout(prevMedia)) {
        return state
      }
      const nextType = action.layout === 'carousel' ? 'gallery' : 'images'
      if (prevMedia.type === nextType) {
        return state
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: {
            type: nextType,
            images: prevMedia.images,
          },
        },
      }
    }
    case 'embed_add_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'video',
          video: createVideoState(
            action.asset,
            action.abortController,
            action.telemetry,
          ),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_video': {
      const videoAction = action.videoAction
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        nextMedia = {
          ...prevMedia,
          video: videoReducer(prevMedia.video, videoAction),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_remove_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        prevMedia.video.abortController.abort()
        nextMedia = undefined
      }
      let nextLabels = state.labels
      if (!state.embed.link) {
        nextLabels = []
      }
      return {
        ...state,
        labels: nextLabels,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_add_uri': {
      const prevQuote = state.embed.quote
      const prevLink = state.embed.link
      let nextQuote = prevQuote
      let nextLink = prevLink
      if (isBskyPostUrl(action.uri)) {
        if (!prevQuote) {
          nextQuote = {
            type: 'link',
            uri: action.uri,
          }
        }
      } else {
        if (!prevLink) {
          nextLink = {
            type: 'link',
            uri: action.uri,
          }
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          quote: nextQuote,
          link: nextLink,
        },
      }
    }
    case 'embed_remove_link': {
      let nextLabels = state.labels
      if (!state.embed.media) {
        nextLabels = []
      }
      return {
        ...state,
        labels: nextLabels,
        embed: {
          ...state.embed,
          link: undefined,
        },
      }
    }
    case 'embed_remove_quote': {
      return {
        ...state,
        embed: {
          ...state.embed,
          quote: undefined,
        },
      }
    }
    case 'embed_add_gif': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'gif',
          gif: action.gif,
          alt: '',
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_gif': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'gif') {
        nextMedia = {
          ...prevMedia,
          alt: action.alt,
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_remove_gif': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'gif') {
        nextMedia = undefined
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
  }
}

export function createComposerState({
  initText,
  initMention,
  initImageUris,
  initImageLayout = 'grid',
  initQuoteUri,
  initInteractionSettings,
}: {
  initText: string | undefined
  initMention: string | undefined
  initImageUris: ComposerOpts['imageUris']
  /**
   * Preferred layout for a fresh 2-4 image set supplied via `initImageUris`
   * (e.g. share intents). Defaults to `grid` to preserve legacy behavior.
   */
  initImageLayout?: ImageLayout
  initQuoteUri: string | undefined
  initInteractionSettings:
    | AppBskyActorDefs.PostInteractionSettingsPref
    | undefined
}): ComposerState {
  let media: ImagesMedia | GalleryMedia | undefined
  if (initImageUris?.length) {
    media = imagesToMediaVariant(
      createInitialImages(initImageUris),
      initImageLayout,
    )
  }
  let quote: Link | undefined
  if (initQuoteUri) {
    // TODO: Consider passing the app url directly.
    const path = postUriToRelativePath(initQuoteUri)
    if (path) {
      quote = {
        type: 'link',
        uri: toBskyAppUrl(path),
      }
    }
  }
  const initRichText = new RichText({
    text: initText
      ? initText
      : initMention
        ? insertMentionAt(
            `@${initMention}`,
            initMention.length + 1,
            `${initMention}`,
          )
        : '',
  })

  let link: Link | undefined

  /**
   * `initText` atm is only used for compose intents, meaning share links from
   * external sources. If `initText` is defined, we want to extract links/posts
   * from `initText` and suggest them as embeds.
   *
   * This checks for posts separately from other types of links so that posts
   * can become quotes. The util `suggestLinkCardUri` is then applied to ensure
   * we suggest at most 1 of each.
   */
  if (initText) {
    initRichText.detectFacetsWithoutResolution()
    const detectedExtUris = new Map<string, LinkFacetMatch>()
    const detectedPostUris = new Map<string, LinkFacetMatch>()
    if (initRichText.facets) {
      for (const facet of initRichText.facets) {
        for (const feature of facet.features) {
          if (AppBskyRichtextFacet.isLink(feature)) {
            if (isBskyPostUrl(feature.uri)) {
              detectedPostUris.set(feature.uri, {facet, rt: initRichText})
            } else {
              detectedExtUris.set(feature.uri, {facet, rt: initRichText})
            }
          }
        }
      }
    }
    const pastSuggestedUris = new Set<string>()
    const suggestedExtUri = suggestLinkCardUri(
      true,
      detectedExtUris,
      new Map(),
      pastSuggestedUris,
    )
    if (suggestedExtUri) {
      link = {
        type: 'link',
        uri: suggestedExtUri,
      }
    }
    const suggestedPostUri = suggestLinkCardUri(
      true,
      detectedPostUris,
      new Map(),
      pastSuggestedUris,
    )
    if (suggestedPostUri) {
      /*
       * `initQuote` is only populated via in-app user action, but we're being
       * future-defensive here.
       */
      if (!quote) {
        quote = {
          type: 'link',
          uri: suggestedPostUri,
        }
      }
    }
  } else if (initMention) {
    // highlight the mention
    initRichText.detectFacetsWithoutResolution()
  }

  return {
    activePostIndex: 0,
    mutableNeedsFocusActive: false,
    isDirty: false,
    thread: {
      posts: [
        {
          id: nanoid(),
          richtext: initRichText,
          shortenedGraphemeLength: getShortenedLength(initRichText),
          labels: [],
          embed: {
            quote,
            media,
            link,
          },
        },
      ],
      postgate: createPostgateRecord({
        post: '',
        embeddingRules: initInteractionSettings?.postgateEmbeddingRules || [],
      }),
      threadgate: threadgateRecordToAllowUISetting({
        $type: 'app.bsky.feed.threadgate',
        post: '',
        createdAt: new Date().toString(),
        allow: initInteractionSettings?.threadgateAllowRules,
      }),
    },
  }
}

function getShortenedLength(rt: RichText) {
  return shortenLinks(rt).graphemeLength
}
